import randomstring from 'randomstring'
import crypto from 'crypto'

export function randomBytes(length: number = 18): string {
  return crypto.randomBytes(length).toString('hex')
}

export function randomPassword(): string {
  return crypto
    .randomBytes(20)
    .toString('base64')
    .replace(/[\+\/\=]/gi, '')
}

export function createSessionToken(): string {
  return 'Bearer ' + crypto.randomBytes(96).toString('base64')
}

export function randomImageId(secure: boolean = false) {
  return randomstring.generate({
    length: secure ? 16 : 7,
    charset: 'AaBbCcDdEeFf1234567890',
  })
}

const invisibleCharset = ['\u200B', '\u2060', '\u180E', '\u200D', '\u200C']
export function randomInvisibleId(secure: boolean = false) {
  return (
    randomstring.generate({
      length: secure ? 24 : 18,
      charset: invisibleCharset.join(''),
    }) + '\u200B'
  )
}
