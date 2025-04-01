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
