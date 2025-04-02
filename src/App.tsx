import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

import './App.css'
import ConfigPage from './components/ConfigPage'
import LandingPage from './components/LandingPage'
import { useAppConfig } from './hooks/useAppConfig'

function App() {
  const {
    isConfigVisible,
    toggleConfigVisibility,
    emailCount,
    credentials,
    autoStart,
    handleCredentialChange,
    handleAutoStartChange,
    handleSave,
    handleCancel
  } = useAppConfig()

  useEffect(() => {
    invoke('init_menubar_panel')
  }, [])

  return (
    <div className="container">
      {isConfigVisible ? (
        <ConfigPage
          credentials={credentials}
          autoStart={autoStart}
          handleCredentialChange={handleCredentialChange}
          handleAutoStartChange={handleAutoStartChange}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />
      ) : (
        <LandingPage
          toggleConfigVisibility={toggleConfigVisibility}
          emailCount={emailCount}
        />
      )}
    </div>
  )
}

export default App
