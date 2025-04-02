import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

import './App.css'
import ConfigPage from './components/ConfigPage'
import LandingPage from './components/LandingPage'
import { useAppConfig } from './hooks/useAppConfig'

function App() {
  const { isConfigVisible } = useAppConfig()

  useEffect(() => {
    invoke('init_menubar_panel')
  }, [])

  return (
    <div className="container">
      {isConfigVisible ? <ConfigPage /> : <LandingPage />}
    </div>
  )
}

export default App
