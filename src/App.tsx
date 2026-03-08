import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

import './App.css'
import LandingPage from './components/LandingPage'
import { useAppConfig } from './hooks/useAppConfig'

function App() {
  const {
    emailCount,
    emailError,
    autoStart,
    authStatus,
    handleAutoStartChange,
    saveClientId,
    saveClientSecret,
    connectGmail,
    disconnectGmail,
  } = useAppConfig()

  useEffect(() => {
    invoke('init_menubar_panel')
  }, [])

  return (
    <div className="container">
      <LandingPage
        emailCount={emailCount}
        emailError={emailError}
        autoStart={autoStart}
        authStatus={authStatus}
        onAutoStartChange={handleAutoStartChange}
        onSaveClientId={saveClientId}
        onSaveClientSecret={saveClientSecret}
        onConnectGmail={connectGmail}
        onDisconnectGmail={disconnectGmail}
      />
    </div>
  )
}

export default App
