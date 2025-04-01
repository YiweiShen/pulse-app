import React, { useState, useCallback, useEffect } from 'react'
// https://tauri.app/plugin/autostart/
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'
// https://tauri.app/plugin/store/
import { load, Store } from '@tauri-apps/plugin-store'
import './ConfigPage.css'

interface ConfigPageProps {
  onSaveConfig: (username: string, password: string, autoStart: boolean) => void
  onClose: () => void
  initialUsername?: string | null
  initialPassword?: string | null
  initialAutoStart?: boolean
}

const CONFIG_STORE_FILE = 'config.json'
const AUTO_START_KEY = 'autoStart'
const DEFAULT_AUTO_START = false

const ConfigPage: React.FC<ConfigPageProps> = ({
  onSaveConfig,
  onClose,
  initialUsername = '',
  initialPassword = '',
  initialAutoStart = false
}) => {
  const [username, setUsername] = useState(initialUsername || '')
  const [password, setPassword] = useState(initialPassword || '')
  const [autoStart, setAutoStart] = useState(
    initialAutoStart !== undefined ? initialAutoStart : DEFAULT_AUTO_START
  )
  const [store, setStore] = useState<Store | null>(null)

  // Initialize the store and load initial autoStart setting
  useEffect(() => {
    const initializeStore = async () => {
      try {
        const s = await load(CONFIG_STORE_FILE)
        setStore(s)
        const storedAutoStart = await s.get<boolean>(AUTO_START_KEY)
        setAutoStart(
          storedAutoStart !== undefined
            ? storedAutoStart
            : initialAutoStart ?? DEFAULT_AUTO_START
        )
      } catch (error) {
        console.error('Failed to load or initialize store:', error)
        // Consider setting a default store or handling the error more gracefully
      }
    }

    initializeStore()
  }, [initialAutoStart])

  const handleAutoStartChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAutoStart(event.target.checked)
    },
    []
  )

  const handleSave = useCallback(async () => {
    try {
      if (store) {
        await store.set(AUTO_START_KEY, autoStart)
        await store.save()
      }
      onSaveConfig(username, password, autoStart)
    } catch (error) {
      console.error('Failed to save config:', error)
      // Optionally provide user feedback
    }
  }, [onSaveConfig, username, password, autoStart, store])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  // Manage autostart based on the autoStart state
  useEffect(() => {
    const manageAutoStart = async () => {
      try {
        if (autoStart) {
          await enable()
          console.log(`Autostart enabled: ${await isEnabled()}`)
        } else {
          await disable()
          console.log(`Autostart disabled: ${await isEnabled()}`)
        }
      } catch (error) {
        console.error(
          `Failed to ${autoStart ? 'enable' : 'disable'} autostart:`,
          error
        )
        // Revert the toggle if enabling/disabling fails and update the store
        setAutoStart(!autoStart)
        if (store) {
          await store.set(AUTO_START_KEY, !autoStart)
          await store.save()
        }
      }
    }

    manageAutoStart()
  }, [autoStart, store])

  return (
    <div className="config-page">
      <div className="input-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          placeholder={password ? '•••••••••••••••' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
