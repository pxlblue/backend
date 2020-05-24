import crypto from 'crypto'

export function randomBytes(length: number = 18): string {
  return crypto.randomBytes(length).toString('hex')
}

export function createSessionToken(): string {
  return 'Bearer ' + crypto.randomBytes(96).toString('base64')
}
