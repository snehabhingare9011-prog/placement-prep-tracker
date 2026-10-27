import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Roadmap } from '../models/Roadmap.js'
import { Company } from '../models/Company.js'

export async function calculateReadiness(userId, companyId = null, roleTitle = null) {
  // Fetch student practice attempts
  const practiceAttempts = await PracticeAttempt.find({ user: userId }).populate('question').lean()

  // Fetch student completed mock test attempts
  const testAttempts = await TestAttempt.find({ user: userId, status: 'completed' })
    .populate('test')
    .sort({ createdAt: -1 })
    .lean()

  // Fetch active roadmap
  const roadmapQuery = { user: userId }
  if (companyId) roadmapQuery.company = companyId
  const roadmap = await Roadmap.findOne(roadmapQuery).sort({ updatedAt: -1 }).lean()

  // Fetch company details if specified
  let targetCompany = null
  if (companyId) {
    targetCompany = await Company.findById(companyId).lean()
  }

  const totalPractice = practiceAttempts.length
  const totalTests = testAttempts.length

  // Check data sufficiency threshold
  const hasEnoughData = totalPractice >= 2 || totalTests >= 1

  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      overallScore: null,
      statusLabel: 'Not enough activity yet',
      message: 'Complete at least 2 practice questions or 1 mock test to unlock your transparent readiness score.',
      metrics: {
        practiceCount: totalPractice,
        testsCompleted: totalTests,
        practiceAccuracy: 0,
        averageTestScore: 0,
        roadmapCompletion: 0,
        streakDays: 0
      },
      skillsBreakdown: [
        { name: 'DSA', score: 0, status: 'needs work', attempted: 0 },
        { name: 'Core CS', score: 0, status: 'needs work', attempted: 0 },
        { name: 'Aptitude', score: 0, status: 'needs work', attempted: 0 },
        { name: 'SQL & DBMS', score: 0, status: 'needs work', attempted: 0 },
        { name: 'Interview', score: 0, status: 'needs work', attempted: 0 }
      ],
      strengths: [],
      weakAreas: [
        { name: 'Foundational Practice', score: 0, note: 'Start with high-frequency DSA or Aptitude questions' }
      ],
      recommendedActions: [
        'Attempt your first set of practice questions from the Question Bank.',
        'Take a 15-minute diagnostic mock test to benchmark your baseline readiness.',
        'Generate a tailored preparation roadmap for your target company.'
      ],
      formulaExplanation: 'Readiness = 35% Practice Accuracy + 30% Mock Test Average + 20% Roadmap Progress + 15% Subject Coverage.'
    }
  }

  // 1. Practice Accuracy (35% weight)
  const solvedCount = practiceAttempts.filter(p => p.isCorrect || p.status === 'solved').length
  const practiceAccuracy = totalPractice > 0 ? Math.round((solvedCount / totalPractice) * 100) : 0

  // 2. Mock Test Average (30% weight)
  const testScores = testAttempts.map(t => t.result?.percentage || 0)
  const averageTestScore = testScores.length > 0
    ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length)
    : practiceAccuracy // fallback to practice accuracy if no tests yet

  // 3. Roadmap Progress (20% weight)
  let roadmapCompletion = 0
  if (roadmap && roadmap.phases?.length > 0) {
    const allTasks = roadmap.phases.flatMap(p => p.tasks || [])
    const doneTasks = allTasks.filter(t => t.completed)
    roadmapCompletion = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0
  }

  // 4. Subject Coverage (15% weight)
  // Expected core subjects: DSA, DBMS, OS, Aptitude, System Design
  const subjectsCovered = new Set()
  practiceAttempts.forEach(p => {
    if (p.question?.subject) subjectsCovered.add(p.question.subject)
  })
  testAttempts.forEach(t => {
    t.result?.subjectBreakdown?.forEach(sb => {
      if (sb.totalQuestions > 0) subjectsCovered.add(sb.subject)
    })
  })
  const expectedSubjects = targetCompany?.frequentlyTestedSubjects || ['DSA', 'DBMS', 'OS', 'Aptitude', 'OOP']
  const coveredCount = expectedSubjects.filter(s => subjectsCovered.has(s)).length
  const subjectCoveragePercentage = Math.round((coveredCount / Math.max(1, expectedSubjects.length)) * 100)

  // Weighted formula:
  const weightedReadiness = Math.round(
    (practiceAccuracy * 0.35) +
    (averageTestScore * 0.30) +
    (roadmapCompletion * 0.20) +
    (subjectCoveragePercentage * 0.15)
  )

  const overallScore = Math.min(100, Math.max(0, weightedReadiness))

  // Compute subject breakdown from practice attempts and tests
  const subjectAggregates = {}
  expectedSubjects.forEach(subj => {
    subjectAggregates[subj] = { total: 0, correct: 0 }
  })

  practiceAttempts.forEach(p => {
    const s = p.question?.subject || 'Core CS'
    if (!subjectAggregates[s]) subjectAggregates[s] = { total: 0, correct: 0 }
    subjectAggregates[s].total += 1
    if (p.isCorrect || p.status === 'solved') subjectAggregates[s].correct += 1
  })

  testAttempts.forEach(t => {
    t.result?.subjectBreakdown?.forEach(sb => {
      if (!subjectAggregates[sb.subject]) subjectAggregates[sb.subject] = { total: 0, correct: 0 }
      subjectAggregates[sb.subject].total += sb.totalQuestions
      subjectAggregates[sb.subject].correct += sb.correctQuestions
    })
  })

  const skillsBreakdown = Object.entries(subjectAggregates).map(([name, data]) => {
    const score = data.total > 0 ? Math.round((data.correct / data.total) * 100) : Math.max(45, overallScore - 15)
    let status = 'on track'
    if (score >= 75) status = 'strong'
    else if (score < 60) status = 'needs work'
    return { name, score, status, attempted: data.total }
  })

  const strengths = skillsBreakdown
    .filter(s => s.score >= 70)
    .map(s => ({
      name: s.name,
      score: s.score,
      note: `${s.attempted > 0 ? `${s.attempted} attempts` : 'Strong profile match'} with solid accuracy`
    }))

  const weakAreas = skillsBreakdown
    .filter(s => s.score < 70)
    .map(s => ({
      name: s.name,
      score: s.score,
      note: s.attempted > 0 ? `Accuracy is ${s.score}% across ${s.attempted} questions` : 'Not practiced yet'
    }))

  const recommendedActions = []
  if (weakAreas.length > 0) {
    recommendedActions.push(`Practice 5 questions in ${weakAreas[0].name} to address your current bottleneck.`)
  }
  if (roadmapCompletion < 50) {
    recommendedActions.push('Complete the next milestone on your preparation roadmap.')
  }
  if (testScores.length < 3) {
    recommendedActions.push('Attempt a full-length company mock test to simulate real assessment pacing.')
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('Maintain your daily preparation streak and review advanced interview questions.')
  }

  let statusLabel = 'On track'
  if (overallScore >= 80) statusLabel = 'Strong readiness'
  else if (overallScore < 60) statusLabel = 'Needs reinforcement'

  return {
    hasEnoughData: true,
    overallScore,
    statusLabel,
    targetCompany: targetCompany ? targetCompany.name : 'Target Companies',
    metrics: {
      practiceCount: totalPractice,
      testsCompleted: totalTests,
      practiceAccuracy,
      averageTestScore,
      roadmapCompletion,
      subjectsCoveredCount: coveredCount,
      totalExpectedSubjects: expectedSubjects.length
    },
    skillsBreakdown,
    strengths,
    weakAreas,
    recommendedActions,
    formulaExplanation: 'Score = (35% Practice Accuracy) + (30% Mock Test Average) + (20% Roadmap Progress) + (15% Subject Coverage)'
  }
}
