import { useState, useEffect } from 'react'
import { Client, Stronghold } from '@tauri-apps/plugin-stronghold'
import { appDataDir } from '@tauri-apps/api/path'

interface StrongholdContext {
  stronghold: Stronghold | null
  client: Client | null
  isReady: boolean
}

const initialStrongholdContext: StrongholdContext = {
  stronghold: null,
  client: null,
  isReady: false
}

const VAULT_PASSWORD = 'S22FbfO1pUh5TNyUd0A2UjHczzYzf79q'
const CLIENT_NAME = 'app_config_client'
const VAULT_FILE = 'vault.hold'

const useStrongholdInit = () => {
  const [strongholdContext, setStrongholdContext] = useState<StrongholdContext>(
    initialStrongholdContext
  )

  useEffect(() => {
    const initializeStronghold = async () => {
      const vaultPath = `${await appDataDir()}/${VAULT_FILE}`
      let strongholdInstance: Stronghold | null = null

      try {
        strongholdInstance = await Stronghold.load(vaultPath, VAULT_PASSWORD)
      } catch (error) {
        console.error('Error loading stronghold:', error)
        return
      }

      if (!strongholdInstance) {
        return // Exit if stronghold failed to load
      }

      let clientInstance: Client
      try {
        clientInstance = await strongholdInstance.loadClient(CLIENT_NAME)
      } catch {
        clientInstance = await strongholdInstance.createClient(CLIENT_NAME)
      }

      setStrongholdContext({
        stronghold: strongholdInstance,
        client: clientInstance,
        isReady: true
      })
    }

    initializeStronghold()

    return () => {
      if (strongholdContext.stronghold) {
        strongholdContext.stronghold.save().catch((error) => {
          console.error('Error saving stronghold on unmount:', error)
        })
      }
    }
  }, [])

  return strongholdContext
}

export default useStrongholdInit
