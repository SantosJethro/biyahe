import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { serialize as serializeCookie } from 'cookie'
import { config } from './env'
import type { ApiRequest, ApiResponse } from './http'

/**
 * Session model
 * -------------
 * The public app needs no login. Only the admin area (price crawling) is
 * protected: clearing the admin password issues a single HttpOnly, SameSite=Lax
 * cookie carrying a signed JWT with `{ admin: true }`. The cookie is HttpOnly so
 * the token is never exposed to JS/XSS, and `Secure` in production. The password
 * is compared against a bcrypt hash with a constant-time algorithm.
 */

const COOKIE_NAME = 'biyahe_session'

export interface Session {
  admin: true
}

export const verifyAdminPassword = (password: string): boolean => {
  return bcrypt.compareSync(password, config.adminPasswordHash)
}

const sign = (session: Session): string => {
  return jwt.sign(session, config.jwtSecret, {
    expiresIn: `${config.sessionTtlHours}h`,
  })
}

/** Issue the admin session cookie on the response. */
export const setAdminCookie = (res: ApiResponse): void => {
  const token = sign({ admin: true })
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      path: '/',
      maxAge: config.sessionTtlHours * 60 * 60,
    }),
  )
}

export const clearSessionCookie = (res: ApiResponse): void => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      path: '/',
      maxAge: 0,
    }),
  )
}

/** Decode + verify the session cookie, or `null` if absent/invalid/expired. */
export const readSession = (req: ApiRequest): Session | null => {
  const token = req.cookies[COOKIE_NAME]
  if (!token) return null
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    if (typeof decoded === 'object' && decoded !== null && (decoded as Session).admin === true) {
      return { admin: true }
    }
    return null
  } catch {
    return null
  }
}

/** Guard: require admin access. Sends 401 and returns `null` when missing. */
export const requireAdmin = (req: ApiRequest, res: ApiResponse): Session | null => {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'Admin access required.' })
    return null
  }
  return session
}
