import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { invoke } from '@tauri-apps/api/core'
import { Buffer } from 'buffer'

export class EmailService {
  private readonly feedUrl = 'https://mail.google.com/mail/feed/atom'

  async fetchNewEmailCount(credentials: {
    username: string
    password: string
  }): Promise<number> {
    try {
      const authorizationHeader = `Basic ${Buffer.from(
        `${credentials.username}:${credentials.password}`
      ).toString('base64')}`

      const response = await tauriFetch(this.feedUrl, {
        method: 'GET',
        headers: {
          Authorization: authorizationHeader
        }
      })

      if (!response.ok) {
        console.error(
          'Failed to fetch email feed:',
          response.status,
          response.statusText
        )
        return 0
      }

      const responseBody = await response.text() // Use response.text() to get the body as a string
      const emailCount = this.parseEmailCount(responseBody)
      console.log('Fetched new email count:', emailCount)

      if (emailCount > 0) {
        invoke('change_icon_unread')
      } else {
        invoke('change_icon_no_mail')
      }
      return emailCount
    } catch (error) {
      console.error('Error fetching or parsing email feed:', error)
      return 0
    }
  }

  private parseEmailCount(xmlString: string): number {
    try {
      // Basic XML parsing using regex (for simplicity in this context)
      // For more complex XML, consider using a dedicated XML parsing library.
      const cleanedString = xmlString.replace(/\\"/g, '"')
      const match = cleanedString.match(/<fullcount>(\d+)<\/fullcount>/)

      if (match && match[1]) {
        return parseInt(match[1], 10)
      }
      return 0
    } catch (error) {
      console.error('Error parsing email feed:', error)
      return 0
    }
  }
}
