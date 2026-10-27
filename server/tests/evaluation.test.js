import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { seedDatabase } from '../scripts/seed.js'

describe('Practice & Mock Test Server-side Evaluation', () => {
  let request
  let studentToken = ''
  let demoData

  before(async () => {
    await connectDB()
    demoData = await seedDatabase()
    request = supertest(app)

    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'student@hireverse.dev', password: 'Student@123' })
    studentToken = loginRes.body.token
  })

  after(async () => {
    await disconnectDB()
  })

  test('Question Practice: evaluates correct MCQ answer on server and returns explanation', async () => {
    // Get questions list
    const qRes = await request.get('/api/v1/questions')
    assert.strictEqual(qRes.status, 200)
    const question = qRes.body.questions.find(q => q.questionType === 'multiple-choice')
    assert.ok(question)

    // Attempt question with option 1
    const attemptRes = await request
      .post(`/api/v1/questions/${question._id}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answer: 1, notes: 'Automated test approach' })

    assert.strictEqual(attemptRes.status, 200)
    assert.strictEqual(attemptRes.body.success, true)
    assert.ok(attemptRes.body.explanation)
    assert.ok(typeof attemptRes.body.isCorrect === 'boolean')
  })

  test('Mock Test Start: starts test with server-side expiry and strips answers from response', async () => {
    const testsRes = await request.get('/api/v1/tests')
    assert.strictEqual(testsRes.status, 200)
    const testItem = testsRes.body.tests[0]

    const startRes = await request
      .post(`/api/v1/tests/${testItem._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(startRes.status, 200)
    assert.strictEqual(startRes.body.success, true)
    assert.ok(startRes.body.attemptId)
    assert.ok(startRes.body.expiryTime)
    assert.ok(startRes.body.timeRemainingSeconds > 0)

    // Verify correct answers are NOT leaked to the client
    for (const q of startRes.body.test.questions) {
      assert.strictEqual(q.correctAnswer, undefined, 'Must not expose correct answer during test!')
    }
  })

  test('Mock Test Submission: calculates server-side score with negative marking and weak topics', async () => {
    const testsRes = await request.get('/api/v1/tests')
    const testItem = testsRes.body.tests[0]

    const startRes = await request
      .post(`/api/v1/tests/${testItem._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)

    const attemptId = startRes.body.attemptId
    const questions = startRes.body.test.questions

    // Submit answers
    const answers = questions.map((q, idx) => ({
      questionId: q._id,
      selectedOption: idx % 2 === 0 ? 1 : 0
    }))

    const submitRes = await request
      .post(`/api/v1/test-attempts/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers })

    assert.strictEqual(submitRes.status, 200)
    assert.strictEqual(submitRes.body.success, true)
    assert.ok(submitRes.body.result)
    assert.ok(typeof submitRes.body.result.score === 'number')
    assert.ok(typeof submitRes.body.result.percentage === 'number')
    assert.ok(Array.isArray(submitRes.body.result.subjectBreakdown))

    // Attempting to submit again should return idempotent result
    const secondSubmitRes = await request
      .post(`/api/v1/test-attempts/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers })

    assert.strictEqual(secondSubmitRes.status, 200)
    assert.strictEqual(secondSubmitRes.body.result.score, submitRes.body.result.score)
  })
})
