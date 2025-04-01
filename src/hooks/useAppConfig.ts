import { useState, useEffect, useCallback } from 'react'
import useStrongholdInit from './useStrongholdInit'
import {
  insertRecord,
  getRecord,
  removeRecord
} from '../utils/strongholdHelpers'

export const useAppConfig = () => {
  const { client, isReady, stronghold } = useStrongholdInit()
  const [username, setUsername] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    if (isReady && client) {
      const store = client.getStore()
      const storedUsername = await getRecord(store, 'app_username')
      const storedPassword = await getRecord(store, 'app_password')
      setUsername(storedUsername)
      setPassword(storedPassword)
      setIsLoading(false)
    }
  }, [isReady, client])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const saveConfig = useCallback(async () => {
    if (stronghold) {
      await stronghold.save()
    }
  }, [stronghold])

  // Update username in Stronghold
  useEffect(() => {
    if (isReady && client && !isLoading) {
      const updateUsernameInStronghold = async () => {
        const store = client.getStore()
        if (username !== null) {
          await insertRecord(store, 'app_username', username)
        } else {
          await removeRecord(store, 'app_username')
        }
        await saveConfig()
      }
      updateUsernameInStronghold()
    }
  }, [username, isReady, client, isLoading, saveConfig])

  const updatePassword = useCallback((newPassword: string | null) => {
    setPassword(newPassword)
  }, [])

  // Update password in Stronghold
  useEffect(() => {
    if (isReady && client && !isLoading) {
      const updatePasswordInStronghold = async () => {
        const store = client.getStore()
        if (password !== null) {
          await insertRecord(store, 'app_password', password)
        } else {
          await removeRecord(store, 'app_password')
        }
        await saveConfig()
      }
      updatePasswordInStronghold()
    }
  }, [password, isReady, client, isLoading, saveConfig])

  return { username, setUsername, password, updatePassword, isLoading }
}
