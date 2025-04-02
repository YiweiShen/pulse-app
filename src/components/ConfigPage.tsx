import React from 'react'
// https://tauri.app/plugin/autostart/

import './ConfigPage.css'
import { useAppConfig } from '../hooks/useAppConfig'

const ConfigPage: React.FC = () => {
  const {
    credentials,
    autoStart,
    handleCredentialChange,
    handleAutoStartChange,
    handleSave,
    handleCancel
  } = useAppConfig()

  return (
    <div className="config-page">
      <div className="input-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={credentials.username}
          onChange={handleCredentialChange}
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          placeholder={credentials.password ? '•••••••••••••••' : 'Password'}
          value={credentials.password}
          onChange={handleCredentialChange}
        />
      </div>
      <div className="input-group">
        <label htmlFor="autoStart">
          <input
            type="checkbox"
            id="autoStart"
            checked={autoStart}
            onChange={handleAutoStartChange}
          />
          Auto run on startup
        </label>
      </div>
      <div className="button-group">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default ConfigPage
