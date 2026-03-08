use std::sync::Mutex;
use std::time::{Duration, Instant};

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::RngCore;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_store::StoreExt;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

const CONFIG_STORE: &str = "config.json";
const CLIENT_ID_KEY: &str = "gmailClientId";
const CLIENT_SECRET_KEY: &str = "gmailClientSecret";
const REFRESH_TOKEN_KEY: &str = "gmailRefreshToken";

const AUTH_ENDPOINT: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT: &str = "https://oauth2.googleapis.com/token";
const LABELS_ENDPOINT: &str = "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX";
const GMAIL_SCOPE: &str = "https://www.googleapis.com/auth/gmail.readonly";

// In-memory cache: (access_token, expiry)
static CACHED_TOKEN: Mutex<Option<(String, Instant)>> = Mutex::new(None);

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<u64>,
}

#[derive(Deserialize)]
struct LabelInfo {
    #[serde(rename = "messagesUnread")]
    messages_unread: Option<i32>,
}

// ── Store helpers ────────────────────────────────────────────────────────────

pub fn get_client_id(app: &AppHandle) -> Option<String> {
    app.store(CONFIG_STORE)
        .ok()?
        .get(CLIENT_ID_KEY)
        .and_then(|v| v.as_str().map(String::from))
}

pub fn save_client_id(app: &AppHandle, client_id: &str) -> Result<(), String> {
    let store = app.store(CONFIG_STORE).map_err(|e| e.to_string())?;
    store.set(CLIENT_ID_KEY, client_id);
    store.save().map_err(|e| e.to_string())
}

pub fn get_client_secret(app: &AppHandle) -> Option<String> {
    app.store(CONFIG_STORE)
        .ok()?
        .get(CLIENT_SECRET_KEY)
        .and_then(|v| v.as_str().map(String::from))
}

pub fn save_client_secret(app: &AppHandle, client_secret: &str) -> Result<(), String> {
    let store = app.store(CONFIG_STORE).map_err(|e| e.to_string())?;
    store.set(CLIENT_SECRET_KEY, client_secret);
    store.save().map_err(|e| e.to_string())
}

fn get_refresh_token(app: &AppHandle) -> Option<String> {
    app.store(CONFIG_STORE)
        .ok()?
        .get(REFRESH_TOKEN_KEY)
        .and_then(|v| v.as_str().map(String::from))
}

fn save_refresh_token(app: &AppHandle, token: &str) -> Result<(), String> {
    let store = app.store(CONFIG_STORE).map_err(|e| e.to_string())?;
    store.set(REFRESH_TOKEN_KEY, token);
    store.save().map_err(|e| e.to_string())
}

pub fn clear_auth(app: &AppHandle) -> Result<(), String> {
    let store = app.store(CONFIG_STORE).map_err(|e| e.to_string())?;
    store.delete(REFRESH_TOKEN_KEY);
    store.save().map_err(|e| e.to_string())?;
    if let Ok(mut cache) = CACHED_TOKEN.lock() {
        *cache = None;
    }
    Ok(())
}

/// Returns (has_client_id, has_client_secret, is_authenticated)
pub fn auth_status(app: &AppHandle) -> (bool, bool, bool) {
    (
        get_client_id(app).is_some(),
        get_client_secret(app).is_some(),
        get_refresh_token(app).is_some(),
    )
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

fn generate_code_verifier() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn generate_code_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

// ── Token management ─────────────────────────────────────────────────────────

async fn get_access_token(app: &AppHandle) -> Result<String, String> {
    // Return cached token if still valid
    if let Ok(cache) = CACHED_TOKEN.lock() {
        if let Some((token, expiry)) = &*cache {
            if Instant::now() < *expiry {
                return Ok(token.clone());
            }
        }
    }

    let client_id = get_client_id(app).ok_or("Gmail client ID not configured.")?;
    let client_secret = get_client_secret(app).ok_or("Gmail client secret not configured.")?;
    let refresh_token = get_refresh_token(app)
        .ok_or("Not authenticated. Please connect your Gmail account.")?;

    let client = reqwest::Client::new();
    let refresh_resp = client
        .post(TOKEN_ENDPOINT)
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Token refresh failed: {}", e))?;

    if !refresh_resp.status().is_success() {
        let status = refresh_resp.status().as_u16();
        let body = refresh_resp
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        return Err(format!("Token refresh failed (HTTP {}): {}", status, body));
    }

    let resp: TokenResponse = refresh_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let expires_in = resp.expires_in.unwrap_or(3600);
    let expiry = Instant::now() + Duration::from_secs(expires_in.saturating_sub(60));

    if let Ok(mut cache) = CACHED_TOKEN.lock() {
        *cache = Some((resp.access_token.clone(), expiry));
    }
    Ok(resp.access_token)
}

// ── OAuth2 PKCE flow ──────────────────────────────────────────────────────────

pub async fn start_oauth_flow(app: &AppHandle) -> Result<(), String> {
    let client_id = get_client_id(app).ok_or(
        "Gmail client ID not configured. Please enter your Google OAuth credentials first.",
    )?;
    let client_secret = get_client_secret(app).ok_or(
        "Gmail client secret not configured. Please enter your Google OAuth credentials first.",
    )?;

    let code_verifier = generate_code_verifier();
    let code_challenge = generate_code_challenge(&code_verifier);

    // Bind to a random loopback port for the redirect
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to start local server: {}", e))?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}", port);

    let auth_url = format!(
        "{endpoint}?client_id={cid}&redirect_uri={redir}&response_type=code\
        &scope={scope}&code_challenge={challenge}&code_challenge_method=S256\
        &access_type=offline&prompt=consent",
        endpoint = AUTH_ENDPOINT,
        cid = urlencoding::encode(&client_id),
        redir = urlencoding::encode(&redirect_uri),
        scope = urlencoding::encode(GMAIL_SCOPE),
        challenge = code_challenge,
    );

    app.opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    // Wait up to 2 minutes for the user to complete the flow
    let code = tokio::time::timeout(
        Duration::from_secs(120),
        wait_for_auth_code(listener),
    )
    .await
    .map_err(|_| "OAuth timeout: no response within 2 minutes".to_string())??;

    // Exchange authorization code for tokens
    let client = reqwest::Client::new();
    let exchange_resp = client
        .post(TOKEN_ENDPOINT)
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code.as_str()),
            ("code_verifier", code_verifier.as_str()),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect_uri.as_str()),
        ])
        .send()
        .await
        .map_err(|e| format!("Token exchange failed: {}", e))?;

    if !exchange_resp.status().is_success() {
        let status = exchange_resp.status().as_u16();
        let body = exchange_resp
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        return Err(format!("Token exchange failed (HTTP {}): {}", status, body));
    }

    let token_resp: TokenResponse = exchange_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let refresh_token = token_resp
        .refresh_token
        .ok_or("Google did not return a refresh token. Make sure your OAuth app type is 'Desktop app' and try again.")?;

    // Cache the access token from the initial exchange to avoid an immediate refresh call
    if let Some(expires_in) = token_resp.expires_in {
        let expiry = Instant::now() + Duration::from_secs(expires_in.saturating_sub(60));
        if let Ok(mut cache) = CACHED_TOKEN.lock() {
            *cache = Some((token_resp.access_token, expiry));
        }
    }

    save_refresh_token(app, &refresh_token)?;
    Ok(())
}

async fn wait_for_auth_code(listener: TcpListener) -> Result<String, String> {
    let (mut stream, _) = listener
        .accept()
        .await
        .map_err(|e| format!("Failed to accept connection: {}", e))?;

    let mut buf = vec![0u8; 4096];
    let n = stream
        .read(&mut buf)
        .await
        .map_err(|e| format!("Failed to read request: {}", e))?;

    let request = std::str::from_utf8(&buf[..n]).map_err(|_| "Invalid request".to_string())?;

    // Extract `code` from the first line: "GET /?code=XXX&... HTTP/1.1"
    let code = request
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|path| path.split_once('?'))
        .and_then(|(_, query)| {
            query
                .split('&')
                .find(|p| p.starts_with("code="))
                .map(|p| p[5..].to_string())
        })
        .ok_or("Authorization code not found in callback")?;

    let html = "\
        <html><head><title>Pulse \u{2014} Connected</title>\
        <style>body{font-family:system-ui;display:flex;align-items:center;\
        justify-content:center;height:100vh;margin:0;background:#f0f4ff;}\
        .card{background:#fff;padding:2rem 3rem;border-radius:12px;text-align:center;\
        box-shadow:0 4px 20px rgba(0,0,0,.08);}\
        h2{color:#1a73e8;margin:0 0 .5rem;}p{color:#666;margin:0}</style></head>\
        <body><div class='card'><h2>Gmail connected!</h2>\
        <p>You can close this tab and return to Pulse.</p></div></body></html>";

    let _ = stream
        .write_all(
            format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n{}",
                html.len(),
                html
            )
            .as_bytes(),
        )
        .await;

    Ok(code)
}

// ── Gmail API ─────────────────────────────────────────────────────────────────

pub async fn fetch_unread_count(app: &AppHandle) -> Result<i32, String> {
    let client = reqwest::Client::new();

    let call = |token: &str| {
        client
            .get(LABELS_ENDPOINT)
            .bearer_auth(token)
            .send()
    };

    let access_token = get_access_token(app).await?;
    let resp = call(&access_token)
        .await
        .map_err(|e| format!("Gmail API request failed: {}", e))?;

    // On 401, clear cache and retry once with a fresh token
    let resp = if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
        if let Ok(mut cache) = CACHED_TOKEN.lock() {
            *cache = None;
        }
        let fresh_token = get_access_token(app).await?;
        call(&fresh_token)
            .await
            .map_err(|e| format!("Gmail API request failed: {}", e))?
    } else {
        resp
    };

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let msg = if status == 403 {
            "Gmail API is not enabled. Go to Google Cloud Console → APIs & Services → Library and enable the Gmail API.".to_string()
        } else {
            format!("Gmail API returned HTTP {}", status)
        };
        return Err(msg);
    }

    let label: LabelInfo = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gmail response: {}", e))?;

    Ok(label.messages_unread.unwrap_or(0))
}
