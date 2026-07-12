/**
 * Centralised, validated access to environment configuration. Reading env
 * anywhere else in the codebase is discouraged — go through here so misconfig
 * fails loudly and in one place.
 */
import bcrypt from 'bcryptjs'

const required = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and set it.`,
    )
  }
  return value
}

/**
 * Resolves a bcrypt hash for a password gate. Prefers a pre-hashed
 * `${name}_HASH` (production); otherwise hashes the plaintext `${name}` in
 * memory at boot (dev convenience). Exactly one must be present.
 */
const resolvePasswordHash = (name: string): string => {
  const preHashed = process.env[`${name}_HASH`]
  if (preHashed) return preHashed
  const plaintext = process.env[name]
  if (!plaintext) {
    throw new Error(`Missing ${name} or ${name}_HASH. See .env.example.`)
  }
  return bcrypt.hashSync(plaintext, 10)
}

export const config = {
  jwtSecret: required('JWT_SECRET'),
  adminPasswordHash: resolvePasswordHash('ADMIN_PASSWORD'),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? '12'),
  isProduction: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
}
