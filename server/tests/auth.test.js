import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { getTestSentOtp } from '../src/services/emailService.js'

describe('Authentication & Role Authorization', () => {
  let request
  let studentToken = ''
  let adminToken = ''

  before(async () => {
    await connectDB()
    request = supertest(app)
  })

  after(async () => {
    await disconnectDB()
  })

  test('Public Registration: creates a new student with hashed password', async () => {
    const email = `teststudent_${Date.now()}@example.com`
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Student',
        email,
        password: 'Password123',
        college: 'Apex Tech',
        branch: 'Computer Engineering'
      })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.success, true)
    assert.ok(res.body.token)
    assert.strictEqual(res.body.user.role, 'student')
    studentToken = res.body.token
  })

  test('Public Registration: prevents role escalation to admin', async () => {
    const email = `attacker_${Date.now()}@example.com`
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Attacker',
        email,
        password: 'Password123',
        role: 'admin' // Attempted escalation
      })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.user.role, 'student', 'Role must remain student')
  })

  test('Login: returns 401 for invalid credentials', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'WrongPassword'
      })

    assert.strictEqual(res.status, 401)
    assert.strictEqual(res.body.success, false)
  })

  test('Protected Route: returns 401 when no token is provided', async () => {
    const res = await request.get('/api/v1/auth/me')
    assert.strictEqual(res.status, 401)
  })

  test('Protected Route: returns user profile when valid token provided', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.user.name, 'Test Student')
  })

  test('Role Authorization: rejects student from accessing administrative endpoint', async () => {
    const res = await request
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 403)
    assert.strictEqual(res.body.success, false)
  })

  // Direct Registration & Account Management Tests
  let directCandidateEmail = ''
  let directCandidatePassword = 'CandidateSecurePass123'
  let deletableCandidateToken = ''
  let deletableCandidateId = ''

  test('Direct Registration: creates an account directly without OTP', async () => {
    directCandidateEmail = `candidate_${Date.now()}@test.dev`
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Sharma',
        email: directCandidateEmail,
        password: directCandidatePassword,
        college: 'National Engineering College',
        branch: 'Information Technology',
        graduationYear: 2026,
        cgpa: 8.9
      })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.success, true)
    assert.ok(res.body.token, 'Should return JWT token directly upon registration')
    assert.strictEqual(res.body.user.email, directCandidateEmail)
    assert.strictEqual(res.body.user.role, 'student')

    deletableCandidateToken = res.body.token
    deletableCandidateId = res.body.user.id || res.body.user._id
  })

  test('Registration Validation: rejects registration when required fields or password length fail', async () => {
    // Missing required fields
    const missingRes = await request
      .post('/api/v1/auth/register')
      .send({ email: 'incomplete@test.dev' })

    assert.strictEqual(missingRes.status, 400)
    assert.strictEqual(missingRes.body.success, false)

    // Password too short (< 6 chars)
    const shortPassRes = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Short Pass Candidate',
        email: `shortpass_${Date.now()}@test.dev`,
        password: '123'
      })

    assert.strictEqual(shortPassRes.status, 400)
    assert.strictEqual(shortPassRes.body.success, false)
  })

  test('Duplicate Email Prevention: rejects registration when email is already registered', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Attempt',
        email: directCandidateEmail,
        password: 'AnotherPassword123'
      })

    assert.strictEqual(res.status, 409)
    assert.strictEqual(res.body.success, false)
    assert.match(res.body.message, /already exist/i)
  })

  test('Login Validation & Error Messages: returns specific messages for empty fields and bad credentials', async () => {
    // Empty email
    const emptyEmailRes = await request
      .post('/api/v1/auth/login')
      .send({ password: 'Password123' })
    assert.strictEqual(emptyEmailRes.status, 400)
    assert.strictEqual(emptyEmailRes.body.message, 'Please enter your email address.')

    // Empty password
    const emptyPassRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' })
    assert.strictEqual(emptyPassRes.status, 400)
    assert.strictEqual(emptyPassRes.body.message, 'Please enter your password.')

    // Invalid email format
    const badEmailRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'notanemail', password: 'Password123' })
    assert.strictEqual(badEmailRes.status, 400)
    assert.strictEqual(badEmailRes.body.message, 'Please enter a valid email address.')

    // Mismatched credentials
    const mismatchRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent_user@example.com', password: 'WrongPassword123' })
    assert.strictEqual(mismatchRes.status, 401)
    assert.strictEqual(mismatchRes.body.message, 'Invalid email or password. Please check your credentials and try again.')
  })

  test('Password Security: stores hashed password in database, never plaintext', async () => {
    const userInDb = await User.findOne({ email: directCandidateEmail }).select('+password')
    assert.ok(userInDb, 'User must exist in database')
    assert.notStrictEqual(userInDb.password, directCandidatePassword)
    assert.ok(userInDb.password.startsWith('$2'), 'Must be a bcrypt password hash')
  })

  test('Post-Registration Login: newly registered candidate logs in successfully', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({
        email: directCandidateEmail,
        password: directCandidatePassword
      })

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.ok(res.body.token)
  })

  test('Password Recovery Flow: obsolete recovery routes are no longer accessible', async () => {
    const res = await request
      .post('/api/v1/auth/forgot-password')
      .send({ email: directCandidateEmail })

    assert.strictEqual(res.status, 404)
  })

  test('Account Deletion: rejects deletion when password is wrong', async () => {
    const res = await request
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${deletableCandidateToken}`)
      .send({ password: 'WrongPasswordAttempt' })

    assert.strictEqual(res.status, 401)
    assert.strictEqual(res.body.success, false)
  })

  test('Account Deletion: permanently deletes candidate account and invalidates session', async () => {
    const res = await request
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${deletableCandidateToken}`)
      .send({ password: directCandidatePassword })

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)

    // Verify user record no longer exists
    const userInDb = await User.findById(deletableCandidateId)
    assert.strictEqual(userInDb, null, 'User document must be completely removed from database')

    // Verify subsequent requests with old token are rejected
    const sessionCheck = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${deletableCandidateToken}`)

    assert.strictEqual(sessionCheck.status, 401)
  })
})
