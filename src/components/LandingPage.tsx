import React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'

import './LandingPage.css'

const GMAIL_INBOX_URL = 'https://mail.google.com/'

interface LandingPageProps {
  toggleConfigVisibility: () => void
  emailCount: number
}

const LandingPage: React.FC<LandingPageProps> = ({
  toggleConfigVisibility,
  emailCount
}) => {
  const openGmailInbox = async () => {
    await openUrl(GMAIL_INBOX_URL)
  }

  const handleQuit = () => {
    invoke('exit_app')
  }

  return (
    <div className="main-content">
      <div className="status-section">
        <div className={`status-dot ${emailCount > 0 ? 'unread' : 'idle'}`} />
        <div className="status-info">
          {emailCount > 0 ? (
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
        <button className="btn-ghost" onClick={toggleConfigVisibility}>
          Settings
        </button>
        <button className="btn-ghost btn-muted" onClick={handleQuit}>
          Quit
        </button>
      </div>
    </div>
  )
}

export default LandingPage
