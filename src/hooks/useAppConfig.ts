import { useState, useEffect } from 'react'

// TODO: use a secure storage mechanism
let storedUsername: string | null = localStorage.getItem('app_username')
let storedPassword: string | null = localStorage.getItem('app_password')

export const useAppConfig = () => {
  const [username, setUsername] = useState<string | null>(storedUsername)
  const [password, setPassword] = useState<string | null>(storedPassword)

  useEffect(() => {
    if (username !== null) {
      localStorage.setItem('app_username', username)
      storedUsername = username
    } else {
      localStorage.removeItem('app_username')
      storedUsername = null
    }
  }, [username])

  const updatePassword = (newPassword: string | null) => {
    setPassword(newPassword)
    if (newPassword !== null) {
      localStorage.setItem('app_password', newPassword)
      storedPassword = newPassword
    } else {
      localStorage.removeItem('app_password')
      storedPassword = null
    }
  }

  return { username, setUsername, password, updatePassword }
}
