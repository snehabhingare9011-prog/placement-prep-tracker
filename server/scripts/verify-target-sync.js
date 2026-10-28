import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { Roadmap } from '../src/models/Roadmap.js'
import { Test } from '../src/models/Test.js'
import supertest from 'supertest'
import app from '../src/app.js'

async function runVerification() {
  console.log('=== STARTING TARGET SYNCHRONIZATION AND SCOPING VERIFICATION ===\n')

  await connectDB()
  const request = supertest(app)

  // 1. Fetch available companies
  const companies = await Company.find({ isActive: true }).limit(3).lean()
  if (companies.length < 2) {
    throw new Error('Need at least 2 companies in database to test target switching.')
  }
  const companyA = companies[0]
  const companyB = companies[1]
  const roleA = companyA.roles[0] || 'Software Engineer'
  const roleB = companyB.roles[0] || 'Frontend Engineer'

  console.log(`[Test Setup] Company A: ${companyA.name} (${roleA})`)
  console.log(`[Test Setup] Company B: ${companyB.name} (${roleB})`)

  // 2. Create student 1
  const uniqueSuffix = Date.now()
  const student1Email = `student_test_${uniqueSuffix}@hireverse.dev`
  const student1Password = 'Password@123'

  const registerRes1 = await request.post('/api/v1/auth/register').send({
    name: 'Test Student 1',
    email: student1Email,
    password: student1Password,
    college: 'Apex Institute',
    degree: 'B.Tech',
    branch: 'Computer Engineering',
    graduationYear: 2026,
    cgpa: 8.5
  })

  console.log(`[Test 1] Student 1 registered:`, registerRes1.status, registerRes1.body.success)
  const token1 = registerRes1.body.token

  // 3. First-time target selection for Student 1 -> Company A
  const setTargetRes1 = await request
    .patch('/api/v1/users/me/target')
    .set('Authorization', `Bearer ${token1}`)
    .send({ companyId: companyA._id, role: roleA })

  console.log(`[Test 2] Student 1 set target to Company A:`, setTargetRes1.status, setTargetRes1.body.success, setTargetRes1.body.user.currentTargetRole)

  // 4. Verify curriculum progress for Company A (initially 0 topics)
  const curriculumRes1 = await request
    .get(`/api/v1/curriculum/company/${companyA._id}?roles=${roleA}`)
    .set('Authorization', `Bearer ${token1}`)

  const topicA1 = curriculumRes1.body.topics[0]?.id
  console.log(`[Test 3] Company A curriculum loaded: ${curriculumRes1.body.totalTopics} topics. Selected topic: ${topicA1}`)

  // 5. Complete topicA1 for Company A
  const toggleRes1 = await request
    .patch('/api/v1/curriculum/toggle-topic')
    .set('Authorization', `Bearer ${token1}`)
    .send({ topicId: topicA1, companyId: companyA._id, role: roleA })

  console.log(`[Test 4] Toggled topic for Company A:`, toggleRes1.body.isCompleted, `Completed count: ${toggleRes1.body.completedTopics?.length}`)

  // 6. Verify Roadmap for Company A
  const roadmapRes1 = await request
    .get(`/api/v1/roadmaps?companyId=${companyA._id}&role=${roleA}`)
    .set('Authorization', `Bearer ${token1}`)

  console.log(`[Test 5] Roadmap for Company A retrieved/generated:`, roadmapRes1.status, `Phases: ${roadmapRes1.body.roadmap?.phases?.length}`)
  const taskIdA = roadmapRes1.body.roadmap?.phases[0]?.tasks[0]?.taskId

  // Complete a roadmap task for Company A
  if (taskIdA) {
    const taskToggleRes = await request
      .patch(`/api/v1/roadmaps/${roadmapRes1.body.roadmap._id}/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${token1}`)
    console.log(`[Test 6] Toggled roadmap task for Company A:`, taskToggleRes.body.success, `Progress: ${taskToggleRes.body.progressPercentage}%`)
  }

  // 7. Check Readiness Score for Company A
  const readinessRes1 = await request
    .get(`/api/v1/readiness?companyId=${companyA._id}&role=${roleA}`)
    .set('Authorization', `Bearer ${token1}`)

  console.log(`[Test 7] Readiness for Company A: hasEnoughData: ${readinessRes1.body.readiness.hasEnoughData}, metrics:`, readinessRes1.body.readiness.metrics)

  // 8. NOW SWITCH TARGET TO COMPANY B
  console.log(`\n--- SWITCHING TARGET TO COMPANY B ---`)
  const setTargetResB = await request
    .patch('/api/v1/users/me/target')
    .set('Authorization', `Bearer ${token1}`)
    .send({ companyId: companyB._id, role: roleB })

  console.log(`[Test 8] Target switched to Company B:`, setTargetResB.body.success, setTargetResB.body.user.currentTargetRole)

  // 9. Verify Company B has its own fresh/independent topics (topicA1 should NOT be in Company B completed topics)
  const userProgressB = await request
    .get(`/api/v1/curriculum/user-progress?companyId=${companyB._id}&role=${roleB}`)
    .set('Authorization', `Bearer ${token1}`)

  console.log(`[Test 9] Company B completed topics:`, userProgressB.body.completedTopics)
  if (userProgressB.body.completedTopics.includes(topicA1)) {
    throw new Error('Cross-contamination: Company A topic found in Company B progress!')
  }
  console.log('✓ Verified: Company B is cleanly isolated from Company A topics.')

  // 10. Switch BACK to Company A
  console.log(`\n--- SWITCHING BACK TO COMPANY A ---`)
  const setTargetResA2 = await request
    .patch('/api/v1/users/me/target')
    .set('Authorization', `Bearer ${token1}`)
    .send({ companyId: companyA._id, role: roleA })

  console.log(`[Test 10] Switched back to Company A:`, setTargetResA2.body.success)

  // 11. Verify Company A's previously completed topics are RESTORED!
  const userProgressA2 = await request
    .get(`/api/v1/curriculum/user-progress?companyId=${companyA._id}&role=${roleA}`)
    .set('Authorization', `Bearer ${token1}`)

  console.log(`[Test 11] Company A restored completed topics:`, userProgressA2.body.completedTopics)
  if (!userProgressA2.body.completedTopics.includes(topicA1)) {
    throw new Error('Data loss: Company A completed topic was lost after switching back!')
  }
  console.log('✓ Verified: Company A progress was perfectly restored without data loss!')

  // 12. Verify Roadmap task checkmark for Company A is also preserved!
  const roadmapResA2 = await request
    .get(`/api/v1/roadmaps?companyId=${companyA._id}&role=${roleA}`)
    .set('Authorization', `Bearer ${token1}`)

  const phase0Task0 = roadmapResA2.body.roadmap?.phases[0]?.tasks[0]
  console.log(`[Test 12] Company A roadmap task preserved: taskId: ${phase0Task0?.taskId}, completed: ${phase0Task0?.completed}`)
  if (taskIdA && !phase0Task0?.completed) {
    throw new Error('Data loss: Company A roadmap task completion was lost!')
  }
  console.log('✓ Verified: Roadmap checkmarks preserved per target company!')

  // 13. Test student data isolation (Student 2)
  console.log(`\n--- TESTING STUDENT ISOLATION ---`)
  const student2Email = `student2_${uniqueSuffix}@hireverse.dev`
  const registerRes2 = await request.post('/api/v1/auth/register').send({
    name: 'Test Student 2',
    email: student2Email,
    password: student1Password,
    college: 'Apex Institute',
    degree: 'B.Tech',
    branch: 'Computer Engineering',
    graduationYear: 2026,
    cgpa: 8.5
  })
  const token2 = registerRes2.body.token

  const userProgressStudent2 = await request
    .get(`/api/v1/curriculum/user-progress?companyId=${companyA._id}&role=${roleA}`)
    .set('Authorization', `Bearer ${token2}`)

  console.log(`[Test 13] Student 2 completed topics for Company A:`, userProgressStudent2.body.completedTopics)
  if (userProgressStudent2.body.completedTopics.includes(topicA1)) {
    throw new Error('Multi-tenancy leak: Student 2 has Student 1 completed topics!')
  }
  console.log('✓ Verified: Student 2 progress is strictly isolated from Student 1!')

  // Cleanup test users created for this verification run
  await User.deleteMany({ email: { $in: [student1Email, student2Email] } })
  await Roadmap.deleteMany({ user: { $in: [registerRes1.body.user._id, registerRes2.body.user._id] } })
  console.log('\n[Cleanup] Test accounts and roadmaps cleaned up safely from Atlas.')

  await disconnectDB()
  console.log('\n=== ALL TARGET SYNCHRONIZATION AND SCOPING TESTS PASSED ===')
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err)
  process.exit(1)
})
