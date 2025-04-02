import { useState, useEffect, useCallback } from 'react'
// https://tauri.app/plugin/store/
import { load } from '@tauri-apps/plugin-store'
import { clearInterval, setInterval } from 'worker-timers'
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'
import { strongholdInit } from '../utils/strongholdHelpers'
import {
  insertRecord,
  getRecord,
  removeRecord
} from '../utils/strongholdHelpers'
import { EmailService } from '../services/EmailService'

// Constants
const CONFIG_STORE_FILE = 'config.json'
const AUTO_START_KEY = 'autoStart'
const DEFAULT_AUTO_START = false
const CHECK_INTERVAL = 10000 // 10 seconds

// Type Definitions
interface Credentials {
  username: string
  password: string
}

export const useAppConfig = () => {
  // State variables
  const [isConfigVisible, setIsConfigVisible] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>({
    username: '',
    password: ''
  })
  const [autoStart, setAutoStart] = useState(DEFAULT_AUTO_START)
  const [emailCount, setEmailCount] = useState(0)

  // Store instance (lazy initialization)
  const getStore = useCallback(async () => {
    return await load(CONFIG_STORE_FILE)
  }, [])

  // Stronghold client instance (lazy initialization)
  const getStrongholdClient = useCallback(async () => {
    return await strongholdInit()
  }, [])

  // Toggle config visibility
  const toggleConfigVisibility = useCallback(() => {
    console.log('Toggling config visibility')
    setIsConfigVisible((prev) => !prev)
    console.log('Config visibility:', !isConfigVisible)
  }, [isConfigVisible])

  // Load credentials from stronghold
  const loadCredentials = useCallback(async () => {
    const { client, isReady } = await getStrongholdClient()
    if (isReady && client) {
      const store = client.getStore()
      const storedUsername = await getRecord(store, 'app_username')
      const storedPassword = await getRecord(store, 'app_password')
      setCredentials({
        username: storedUsername || '',
        password: storedPassword || ''
      })
    }
  }, [getStrongholdClient])

  // Save credentials to stronghold
  const saveCredentials = useCallback(async () => {
    const { client, isReady, stronghold } = await getStrongholdClient()
    if (isReady && client) {
      const store = client.getStore()

      if (credentials.username !== '') {
        await insertRecord(store, 'app_username', credentials.username)
      } else {
        await removeRecord(store, 'app_username')
      }

      if (credentials.password !== '') {
        await insertRecord(store, 'app_password', credentials.password)
      } else {
        await removeRecord(store, 'app_password')
      }

      if (stronghold) {
        await stronghold.save()
      }
    }
  }, [credentials, getStrongholdClient])

  // Load autoStart from store
  const loadAutoStart = useCallback(async () => {
    try {
      const store = await getStore()
      const storedAutoStart = await store.get<boolean>(AUTO_START_KEY)
      setAutoStart(storedAutoStart ?? DEFAULT_AUTO_START)
    } catch (error) {
      console.error('Failed to load autoStart:', error)
    }
  }, [getStore])

  // Save autoStart to store and update system setting
  const saveAutoStart = useCallback(async () => {
    try {
      const store = await getStore()
      await store.set(AUTO_START_KEY, autoStart)
      await store.save()

      const isCurrentlyEnabled = await isEnabled()
      if (autoStart && !isCurrentlyEnabled) {
        await enable()
        console.log(`Autostart enabled: ${await isEnabled()}`)
      } else if (!autoStart && isCurrentlyEnabled) {
        await disable()
        console.log(`Autostart disabled: ${await isEnabled()}`)
      } else {
        console.log(`Autostart setting is already as requested: ${autoStart}`)
      }
    } catch (error) {
      console.error('Failed to save autoStart:', error)
    }
  }, [autoStart, getStore])

  // Load initial configuration on component mount
  useEffect(() => {
    loadCredentials()
    loadAutoStart()
  }, [loadCredentials, loadAutoStart])

  // Handle credential input changes
  const handleCredentialChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target
      setCredentials((prevCredentials) => ({
        ...prevCredentials,
        [id]: value
      }))
    },
    []
  )

  // Handle autoStart checkbox change
  const handleAutoStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAutoStart(e.target.checked)
    },
    []
  )

  // Initialize EmailService
  const emailService = new EmailService()

  // Check for new emails
  const checkNewEmails = useCallback(async () => {
    console.log('Checking for new emails...')
    if (!credentials.username || !credentials.password) {
      console.warn('Username or password not configured.')
      setEmailCount(0)
      return
    }

    try {
      const count = await emailService.fetchNewEmailCount(credentials)
      setEmailCount(count)
    } catch (error) {
      console.error('Error checking new emails:', error)
      setEmailCount(0)
    }
  }, [credentials, emailService])

  // Set up interval for checking new emails
  useEffect(() => {
    let intervalId: number | null = null
    if (credentials.username && credentials.password) {
      checkNewEmails()
      let intervalId = setInterval(checkNewEmails, CHECK_INTERVAL)
      console.log('Email check interval set:', intervalId)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        console.log('Email check interval cleared:', intervalId)
      }
    }
  }, [credentials, checkNewEmails])

  // Handle save button click
  const handleSave = useCallback(() => {
    saveCredentials()
    saveAutoStart()
    toggleConfigVisibility()
  }, [saveCredentials, saveAutoStart, toggleConfigVisibility])

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    toggleConfigVisibility()
  }, [toggleConfigVisibility])

  return {
    isConfigVisible,
    toggleConfigVisibility,
    emailCount,
    credentials,
    autoStart,
    handleCredentialChange,
    handleAutoStartChange,
    handleSave,
    handleCancel
  }
}
