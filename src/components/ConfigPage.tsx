import React from 'react'

import './ConfigPage.css'

interface ConfigPageProps {
  credentials: {
    username: string
    password: string
  }
  autoStart: boolean
  handleCredentialChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleAutoStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSave: () => void
  handleCancel: () => void
}

const ConfigPage: React.FC<ConfigPageProps> = ({
  credentials,
  autoStart,
  handleCredentialChange,
  handleAutoStartChange,
  handleSave,
  handleCancel
}) => {
  return (
    <div className="config-page">
      <div className="config-header">
        <span className="config-title">Settings</span>
      </div>

      <div className="input-group">
        <label htmlFor="username">Email</label>
        <input
          type="text"
          id="username"
          placeholder="you@gmail.com"
          value={credentials.username}
          onChange={handleCredentialChange}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="input-group">
        <label htmlFor="password">App password</label>
        <input
          type="password"
          id="password"
          placeholder={credentials.password ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
          value={credentials.password}
          onChange={handleCredentialChange}
        />
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          id="autoStart"
          checked={autoStart}
          onChange={handleAutoStartChange}
        />
        <label htmlFor="autoStart">Start on login</label>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn-ghost" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConfigPage
