import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'

import { useAppConfig } from '../hooks/useAppConfig'

const GMAIL_INBOX_URL = 'https://mail.google.com/'

const LandingPage: React.FC = () => {
  const { toggleConfigVisibility, emailCount } = useAppConfig()
  const openGmailInbox = async () => {
    await openUrl(GMAIL_INBOX_URL)
  }

  const handleQuit = () => {
    invoke('exit_app')
  }

  return (
    <div className="main-content">
      {
        <div className="button-container">
          {
            <button onClick={openGmailInbox}>
              {emailCount > 0
                ? `${emailCount} New Email${emailCount > 1 ? 's' : ''}`
                : 'Gmail'}
            </button>
          }
          <button onClick={toggleConfigVisibility}>Config</button>
          <button onClick={handleQuit}>Quit</button>
        </div>
      }
    </div>
  )
}

export default LandingPage
