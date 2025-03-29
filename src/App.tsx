import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

import './App.css'

function App() {
  useEffect(() => {
    invoke('init')
  }, [])

  return (
    <div className="container">
      <p>1 new email ...</p>
    </div>
  )
}

export default App
