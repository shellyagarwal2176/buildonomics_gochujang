const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {
  insertHousehold,
  getHouseholdByPairingCode,
  getHouseholdById,
  updateHouseholdPairingCode,
  insertMirrorDevice,
  getMirrorDeviceByToken,
  insertFamilyMember,
  getFamilyMember,
} = require('./db')

// Two-tier auth (see CLAUDE.md's Authentication section):
//   1. Household pairing code — the mirror silently pairs once at first
//      launch (see mirror/src/lib/pairing.js) using a device token, no login
//      screen for her.
//   2. Named family member accounts — password-based, JWT-authenticated, one
//      per household member on the dashboard.
// JWT_SECRET falls back to a dev value so `npm run dev` works out of the box
// without extra setup — set a real JWT_SECRET env var for anything beyond
// local hackathon dev.
const JWT_SECRET = process.env.JWT_SECRET || 'ghar-sanket-dev-secret-do-not-use-in-prod'
const JWT_EXPIRY = '30d'
const BCRYPT_ROUNDS = 10

// 0/O and 1/I excluded so a code read off the mirror screen and typed by
// hand on the dashboard isn't ambiguous.
const PAIRING_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const PAIRING_CODE_LENGTH = 6

function generatePairingCode() {
  let code = ''
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    code += PAIRING_CODE_ALPHABET[crypto.randomInt(PAIRING_CODE_ALPHABET.length)]
  }
  return code
}

// Retries on the practically-impossible chance of a collision — `save` throws
// on the households.pairing_code UNIQUE constraint rather than silently
// colliding two households onto the same code.
function withUniquePairingCode(save) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const pairingCode = generatePairingCode()
    try {
      save(pairingCode)
      return pairingCode
    } catch (err) {
      if (!/UNIQUE/.test(err.message)) throw err
    }
  }
  throw new Error('Could not generate a unique pairing code, try again')
}

function createHousehold() {
  let householdId
  const pairingCode = withUniquePairingCode((code) => {
    householdId = insertHousehold(code)
  })
  return { householdId, pairingCode }
}

// Rotates a household's pairing code — e.g. if it leaked, or was shared more
// widely than intended. Deliberately does NOT touch mirror_devices or
// already-issued family JWTs: a device token proves a mirror already paired,
// and a JWT proves someone already logged in, neither of which depends on
// still knowing the pairing code. Only a *new* mirror pairing or family
// signup/login needs the new code — see CLAUDE.md's Authentication section.
function regenerateHouseholdCode(householdId) {
  if (!getHouseholdById(householdId)) throw new Error('Unknown household')
  return withUniquePairingCode((code) => updateHouseholdPairingCode(householdId, code))
}

function pairMirror(pairingCode) {
  const household = getHouseholdByPairingCode(String(pairingCode || '').toUpperCase())
  if (!household) throw new Error('Unknown pairing code')

  const deviceToken = crypto.randomBytes(24).toString('hex')
  insertMirrorDevice(household.id, deviceToken)
  return { deviceToken, householdId: household.id }
}

// Returns { householdId } or null — never throws, so callers (the socket.io
// auth middleware) can treat "invalid token" and "no token" the same way.
function verifyDeviceToken(deviceToken) {
  if (!deviceToken) return null
  const device = getMirrorDeviceByToken(deviceToken)
  return device ? { householdId: device.household_id } : null
}

function issueFamilyToken({ householdId, memberId, name }) {
  return jwt.sign({ householdId, memberId, name, role: 'family' }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function signupFamilyMember(pairingCode, name, password) {
  const household = getHouseholdByPairingCode(String(pairingCode || '').toUpperCase())
  if (!household) throw new Error('Unknown pairing code')
  if (!name || !name.trim()) throw new Error('Name is required')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
  if (getFamilyMember(household.id, name.trim())) {
    throw new Error('That name is already registered for this household')
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  const memberId = insertFamilyMember(household.id, name.trim(), passwordHash)
  return issueFamilyToken({ householdId: household.id, memberId, name: name.trim() })
}

function loginFamilyMember(pairingCode, name, password) {
  // Same generic error for "no such household", "no such name", and "wrong
  // password" — don't give an attacker a way to enumerate valid pairing
  // codes or member names one field at a time.
  const invalid = () => new Error('Invalid pairing code, name, or password')

  const household = getHouseholdByPairingCode(String(pairingCode || '').toUpperCase())
  if (!household) throw invalid()

  const member = getFamilyMember(household.id, String(name || '').trim())
  if (!member || !bcrypt.compareSync(String(password || ''), member.password_hash)) throw invalid()

  return issueFamilyToken({ householdId: household.id, memberId: member.id, name: member.name })
}

// Returns the decoded payload or null — never throws, same reasoning as
// verifyDeviceToken.
function verifyFamilyToken(token) {
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload.role === 'family' ? payload : null
  } catch {
    return null
  }
}

module.exports = {
  createHousehold,
  regenerateHouseholdCode,
  pairMirror,
  verifyDeviceToken,
  signupFamilyMember,
  loginFamilyMember,
  verifyFamilyToken,
}
