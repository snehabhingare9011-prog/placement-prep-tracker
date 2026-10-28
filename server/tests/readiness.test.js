import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { seedDatabase } from '../scripts/seed.js'

describe('Readiness Scoring & Preparation Roadmap Engine', () => {
  let request
  let studentToken = ''
  let newStudentToken = ''

  before(async () => {
    await connectDB()
    await seedDatabase()
    request = supertest(app)

    // Login existing seeded student
    const studentLogin = await request
      .post('/api/v1/auth/login')
      .send({ email: 'student@hireverse.dev', password: 'Student@123' })
    studentToken = studentLogin.body.token

    // Register a brand new student with no attempts
    const newReg = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Fresh Student',
        email: `fresh_${Date.now()}@example.com`,
        password: 'Password123'
      })
    newStudentToken = newReg.body.token
  })

  after(async () => {
    await disconnectDB()
  })

  test('Readiness: displays "Not enough activity yet" when student has insufficient attempts', async () => {
    const res = await request
      .get('/api/v1/readiness')
      .set('Authorization', `Bearer ${newStudentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.readiness.hasEnoughData, false)
    assert.strictEqual(res.body.readiness.overallScore, null)
    assert.strictEqual(res.body.readiness.statusLabel, 'Not enough activity yet')
  })

  test('Readiness: computes deterministic weighted score when student has real activity', async () => {
    const res = await request
      .get('/api/v1/readiness')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.readiness.hasEnoughData, true)
    assert.ok(typeof res.body.readiness.overallScore === 'number')
    assert.ok(res.body.readiness.overallScore > 0 && res.body.readiness.overallScore <= 100)
    assert.ok(Array.isArray(res.body.readiness.skillsBreakdown))
    assert.ok(res.body.readiness.formulaExplanation)

    // Verify evidence-based scores (no fabricated percentages for unattempted subjects)
    res.body.readiness.skillsBreakdown.forEach(skill => {
      if (skill.attempted === 0) {
        assert.strictEqual(skill.score, null, 'Unattempted subject must have null score, not fabricated percentage')
        assert.strictEqual(skill.status, 'untested')
      } else {
        assert.ok(typeof skill.score === 'number')
      }
    })

    // Verify round-wise readiness when recruitment rounds exist
    assert.ok(Array.isArray(res.body.readiness.roundReadiness))
    if (res.body.readiness.roundReadiness.length > 0) {
      const firstRound = res.body.readiness.roundReadiness[0]
      assert.ok(firstRound.name)
      assert.ok(['Completed', 'In Progress', 'Pending'].includes(firstRound.status))
    }

    // Verify separate metrics for preparation progress and test performance
    assert.ok(typeof res.body.readiness.metrics.preparationProgress === 'number')
    assert.ok(typeof res.body.readiness.metrics.averageTestScore === 'number')

    // Verify Section A: Preparation Progress
    assert.ok(res.body.readiness.preparation)
    assert.ok(typeof res.body.readiness.preparation.completedTopics === 'number')
    assert.ok(typeof res.body.readiness.preparation.totalTopics === 'number')
    assert.ok(typeof res.body.readiness.preparation.percentage === 'number')

    // Verify Section B: Mock Performance & Score History
    assert.ok(res.body.readiness.mockPerformance)
    assert.ok(typeof res.body.readiness.mockPerformance.testsCompleted === 'number')
    assert.ok(Array.isArray(res.body.readiness.mockPerformance.recentTestHistory))

    // Verify Section C: Subject-wise evidence
    assert.ok(Array.isArray(res.body.readiness.subjectAnalysis))
    res.body.readiness.subjectAnalysis.forEach(sa => {
      assert.ok(['Strong', 'Needs Focus', 'Not Enough Data', 'Not Attempted'].includes(sa.status))
      if (sa.attempted === 0) {
        assert.strictEqual(sa.accuracy, null)
      } else {
        assert.ok(typeof sa.accuracy === 'number')
      }
    })

    // Verify Section D: Prioritized next actions (max 3)
    assert.ok(Array.isArray(res.body.readiness.nextActions))
    assert.ok(res.body.readiness.nextActions.length <= 3)
    if (res.body.readiness.nextActions.length > 0) {
      assert.ok(res.body.readiness.nextActions[0].title)
      assert.ok(res.body.readiness.nextActions[0].actionLink)
    }
  })

  test('Roadmap: retrieves or generates structured 4-phase preparation plan', async () => {
    const res = await request
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.ok(res.body.roadmap)
    assert.strictEqual(res.body.roadmap.phases.length, 4)

    const firstTask = res.body.roadmap.phases[0].tasks[0]
    assert.ok(firstTask.taskId)
    assert.ok(firstTask.title)

    // Toggle task completion
    const toggleRes = await request
      .patch(`/api/v1/roadmaps/${res.body.roadmap._id}/tasks/${firstTask.taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(toggleRes.status, 200)
    assert.strictEqual(toggleRes.body.success, true)
    assert.ok(typeof toggleRes.body.progressPercentage === 'number')
  })
})
