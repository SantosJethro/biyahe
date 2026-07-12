/**
 * Generate a bcrypt hash for a password gate.
 *
 *   npm run hash-password -- "my-secret"
 *
 * Put the printed value in `.env` as SITE_PASSWORD_HASH or ADMIN_PASSWORD_HASH
 * (recommended for production so no plaintext password is stored).
 */
import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run hash-password -- "<password>"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log(hash)
