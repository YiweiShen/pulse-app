use std::sync::Once;
use tauri::AppHandle;
use tauri_nspanel::ManagerExt;

use crate::gmail;
use crate::panel_appearance::update_menubar_appearance;
use crate::panel_configuraion::configure_menubar_panel;
use crate::panel_listeners::setup_menubar_panel_listeners;
use crate::tray::{create, create_unread};

static MENUBAR_PANEL_INIT: Once = Once::new();
const MENUBAR_PANEL_LABEL: &str = "main";

#[tauri::command]
pub fn init_menubar_panel(app_handle: AppHandle) {
    MENUBAR_PANEL_INIT.call_once(move || {
        configure_menubar_panel(&app_handle);
        update_menubar_appearance(&app_handle);
        setup_menubar_panel_listeners(&app_handle);
    });
}

#[tauri::command]
pub fn show_menubar_panel(app_handle: AppHandle) -> Result<(), String> {
    match app_handle.get_webview_panel(MENUBAR_PANEL_LABEL) {
        Ok(panel) => {
            panel.show();
            Ok(())
        }
        Err(err) => Err(format!(
            "Failed to get menubar panel with label '{}': {:?}",
            MENUBAR_PANEL_LABEL, err
        )),
    }
}

#[tauri::command]
pub fn exit_app() {
    std::process::exit(0);
}

#[tauri::command]
pub fn change_icon_unread(app_handle: AppHandle) {
    let _icon = create_unread(&app_handle);
}

#[tauri::command]
pub fn change_icon_no_mail(app_handle: AppHandle) {
    let _icon = create(&app_handle);
}

// ── Gmail OAuth2 commands ─────────────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct GmailAuthStatus {
    pub has_client_id: bool,
    pub has_client_secret: bool,
    pub is_authenticated: bool,
}

#[tauri::command]
pub fn get_gmail_auth_status(app_handle: AppHandle) -> GmailAuthStatus {
    let (has_client_id, has_client_secret, is_authenticated) = gmail::auth_status(&app_handle);
    GmailAuthStatus {
        has_client_id,
        has_client_secret,
        is_authenticated,
    }
}

#[tauri::command]
pub fn save_gmail_client_id(app_handle: AppHandle, client_id: String) -> Result<(), String> {
    gmail::save_client_id(&app_handle, &client_id)
}

#[tauri::command]
pub fn save_gmail_client_secret(app_handle: AppHandle, client_secret: String) -> Result<(), String> {
    gmail::save_client_secret(&app_handle, &client_secret)
}

#[tauri::command]
pub async fn start_gmail_auth(app_handle: AppHandle) -> Result<(), String> {
    gmail::start_oauth_flow(&app_handle).await
}

#[tauri::command]
pub fn gmail_sign_out(app_handle: AppHandle) -> Result<(), String> {
    gmail::clear_auth(&app_handle)
}

#[tauri::command]
pub async fn fetch_gmail_unread_count(app_handle: AppHandle) -> Result<i32, String> {
    gmail::fetch_unread_count(&app_handle).await
}
