import { Client, Stronghold } from '@tauri-apps/plugin-stronghold'
import { appDataDir } from '@tauri-apps/api/path'

const VAULT_PASSWORD = 'S22FbfO1pUh5TNyUd0A2UjHczzYzf79q'
const CLIENT_NAME = 'app_config_client'
const VAULT_FILE = 'vault.hold'

// Helper function to encode a string to Uint8Array
const encode = (value: string): Uint8Array => new TextEncoder().encode(value)

// Helper function to decode a Uint8Array to a string
const decode = (data: Uint8Array): string => new TextDecoder().decode(data)

// Helper functions for interacting with Stronghold store
export const insertRecord = async (store: any, key: string, value: string) => {
  await store.insert(key, Array.from(encode(value)))
}

export const getRecord = async (
  store: any,
  key: string
): Promise<string | null> => {
  try {
    const data = await store.get(key)
    return data ? decode(new Uint8Array(data)) : null
  } catch (error) {
    console.warn(`Error getting record for key "${key}":`, error)
    return null
  }
}

export const removeRecord = async (store: any, key: string) => {
  await store.remove(key)
}

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

export const strongholdInit = async () => {
  const vaultPath = `${await appDataDir()}/${VAULT_FILE}`
  let strongholdInstance: Stronghold | null = null

  try {
    strongholdInstance = await Stronghold.load(vaultPath, VAULT_PASSWORD)
  } catch (error) {
    console.error('Error loading stronghold:', error)
    return initialStrongholdContext
  }

  if (!strongholdInstance) {
    return initialStrongholdContext
  }

  let clientInstance: Client
  try {
    clientInstance = await strongholdInstance.loadClient(CLIENT_NAME)
  } catch {
    clientInstance = await strongholdInstance.createClient(CLIENT_NAME)
  }

  return {
    stronghold: strongholdInstance,
    client: clientInstance,
    isReady: true
  }
}
