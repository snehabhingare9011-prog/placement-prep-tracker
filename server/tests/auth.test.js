import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'

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
})
