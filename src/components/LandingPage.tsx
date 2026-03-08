import React, { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'

import { AuthStatus } from '../hooks/useAppConfig'
import './LandingPage.css'

const GMAIL_INBOX_URL = 'https://mail.google.com/'

interface LandingPageProps {
  emailCount: number
  emailError: string | null
  autoStart: boolean
  authStatus: AuthStatus
  onAutoStartChange: (checked: boolean) => void
  onSaveClientId: (clientId: string) => Promise<void>
  onSaveClientSecret: (clientSecret: string) => Promise<void>
  onConnectGmail: () => Promise<void>
  onDisconnectGmail: () => Promise<void>
}

const LandingPage: React.FC<LandingPageProps> = ({
  emailCount,
  emailError,
  autoStart,
  authStatus,
  onAutoStartChange,
  onSaveClientId,
  onSaveClientSecret,
  onConnectGmail,
  onDisconnectGmail,
}) => {
  const [clientIdInput, setClientIdInput] = useState('')
  const [clientSecretInput, setClientSecretInput] = useState('')
  const [savingClientId, setSavingClientId] = useState(false)

  const openGmailInbox = async () => {
    await openUrl(GMAIL_INBOX_URL)
  }

  const handleQuit = () => {
    invoke('exit_app')
  }

  const handleSaveCredentials = async () => {
    const trimmedId = clientIdInput.trim()
    const trimmedSecret = clientSecretInput.trim()
    if (!trimmedId || !trimmedSecret) return
    setSavingClientId(true)
    try {
      await onSaveClientId(trimmedId)
      await onSaveClientSecret(trimmedSecret)
    } finally {
      setSavingClientId(false)
    }
  }

  // ── Setup: enter Client ID + Secret ──────────────────────────────────────
  if (authStatus === 'needs_client_id') {
    return (
      <div className="main-content">
        <div className="setup-section">
          <p className="setup-title">Connect Gmail</p>
          <p className="setup-desc">
            Paste your Google OAuth credentials below.{' '}
            <span
              className="setup-link"
              onClick={() =>
                openUrl('https://console.cloud.google.com/apis/credentials')
              }
            >
              Get them here
            </span>
            {' '}(Desktop app type, Gmail readonly scope).
          </p>
          <input
            className="setup-input"
            type="text"
            placeholder="Client ID (xxxx.apps.googleusercontent.com)"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCredentials()}
            autoFocus
          />
          <input
            className="setup-input"
            type="password"
            placeholder="Client Secret"
            value={clientSecretInput}
            onChange={(e) => setClientSecretInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCredentials()}
          />
          <button
            className="btn-primary"
            onClick={handleSaveCredentials}
            disabled={!clientIdInput.trim() || !clientSecretInput.trim() || savingClientId}
          >
            Save
          </button>
        </div>
        <div className="divider" />
        <div className="button-container">
          <button className="btn-ghost btn-muted" onClick={handleQuit}>
            Quit
          </button>
        </div>
      </div>
    )
  }

  // ── Setup: authorize ──────────────────────────────────────────────────────
  if (authStatus === 'needs_auth' || authStatus === 'connecting') {
    return (
      <div className="main-content">
        <div className="setup-section">
          <p className="setup-title">Connect Gmail</p>
          <p className="setup-desc">
            Click below to authorize Pulse to read your unread count. A browser
            window will open — sign in and grant access, then return here.
          </p>
          {emailError && (
            <p className="setup-desc" style={{ color: 'var(--color-error, #d93025)', marginTop: 4 }}>
              {emailError}
            </p>
          )}
          <button
            className="btn-primary"
            onClick={onConnectGmail}
            disabled={authStatus === 'connecting'}
          >
            {authStatus === 'connecting' ? 'Waiting for browser…' : 'Connect Gmail'}
          </button>
        </div>
        <div className="divider" />
        <div className="button-container">
          <button className="btn-ghost btn-muted" onClick={handleQuit}>
            Quit
          </button>
        </div>
      </div>
    )
  }

  // ── Checking / loading ────────────────────────────────────────────────────
  if (authStatus === 'checking') {
    return (
      <div className="main-content">
        <div className="status-section">
          <div className="status-dot idle" />
          <div className="status-info">
            <span className="email-label">Loading…</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated: normal view ────────────────────────────────────────────
  return (
    <div className="main-content">
      <div className={`status-section ${emailError ? 'error' : ''}`}>
        <div
          className={`status-dot ${emailError ? 'error' : emailCount > 0 ? 'unread' : 'idle'}`}
        />
        <div className="status-info">
          {emailError ? (
            <span className="email-label error-text">
              {emailError}
            </span>
          ) : emailCount > 0 ? (
            <>
              <span className="email-count">{emailCount}</span>
              <span className="email-label">
                unread email{emailCount > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <span className="email-label">No new mail</span>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="button-container">
        <button className="btn-primary" onClick={openGmailInbox}>
          Open Gmail
        </button>
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="autoStart"
            checked={autoStart}
            onChange={(e) => onAutoStartChange(e.target.checked)}
          />
          <label htmlFor="autoStart">Start on login</label>
        </div>
        <button className="btn-ghost btn-muted disconnect-link" onClick={onDisconnectGmail}>
          Disconnect Gmail
        </button>
        <button className="btn-ghost btn-muted" onClick={handleQuit}>
          Quit
        </button>
      </div>
    </div>
  )
}

export default LandingPage
