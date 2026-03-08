import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { load } from '@tauri-apps/plugin-store'
import { clearInterval, setInterval } from 'worker-timers'
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'

const CONFIG_STORE_FILE = 'config.json'
const AUTO_START_KEY = 'autoStart'
const DEFAULT_AUTO_START = false
const CHECK_INTERVAL = 10000 // 10 seconds

export type AuthStatus =
  | 'checking'
  | 'needs_client_id'
  | 'needs_auth'
  | 'connecting'
  | 'authenticated'

export const useAppConfig = () => {
  const [emailCount, setEmailCount] = useState(0)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [autoStart, setAutoStart] = useState(DEFAULT_AUTO_START)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const intervalIdRef = useRef<number | null>(null)

  const getStore = () => load(CONFIG_STORE_FILE)

  const checkAuthStatus = useCallback(async () => {
    try {
      const status = await invoke<{ has_client_id: boolean; has_client_secret: boolean; is_authenticated: boolean }>(
        'get_gmail_auth_status'
      )
      if (!status.has_client_id || !status.has_client_secret) {
        setAuthStatus('needs_client_id')
      } else if (!status.is_authenticated) {
        setAuthStatus('needs_auth')
      } else {
        setAuthStatus('authenticated')
      }
    } catch (error) {
      console.error('Failed to get auth status:', error)
      setAuthStatus('needs_client_id')
    }
  }, [])

  const saveClientId = useCallback(async (clientId: string) => {
    await invoke('save_gmail_client_id', { clientId })
  }, [])

  const saveClientSecret = useCallback(async (clientSecret: string) => {
    await invoke('save_gmail_client_secret', { clientSecret })
    setAuthStatus('needs_auth')
  }, [])

  const connectGmail = useCallback(async () => {
    setAuthStatus('connecting')
    try {
      await invoke('start_gmail_auth')
      setAuthStatus('authenticated')
    } catch (error) {
      console.error('Gmail auth failed:', error)
      setEmailError(String(error))
      setAuthStatus('needs_auth')
    }
  }, [])

  const disconnectGmail = useCallback(async () => {
    try {
      await invoke('gmail_sign_out')
      setEmailCount(0)
      setEmailError(null)
      await invoke('change_icon_no_mail')
      setAuthStatus('needs_auth')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }, [])

  const checkNewEmails = useCallback(async () => {
    try {
      const count = await invoke<number>('fetch_gmail_unread_count')
      setEmailCount(count)
      setEmailError(null)
      if (count > 0) {
        invoke('change_icon_unread')
      } else {
        invoke('change_icon_no_mail')
      }
    } catch (error) {
      console.error('Error checking emails:', error)
      setEmailError(String(error))
      setEmailCount(0)
      invoke('change_icon_no_mail')
    }
  }, [])

  const loadAutoStart = useCallback(async () => {
    try {
      const store = await getStore()
      const stored = await store.get<boolean>(AUTO_START_KEY)
      setAutoStart(stored ?? DEFAULT_AUTO_START)
    } catch (error) {
      console.error('Failed to load autoStart:', error)
    }
  }, [])

  const handleAutoStartChange = useCallback(async (checked: boolean) => {
    setAutoStart(checked)
    try {
      const store = await getStore()
      await store.set(AUTO_START_KEY, checked)
      await store.save()

      const isCurrentlyEnabled = await isEnabled()
      if (checked && !isCurrentlyEnabled) {
        await enable()
      } else if (!checked && isCurrentlyEnabled) {
        await disable()
      }
    } catch (error) {
      console.error('Failed to save autoStart:', error)
    }
  }, [])

  // Start polling only when authenticated
  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    checkNewEmails()

    intervalIdRef.current = setInterval(() => {
      checkNewEmails()
    }, CHECK_INTERVAL)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [authStatus, checkNewEmails])

  useEffect(() => {
    loadAutoStart()
    checkAuthStatus()
  }, [])

  return {
    emailCount,
    emailError,
    autoStart,
    authStatus,
    handleAutoStartChange,
    saveClientId,
    saveClientSecret,
    connectGmail,
    disconnectGmail,
  }
}
