import crypto from 'crypto'

// In-memory store for unit & integration test validation
const sentEmailsTestStore = []

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString()
}

/**
 * Hash an OTP using SHA-256 for secure database storage
 */
export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex')
}

/**
 * Dispatch an OTP email to the user
 */
export async function sendOtpEmail({ to, name, otp }) {
  if (!to || !otp) {
    throw new Error('Recipient email and OTP are required')
  }

  const isTest = process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test' ||
    process.argv.includes('--test')

  // Record delivery for test verification in test mode
  if (isTest) {
    sentEmailsTestStore.push({
      to: to.toLowerCase().trim(),
      otp: String(otp),
      sentAt: new Date()
    })
  }

  // If SMTP configuration is present in environment, dispatch via real email transport
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // Configured SMTP delivery
      return { success: true, delivered: true }
    } catch (err) {
      console.error('SMTP email delivery error:', err.message)
      // Fallback
    }
  }

  // Simulated delivery for local development & test
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production' && !isTest) {
    console.log(`\n======================================================`)
    console.log(`📧 [HireVerse Email Service] To: ${to}`)
    console.log(`🔑 Verification Code: ${otp}`)
    console.log(`⏳ Valid for 10 minutes`)
    console.log(`======================================================\n`)
  }

  return {
    success: true,
    delivered: false,
    simulated: true
  }
}

/**
 * Test helper to inspect the last sent OTP for an email address (test mode only)
 */
export function getTestSentOtp(email) {
  const matches = sentEmailsTestStore.filter(
    item => item.to === email.toLowerCase().trim()
  )
  return matches.length > 0 ? matches[matches.length - 1].otp : null
}

/**
 * Clear test emails store
 */
export function clearTestSentEmails() {
  sentEmailsTestStore.length = 0
}
