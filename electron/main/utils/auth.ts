import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(pin, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

export function comparePin(pin: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false
  }
  const [salt, key] = storedHash.split(':')
  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKey = scryptSync(pin, salt, 64)
  if (keyBuffer.length !== derivedKey.length) return false
  return timingSafeEqual(keyBuffer, derivedKey)
}
