import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Roadmap } from '../models/Roadmap.js'
import { Company } from '../models/Company.js'
import { User } from '../models/User.js'
import { getCurriculumForCompany } from './curriculumService.js'

export async function calculateReadiness(userId, companyId = null, roleTitle = null) {
  const user = await User.findById(userId).lean()
  const activeCompanyId = companyId || user?.targetCompany
  const activeRole = roleTitle || user?.currentTargetRole || 'Software Engineer'

  // Fetch student practice attempts
  const practiceAttempts = await PracticeAttempt.find({ user: userId }).populate('question').lean()

  // Fetch student completed mock test attempts
  const testAttempts = await TestAttempt.find({ user: userId, status: 'completed' })
    .populate('test')
    .sort({ createdAt: -1 })
    .lean()

  // Fetch active roadmap for target company
  const roadmapQuery = { user: userId }
  if (activeCompanyId) roadmapQuery.company = activeCompanyId
  const roadmap = await Roadmap.findOne(roadmapQuery).sort({ updatedAt: -1 }).lean()

  // Fetch company details if specified
  let targetCompany = null
  if (activeCompanyId) {
    targetCompany = await Company.findById(activeCompanyId).lean()
  }

  // Determine completed curriculum topics for this specific target
  let completedTopics = user?.completedTopics || []
  if (activeCompanyId && user?.targetProgress?.length > 0) {
    const entry = user.targetProgress.find(
      tp => tp.company?.toString() === activeCompanyId.toString() && (tp.role === activeRole || !tp.role)
    )
    if (entry) {
      completedTopics = entry.completedTopics || []
    }
  }

  let totalCurriculumTopics = 0
  let completedCurriculumCount = 0
  let topicCompletion = 0

  if (targetCompany) {
    const curriculum = getCurriculumForCompany(targetCompany, [activeRole])
    if (curriculum && curriculum.totalTopics > 0) {
      totalCurriculumTopics = curriculum.totalTopics
      completedCurriculumCount = curriculum.topics.filter(t => completedTopics.includes(t.id)).length
      topicCompletion = Math.round((completedCurriculumCount / totalCurriculumTopics) * 100)
    }
  }

  // Roadmap Progress (tasks completion)
  let roadmapCompletion = 0
  if (roadmap && roadmap.phases?.length > 0) {
    const allTasks = roadmap.phases.flatMap(p => p.tasks || [])
    const doneTasks = allTasks.filter(t => t.completed)
    roadmapCompletion = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0
  }

  // Combined Roadmap and Topic Checkmarks (20% weight)
  let roadmapAndTopicProgress = roadmapCompletion
  if (totalCurriculumTopics > 0 && roadmap) {
    roadmapAndTopicProgress = Math.round((roadmapCompletion * 0.5) + (topicCompletion * 0.5))
  } else if (totalCurriculumTopics > 0) {
    roadmapAndTopicProgress = topicCompletion
  }

  // Relevant Mock Tests for this target
  let relevantTests = testAttempts
  if (activeCompanyId) {
    const companySpecificTests = testAttempts.filter(
      t => t.test?.company?.toString() === activeCompanyId.toString() || t.company?.toString() === activeCompanyId.toString()
    )
    if (companySpecificTests.length > 0) {
      relevantTests = companySpecificTests
    }
  }

  const totalPractice = practiceAttempts.length
  const totalTests = relevantTests.length

  // Check data sufficiency threshold based on genuine learning and assessment activity
  const hasEnoughData = totalTests >= 1 || completedCurriculumCount >= 2 || roadmapCompletion >= 10 || totalPractice >= 2

  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      overallScore: null,
      statusLabel: 'Not enough activity yet',
      message: 'Complete some learning topics and take a mock test to start tracking your preparation.',
      targetCompany: targetCompany ? targetCompany.name : 'Target Companies',
      targetRole: activeRole,
      metrics: {
        testsCompleted: totalTests,
        averageTestScore: 0,
        roadmapCompletion: roadmapCompletion,
        curriculumTopicsCompleted: completedCurriculumCount,
        totalCurriculumTopics,
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
        { name: 'Core Syllabus Topics', score: 0, note: 'Study fundamental curriculum topics in Preparation Hub' }
      ],
      recommendedActions: [
        'Explore your structured learning topics in the Preparation Hub.',
        'Take a timed mock assessment to benchmark your placement readiness.',
        'Follow your tailored preparation roadmap for your target company.'
      ],
      formulaExplanation: 'Preparation Score = (40% Curriculum Topics) + (40% Mock Test Average) + (20% Roadmap Milestones)'
    }
  }

  // 1. Curriculum Topics Progress (40% weight)
  // computed in topicCompletion (0 - 100)

  // 2. Mock Test Average (40% weight if tests exist, else topics & roadmap carry the weight)
  const testScores = relevantTests.map(t => t.result?.percentage || 0)
  const averageTestScore = testScores.length > 0
    ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length)
    : 0

  // 3. Roadmap Milestone Completion (20% weight)
  // computed in roadmapCompletion (0 - 100)

  // Weighted score calculation based on genuine learning & assessment data:
  let weightedReadiness = 0
  let formulaExplanation = ''

  if (testScores.length > 0) {
    weightedReadiness = Math.round(
      (topicCompletion * 0.40) +
      (averageTestScore * 0.40) +
      (roadmapCompletion * 0.20)
    )
    formulaExplanation = 'Preparation Score = (40% Curriculum Topics) + (40% Mock Test Average) + (20% Roadmap Milestones)'
  } else {
    // When no mock tests submitted yet, weight topic completion and roadmap milestones
    weightedReadiness = Math.round(
      (topicCompletion * 0.60) +
      (roadmapCompletion * 0.40)
    )
    formulaExplanation = 'Preparation Score = (60% Curriculum Topics) + (40% Roadmap Milestones) · Mock Test Benchmark Pending'
  }

  // If student has legacy practice attempts (for test suite compatibility), factor into subject coverage
  const subjectsCovered = new Set()
  practiceAttempts.forEach(p => {
    if (p.question?.subject) subjectsCovered.add(p.question.subject)
  })
  relevantTests.forEach(t => {
    t.result?.subjectBreakdown?.forEach(sb => {
      if (sb.totalQuestions > 0) subjectsCovered.add(sb.subject)
    })
  })
  if (completedCurriculumCount > 0 && targetCompany) {
    const curriculum = getCurriculumForCompany(targetCompany, [activeRole])
    curriculum?.topics?.forEach(t => {
      if (completedTopics.includes(t.id) && t.pillar) {
        subjectsCovered.add(t.pillar)
      }
    })
  }

  const expectedSubjects = targetCompany?.frequentlyTestedSubjects || ['DSA', 'DBMS', 'OS', 'Aptitude', 'OOP']
  const coveredCount = expectedSubjects.filter(s => subjectsCovered.has(s)).length

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
    recommendedActions.push(`Study recommended topics in ${weakAreas[0].name} in the Preparation Hub to address this bottleneck.`)
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
    targetRole: activeRole,
    metrics: {
      testsCompleted: totalTests,
      averageTestScore,
      roadmapCompletion: roadmapCompletion,
      curriculumTopicsCompleted: completedCurriculumCount,
      totalCurriculumTopics,
      subjectsCoveredCount: coveredCount,
      totalExpectedSubjects: expectedSubjects.length
    },
    skillsBreakdown,
    strengths,
    weakAreas,
    recommendedActions,
    formulaExplanation: formulaExplanation || 'Preparation Score = (40% Curriculum Topics) + (40% Mock Test Average) + (20% Roadmap Milestones)'
  }
}
