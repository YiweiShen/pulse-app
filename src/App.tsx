import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

import './App.css'

function App() {
  useEffect(() => {
    invoke('init_menubar_panel')
  }, [])

  return (
    <div className="container">
      <p>1 new email ...</p>
    </div>
  )
}

export default App
