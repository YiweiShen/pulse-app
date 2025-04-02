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

const CONFIG_STORE_FILE = 'config.json'
const AUTO_START_KEY = 'autoStart'
const DEFAULT_AUTO_START = false

import { EmailService } from '../services/EmailService'

const CHECK_INTERVAL = 10000 // 10 seconds

export const useAppConfig = () => {
  const [isConfigVisible, setIsConfigVisible] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [autoStart, setAutoStart] = useState(false)
  const [emailCount, setEmailCount] = useState(0)

  const toggleConfigVisibility = () => {
    console.log('Toggling config visibility')
    setIsConfigVisible(!isConfigVisible)
    console.log('Config visibility:', isConfigVisible)
  }

  // load credentials from stronghold
  const loadCredentials = async () => {
    const { client, isReady } = await strongholdInit()
    if (isReady && client) {
      const store = client.getStore()
      const storedUsername = await getRecord(store, 'app_username')
      const storedPassword = await getRecord(store, 'app_password')
      setCredentials({
        username: storedUsername || '',
        password: storedPassword || ''
      })
    }
  }
  // save credentials to stronghold
  const saveCredentials = async () => {
    const { client, isReady, stronghold } = await strongholdInit()
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
  }

  // load autoStart from store
  const loadAutoStart = async () => {
    try {
      const s = await load(CONFIG_STORE_FILE)
      const storedAutoStart = await s.get<boolean>(AUTO_START_KEY)
      setAutoStart(storedAutoStart ?? DEFAULT_AUTO_START)
    } catch (error) {
      console.error('Failed to load autoStart:', error)
    }
  }

  // save autoStart to store
  const saveAutoStart = async () => {
    try {
      const s = await load(CONFIG_STORE_FILE)
      await s.set(AUTO_START_KEY, autoStart)
      await s.save()

      if (autoStart) {
        await enable()
        console.log(`Autostart enabled: ${await isEnabled()}`)
      } else {
        await disable()
        console.log(`Autostart disabled: ${await isEnabled()}`)
      }
    } catch (error) {
      console.error('Failed to save autoStart:', error)
    }
  }

  useEffect(() => {
    loadCredentials()
    loadAutoStart()
  }, [])

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('before setCredentials', credentials)
    console.log('handleCredentialChange', e.target.id, e.target.value)
    const { id, value } = e.target
    setCredentials((prevState) => ({
      ...prevState,
      [id]: value
    }))

    console.log('after setCredentials', credentials)
  }

  const handleAutoStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target
    setAutoStart(checked)
  }

  const emailService = new EmailService()

  const checkNewEmails = useCallback(async () => {
    console.log('Checking for new emails...')

    console.log(credentials)

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
  }, [credentials])

  useEffect(() => {
    if (credentials.username && credentials.password) {
      checkNewEmails()
      const intervalId = setInterval(checkNewEmails, CHECK_INTERVAL)
      console.log('Email check interval set:', intervalId)
      return () => clearInterval(intervalId)
    }
  }, [credentials])

  const handleSave = () => {
    saveCredentials()
    saveAutoStart()
    toggleConfigVisibility()
  }

  const handleCancel = () => {
    toggleConfigVisibility()
  }

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
