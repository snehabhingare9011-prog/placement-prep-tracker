import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { Question } from '../src/models/Question.js'
import { Test } from '../src/models/Test.js'
import { PlacementDrive } from '../src/models/PlacementDrive.js'
import { Announcement } from '../src/models/Announcement.js'
import supertest from 'supertest'
import app from '../src/app.js'

async function runAtlasVerification() {
  console.log('=== STARTING MONGODB ATLAS VERIFICATION ===')

  try {
    // 1. Verify connection
    const conn = await connectDB()
    console.log('[Atlas Check] Connection readyState:', conn.readyState)
    console.log('[Atlas Check] Connected Host:', conn.host)
    console.log('[Atlas Check] Database Name:', conn.name)

    // 2. Query collections in Atlas
    const [userCount, companyCount, questionCount, testCount, driveCount, announcementCount] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Question.countDocuments(),
      Test.countDocuments(),
      PlacementDrive.countDocuments(),
      Announcement.countDocuments()
    ])

    console.log('[Atlas Data] Users count:', userCount)
    console.log('[Atlas Data] Companies count:', companyCount)
    console.log('[Atlas Data] Questions count:', questionCount)
    console.log('[Atlas Data] Mock Tests count:', testCount)
    console.log('[Atlas Data] Placement Drives count:', driveCount)
    console.log('[Atlas Data] Announcements count:', announcementCount)

    // 3. Test API endpoints
    const request = supertest(app)

    // Health
    const healthRes = await request.get('/api/v1/health')
    console.log('[API Test] GET /health:', healthRes.status, healthRes.body.status)

    // Login with student
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'student@hireverse.dev', password: 'Student@123' })
    console.log('[API Test] POST /auth/login:', loginRes.status, loginRes.body.success ? 'SUCCESS (Token generated)' : 'FAILED')
    const token = loginRes.body.token

    // Companies with token
    const companiesRes = await request
      .get('/api/v1/companies')
      .set('Authorization', `Bearer ${token}`)
    console.log('[API Test] GET /companies:', companiesRes.status, 'Count:', companiesRes.body.count)

    // Placement drives via /placement/drives and alias /placement-drives
    const drivesRes1 = await request.get('/api/v1/placement/drives')
    const drivesRes2 = await request.get('/api/v1/placement-drives')
    console.log('[API Test] GET /placement/drives:', drivesRes1.status, 'Count:', drivesRes1.body.count)
    console.log('[API Test] GET /placement-drives (alias):', drivesRes2.status, 'Count:', drivesRes2.body.count)

    // Announcements via /placement/announcements and alias /announcements
    const annRes1 = await request.get('/api/v1/placement/announcements')
    const annRes2 = await request.get('/api/v1/announcements')
    console.log('[API Test] GET /placement/announcements:', annRes1.status, 'Count:', annRes1.body.count)
    console.log('[API Test] GET /announcements (alias):', annRes2.status, 'Count:', annRes2.body.count)

    // Curriculum
    const currRes = await request.get('/api/v1/curriculum/all-topics')
    console.log('[API Test] GET /curriculum/all-topics:', currRes.status, 'Topics count:', currRes.body.topics?.length)

    // Roadmap
    const roadmapRes = await request
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${token}`)
    console.log('[API Test] GET /roadmaps:', roadmapRes.status, 'Has roadmap:', !!roadmapRes.body.roadmap)

    // Readiness
    const readinessRes = await request
      .get('/api/v1/readiness')
      .set('Authorization', `Bearer ${token}`)
    console.log('[API Test] GET /readiness:', readinessRes.status, 'Overall score:', readinessRes.body.readiness?.overallScore)

    await disconnectDB()
    console.log('=== ATLAS VERIFICATION COMPLETED SUCCESSFULLY ===')
    process.exit(0)
  } catch (err) {
    const safeErr = (err?.message || String(err)).replace(/:([^:@]+)@/, ':****@')
    console.error('=== ATLAS VERIFICATION FAILED ===\n', safeErr)
    process.exit(1)
  }
}

runAtlasVerification()
