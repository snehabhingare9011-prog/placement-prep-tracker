import test, { describe, before, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import app from '../src/app.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Notification } from '../src/models/Notification.js'
import { Company } from '../src/models/Company.js'

describe('Notification System & Real-Time Sync', () => {
  let request
  let studentToken = ''
  let studentUser = null

  before(async () => {
    await connectDB()
    request = supertest(app)

    // Find or create test student
    studentUser = await User.findOne({ role: 'student' }).populate('targetCompany')
    if (!studentUser) {
      const company = await Company.findOne()
      studentUser = await User.create({
        name: 'Notification Test Candidate',
        email: `notif_candidate_${Date.now()}@example.com`,
        password: 'Password123',
        college: 'Apex Tech Institute',
        branch: 'Computer Engineering',
        role: 'student',
        targetCompany: company?._id,
        currentTargetRole: 'Software Engineer'
      })
    }

    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: studentUser.email, password: 'Password123' })

    if (loginRes.body.token) {
      studentToken = loginRes.body.token
    }
  })

  after(async () => {
    await disconnectDB()
  })

  test('Security: rejects unauthenticated requests to notifications endpoint', async () => {
    const res = await request.get('/api/v1/notifications')
    assert.strictEqual(res.status, 401)
    assert.strictEqual(res.body.success, false)
  })

  test('Notifications Feed: returns user notifications, unreadCount, and category breakdown', async () => {
    const res = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.ok(Array.isArray(res.body.notifications))
    assert.strictEqual(typeof res.body.unreadCount, 'number')
    assert.ok(res.body.categoryUnread)
    assert.strictEqual(typeof res.body.categoryUnread.all, 'number')
    assert.strictEqual(typeof res.body.categoryUnread.preparation, 'number')
    assert.strictEqual(typeof res.body.categoryUnread.mock_tests, 'number')
    assert.strictEqual(typeof res.body.categoryUnread.placement_drives, 'number')
  })

  test('Category Filter: filters feed by preparation category', async () => {
    const res = await request
      .get('/api/v1/notifications?category=preparation')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.ok(Array.isArray(res.body.notifications))
    res.body.notifications.forEach(n => {
      assert.strictEqual(n.category, 'preparation')
    })
  })

  test('Mark Single Read: marks notification as read and updates unread count', async () => {
    // Insert a test notification for this student
    const testNotif = await Notification.create({
      recipient: studentUser._id,
      category: 'preparation',
      type: 'preparation_progress',
      title: 'Test Notification Single Read',
      message: 'Testing marking as read single notification.',
      eventKey: `test_single_read_${Date.now()}`,
      isRead: false
    })

    const res = await request
      .patch(`/api/v1/notifications/${testNotif._id}/read`)
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.notification.isRead, true)

    const updated = await Notification.findById(testNotif._id)
    assert.strictEqual(updated.isRead, true)
    assert.ok(updated.readAt)
  })

  test('Mark All Read: marks all notifications as read and resets unread count', async () => {
    // Insert a couple unread notifications
    await Notification.create([
      {
        recipient: studentUser._id,
        category: 'mock_tests',
        type: 'new_assessment',
        title: 'Batch Unread Test 1',
        message: 'Testing mark all read.',
        eventKey: `test_batch_1_${Date.now()}`,
        isRead: false
      },
      {
        recipient: studentUser._id,
        category: 'placement_drives',
        type: 'new_drive',
        title: 'Batch Unread Test 2',
        message: 'Testing mark all read.',
        eventKey: `test_batch_2_${Date.now()}`,
        isRead: false
      }
    ])

    const res = await request
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.unreadCount, 0)

    const remainingUnread = await Notification.countDocuments({
      recipient: studentUser._id,
      isRead: false
    })
    assert.strictEqual(remainingUnread, 0)
  })

  test('Deduplication: repetitive sync calls never create duplicate notifications for same event', async () => {
    const firstCall = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`)

    const secondCall = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`)

    assert.strictEqual(firstCall.body.totalCount, secondCall.body.totalCount)

    // Check database directly for any duplicated eventKeys
    const allNotifs = await Notification.find({ recipient: studentUser._id }).lean()
    const keys = allNotifs.map(n => n.eventKey)
    const uniqueKeys = new Set(keys)
    assert.strictEqual(keys.length, uniqueKeys.size, 'All eventKeys for user must be unique')
  })
})
