import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'
import { clearInterval, setInterval } from 'worker-timers'

import './App.css'
import ConfigPage from './components/ConfigPage'
import { useAppConfig } from './hooks/useAppConfig'
import { EmailService } from './services/EmailService'

// TODO: Use the store to save configurations other than credentials.
// For example, feature: configuration if run at startup.
// https://tauri.app/plugin/store/
function App() {
  const [showConfig, setShowConfig] = useState(false)
  const { username, setUsername, password, updatePassword } = useAppConfig()
  const [newEmailCount, setNewEmailCount] = useState(0)
  const emailService = new EmailService()
  const CHECK_INTERVAL = 60000 // 1 min
  const GMAIL_INBOX_URL = 'https://mail.google.com/'

  useEffect(() => {
    invoke('init_menubar_panel')
  }, [])

  const checkNewEmails = useCallback(async () => {
    if (!username || !password) {
      console.warn('Username or password not configured.')
      setNewEmailCount(0)
      return
    }

    try {
      const count = await emailService.fetchNewEmailCount(username, password)
      setNewEmailCount(count)
    } catch (error) {
      console.error('Error checking new emails:', error)
      setNewEmailCount(0)
    }
  }, [username, password, emailService])

  useEffect(() => {
    if (username && password) {
      checkNewEmails()
      const intervalId = setInterval(checkNewEmails, CHECK_INTERVAL)
      return () => clearInterval(intervalId)
    }
  }, [username, password, checkNewEmails])

  const handleQuit = useCallback(() => {
    invoke('exit_app')
  }, [])

  const handleConfig = useCallback(() => {
    setShowConfig(true)
  }, [])

  const handleSaveConfig = useCallback(
    (newUsername: string, newPassword: string) => {
      setUsername(newUsername)
      updatePassword(newPassword)
      setShowConfig(false)
    },
    [setUsername, updatePassword, setShowConfig]
  )

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false)
  }, [setShowConfig])

  const openGmailInbox = useCallback(async () => {
    await openUrl(GMAIL_INBOX_URL)
  }, [])

  return (
    <div className="container">
      {showConfig ? (
        <ConfigPage
          onSaveConfig={handleSaveConfig}
          onClose={handleCloseConfig}
          initialUsername={username}
          initialPassword={password}
        />
      ) : (
        <div className="main-content">
          {
            <div className="button-container">
              {
                <button onClick={openGmailInbox}>
                  {newEmailCount > 0
                    ? `${newEmailCount} New Email${
                        newEmailCount > 1 ? 's' : ''
                      }`
                    : 'Gmail'}
                </button>
              }
              <button onClick={handleConfig}>Config</button>
              <button onClick={handleQuit}>Quit</button>
            </div>
          }
        </div>
      )}
    </div>
  )
}

export default App
