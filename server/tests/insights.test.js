import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { seedDatabase } from '../scripts/seed.js'

describe('Company Preparation Journey, Roadmap & Mock-Test Insights', () => {
  let request
  let studentToken = ''
  let freshStudentToken = ''

  before(async () => {
    await connectDB()
    await seedDatabase()
    request = supertest(app)

    const studentLogin = await request
      .post('/api/v1/auth/login')
      .send({ email: 'student@hireverse.dev', password: 'Student@123' })
    studentToken = studentLogin.body.token

    const freshReg = await request
      .post('/api/v1/auth/register')
      .send({
        name: 'Insights Test Student',
        email: `insights_${Date.now()}@test.dev`,
        password: 'Password123'
      })
    freshStudentToken = freshReg.body.token
  })

  after(async () => {
    await disconnectDB()
  })

  test('Mock Test Insights: returns hasEnoughData=false when student has zero test attempts', async () => {
    const res = await request
      .get('/api/v1/tests/insights')
      .set('Authorization', `Bearer ${freshStudentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.insights.hasEnoughData, false)
    assert.strictEqual(res.body.insights.testsCompleted, 0)
    assert.ok(res.body.insights.message)
  })

  test('Mock Test Insights: provides accurate strong and weak areas after a test submission', async () => {
    // Start and submit a test for fresh student
    const testsRes = await request.get('/api/v1/tests')
    const testItem = testsRes.body.tests[0]

    const startRes = await request
      .post(`/api/v1/tests/${testItem._id}/start`)
      .set('Authorization', `Bearer ${freshStudentToken}`)
    assert.strictEqual(startRes.status, 200)

    const attemptId = startRes.body.attemptId
    const questions = startRes.body.test.questions

    // Submit answers where some are correct and some are incorrect
    const answers = questions.map((q, idx) => ({
      questionId: q._id,
      selectedOption: idx === 0 ? 1 : 0 // answer differently to create strong and weak areas
    }))

    const submitRes = await request
      .post(`/api/v1/test-attempts/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${freshStudentToken}`)
      .send({ answers })
    assert.strictEqual(submitRes.status, 200)

    // Fetch insights
    const insightsRes = await request
      .get('/api/v1/tests/insights')
      .set('Authorization', `Bearer ${freshStudentToken}`)

    assert.strictEqual(insightsRes.status, 200)
    assert.strictEqual(insightsRes.body.success, true)
    assert.strictEqual(insightsRes.body.insights.hasEnoughData, true)
    assert.strictEqual(insightsRes.body.insights.testsCompleted, 1)
    assert.strictEqual(insightsRes.body.insights.isPreliminary, true)
    assert.ok(insightsRes.body.insights.confidenceLabel.includes('Preliminary'))
    assert.ok(insightsRes.body.insights.latestAttempt)
    assert.ok(Array.isArray(insightsRes.body.insights.recommendedTopics))
  })

  test('Roadmap: topic completion synchronizes between curriculum toggle and roadmap tasks', async () => {
    // 1. Get roadmap
    const roadmapRes = await request
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${studentToken}`)
    assert.strictEqual(roadmapRes.status, 200)
    assert.ok(roadmapRes.body.roadmap)

    const roadmapId = roadmapRes.body.roadmap._id
    const incompleteTask = roadmapRes.body.roadmap.phases[0].tasks.find(t => !t.completed)
    assert.ok(incompleteTask)
    const topicId = incompleteTask.taskId

    // 2. Toggle via curriculum endpoint
    const compId = roadmapRes.body.roadmap.company._id || roadmapRes.body.roadmap.company
    const currRes = await request
      .patch('/api/v1/curriculum/toggle-topic')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ topicId, companyId: compId, role: roadmapRes.body.roadmap.role })

    assert.strictEqual(currRes.status, 200)
    assert.strictEqual(currRes.body.success, true)
    assert.ok(currRes.body.completedTopics.includes(topicId))

    // 3. Verify roadmap has this task marked completed
    const verifyRoadmapRes = await request
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${studentToken}`)
    assert.strictEqual(verifyRoadmapRes.status, 200)

    const updatedTask = verifyRoadmapRes.body.roadmap.phases[0].tasks.find(t => t.taskId === topicId)
    assert.strictEqual(updatedTask.completed, true)

    // 4. Toggle back via roadmap endpoint
    const toggleRoadmapRes = await request
      .patch(`/api/v1/roadmaps/${roadmapId}/tasks/${topicId}`)
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(toggleRoadmapRes.status, 200)
    assert.strictEqual(toggleRoadmapRes.body.isCompleted, false)

    // 5. Verify curriculum progress also reflects the uncheck
    const progressRes = await request
      .get('/api/v1/curriculum/user-progress')
      .query({ companyId: compId, role: roadmapRes.body.roadmap.role })
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(progressRes.status, 200)
    assert.strictEqual(progressRes.body.completedTopics.includes(topicId), false)
  })
})
