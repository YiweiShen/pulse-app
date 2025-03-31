import React, { useState, useCallback } from 'react'
import './ConfigPage.css'

interface ConfigPageProps {
  onSaveConfig: (username: string, password: string) => void
  onClose: () => void
  initialUsername?: string | null
}

const ConfigPage: React.FC<ConfigPageProps> = ({
  onSaveConfig,
  onClose,
  initialUsername
}) => {
  const [username, setLocalUsername] = useState(initialUsername || '')
  const [password, setPassword] = useState('')

  const handleSave = useCallback(() => {
    onSaveConfig(username, password)
  }, [onSaveConfig, username, password])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div className="config-page">
      <div className="input-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setLocalUsername(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="button-group">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default ConfigPage
