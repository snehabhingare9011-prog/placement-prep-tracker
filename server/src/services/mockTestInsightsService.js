import { TestAttempt } from '../models/TestAttempt.js'
import { Test } from '../models/Test.js'
import { COMPANY_CURRICULUM } from './curriculumService.js'

// Deterministic keyword matching between test topics/subjects and verified Preparation Hub resources
const TOPIC_MAPPING_RULES = [
  { matchTerms: ['graph', 'bfs', 'dfs', 'shortest path', 'dijkstra', 'topological'], hubTopicId: 'dsa-graphs' },
  { matchTerms: ['tree', 'bst', 'binary tree', 'lca', 'traversal'], hubTopicId: 'dsa-trees-bst' },
  { matchTerms: ['dynamic programming', 'dp', 'knapsack', 'memoization'], hubTopicId: 'dsa-dynamic-programming' },
  { matchTerms: ['array', 'string', 'two-pointer', 'sliding window', 'hash', 'hashing', 'hashmap', 'lru'], hubTopicId: 'dsa-arrays-strings' },
  { matchTerms: ['linked list', 'linkedlist', 'pointer'], hubTopicId: 'dsa-linked-lists' },
  { matchTerms: ['dbms', 'transaction', 'acid', 'indexing', 'normalization'], hubTopicId: 'core-dbms-sql' },
  { matchTerms: ['sql', 'query', 'join', 'having', 'aggregate', 'salary'], hubTopicId: 'core-dbms-sql' },
  { matchTerms: ['operating system', 'os', 'process scheduling', 'deadlock', 'semaphore', 'mutex', 'cpu', 'paging'], hubTopicId: 'core-os' },
  { matchTerms: ['oop', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'solid'], hubTopicId: 'core-oop' },
  { matchTerms: ['computer network', 'network', 'osi', 'tcp', 'http', 'dns', 'ip'], hubTopicId: 'core-cn' },
  { matchTerms: ['quantitative', 'math', 'time and work', 'speed', 'percentage', 'train'], hubTopicId: 'apti-quantitative' },
  { matchTerms: ['logical', 'reasoning', 'puzzle', 'blood relation', 'coding-decoding', 'syllogism'], hubTopicId: 'apti-logical-reasoning' },
  { matchTerms: ['verbal', 'english', 'grammar', 'comprehension'], hubTopicId: 'apti-verbal-ability' },
  { matchTerms: ['javascript', 'react', 'frontend', 'async', 'hook'], hubTopicId: 'web-javascript-react' },
  { matchTerms: ['node', 'express', 'backend', 'api', 'rest'], hubTopicId: 'web-backend-apis' },
  { matchTerms: ['system design', 'scalability', 'cache', 'redis', 'load balancer', 'microservice'], hubTopicId: 'web-system-design' },
  { matchTerms: ['hr', 'behavioral', 'star', 'leadership', 'interview', 'culture'], hubTopicId: 'hr-star-framework' }
]

export function mapQuestionAreaToHubTopic(topicName, subjectName = '') {
  const normalizedTopic = (topicName || '').toLowerCase()
  const normalizedSubject = (subjectName || '').toLowerCase()
  const combined = `${normalizedTopic} ${normalizedSubject}`

  for (const rule of TOPIC_MAPPING_RULES) {
    for (const term of rule.matchTerms) {
      if (combined.includes(term)) {
        const found = COMPANY_CURRICULUM.topics.find(t => t.id === rule.hubTopicId)
        if (found) return found
      }
    }
  }

  return null
}

export async function generateMockTestInsights(userId, companyId = null, role = null) {
  // Available target assessments count
  const allTests = await Test.find({ isPublished: true }).lean().catch(() => [])
  let availableTests = allTests.filter(t => {
    if (!companyId) return true
    const cId = (t.company?._id || t.company)?.toString()
    if (cId !== companyId.toString()) return false
    if (!t.role || !role) return true
    return t.role.toLowerCase() === role.toLowerCase()
  })
  if (availableTests.length === 0 && companyId) {
    availableTests = allTests.filter(t => {
      const cId = (t.company?._id || t.company)?.toString()
      return cId === companyId.toString()
    })
  }
  const availableAssessments = availableTests.length

  // Query all completed attempts for the user
  const query = { user: userId, status: 'completed' }

  let attempts = await TestAttempt.find(query)
    .populate({
      path: 'test',
      populate: {
        path: 'questions'
      }
    })
    .populate('company', 'name code mark color')
    .sort({ submittedAt: -1 })
    .lean()

  // Filter company and role specific attempts strictly (no fallback across companies)
  let targetFilteredAttempts = attempts
  if (companyId) {
    targetFilteredAttempts = attempts.filter(a => {
      const aCompId = (a.company?._id || a.company || a.test?.company?._id || a.test?.company)?.toString()
      if (aCompId !== companyId.toString()) return false
      const aRole = a.role || a.test?.role
      if (aRole && role) {
        return aRole.toLowerCase() === role.toLowerCase()
      }
      return true
    })

    if (targetFilteredAttempts.length === 0) {
      targetFilteredAttempts = attempts.filter(a => {
        const aCompId = (a.company?._id || a.company || a.test?.company?._id || a.test?.company)?.toString()
        return aCompId === companyId.toString()
      })
    }
  }

  const analysisAttempts = targetFilteredAttempts
  const submittedAttempts = analysisAttempts.length
  const uniqueAssessmentsCompleted = new Set(
    analysisAttempts.map(a => (a.test?._id || a.test)?.toString()).filter(Boolean)
  ).size

  if (!analysisAttempts || analysisAttempts.length === 0) {
    return {
      hasEnoughData: false,
      isPreliminary: false,
      message: 'No completed mock tests yet for this target. Take an assessment to discover your strong areas and topics needing revision.',
      availableAssessments,
      submittedAttempts: 0,
      uniqueAssessmentsCompleted: 0,
      testsCompleted: 0,
      strongAreas: [],
      areasToImprove: [],
      recommendedTopics: [],
      performanceSummary: null
    }
  }

  const testsCompleted = submittedAttempts
  const isPreliminary = submittedAttempts === 1

  // Aggregation per subject and topic
  const subjectStats = {}
  const topicStats = {}
  let totalScoreSum = 0
  let totalMaxScoreSum = 0
  let totalCorrect = 0
  let totalIncorrect = 0
  let totalUnanswered = 0

  for (const attempt of analysisAttempts) {
    const test = attempt.test
    if (!test || !Array.isArray(test.questions)) continue

    totalScoreSum += (attempt.result?.score || 0)
    totalMaxScoreSum += (attempt.result?.maxScore || (test.questions.length * (test.marksPerQuestion || 4)))
    totalCorrect += (attempt.result?.correctCount || 0)
    totalIncorrect += (attempt.result?.incorrectCount || 0)
    totalUnanswered += (attempt.result?.unansweredCount || 0)

    const answerMap = new Map()
    if (Array.isArray(attempt.answers)) {
      attempt.answers.forEach(a => {
        const qId = (a.questionId?._id || a.questionId)?.toString()
        if (qId) answerMap.set(qId, a.selectedOption)
      })
    }

    test.questions.forEach(q => {
      const qId = q._id.toString()
      const subj = q.subject || 'General'
      const top = q.topic || 'General'

      if (!subjectStats[subj]) {
        subjectStats[subj] = { subject: subj, total: 0, correct: 0, incorrect: 0, unanswered: 0 }
      }
      if (!topicStats[top]) {
        topicStats[top] = { topic: top, subject: subj, total: 0, correct: 0, incorrect: 0, unanswered: 0 }
      }

      subjectStats[subj].total += 1
      topicStats[top].total += 1

      const studentAns = answerMap.get(qId)
      if (studentAns === null || studentAns === undefined || studentAns === '') {
        subjectStats[subj].unanswered += 1
        topicStats[top].unanswered += 1
      } else if (String(studentAns) === String(q.correctAnswer)) {
        subjectStats[subj].correct += 1
        topicStats[top].correct += 1
      } else {
        subjectStats[subj].incorrect += 1
        topicStats[top].incorrect += 1
      }
    })
  }

  // Calculate percentages
  const subjectList = Object.values(subjectStats).map(s => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }))

  const topicList = Object.values(topicStats).map(t => ({
    ...t,
    percentage: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0
  }))

  // Identify Strong Areas: Subjects/topics with >= 70% accuracy
  // Minimum questions requirement: 1 if preliminary, 2 if multiple attempts
  const minQThreshold = isPreliminary ? 1 : 2

  const strongSubjects = subjectList
    .filter(s => s.total >= minQThreshold && s.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage || b.total - a.total)

  const strongTopics = topicList
    .filter(t => t.total >= minQThreshold && t.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage || b.total - a.total)

  const strongAreas = []
  strongSubjects.forEach(s => {
    strongAreas.push({
      name: s.subject,
      category: 'Subject',
      accuracy: s.percentage,
      correct: s.correct,
      total: s.total
    })
  })
  strongTopics.slice(0, 3).forEach(t => {
    if (!strongAreas.some(sa => sa.name === t.topic)) {
      strongAreas.push({
        name: t.topic,
        category: 'Topic',
        accuracy: t.percentage,
        correct: t.correct,
        total: t.total
      })
    }
  })

  // Identify Areas to Improve: Subjects/topics with < 60% accuracy and at least 1 mistake
  const weakSubjects = subjectList
    .filter(s => s.total >= minQThreshold && s.percentage < 60 && (s.incorrect > 0 || s.unanswered > 0))
    .sort((a, b) => a.percentage - b.percentage || b.incorrect - a.incorrect)

  const weakTopics = topicList
    .filter(t => t.total >= minQThreshold && t.percentage < 60 && (t.incorrect > 0 || t.unanswered > 0))
    .sort((a, b) => a.percentage - b.percentage || b.incorrect - a.incorrect)

  const areasToImprove = []
  weakTopics.forEach(t => {
    areasToImprove.push({
      name: t.topic,
      subject: t.subject,
      category: 'Topic',
      accuracy: t.percentage,
      incorrect: t.incorrect,
      unanswered: t.unanswered,
      total: t.total
    })
  })
  weakSubjects.forEach(s => {
    if (!areasToImprove.some(w => w.name === s.subject)) {
      areasToImprove.push({
        name: s.subject,
        subject: s.subject,
        category: 'Subject',
        accuracy: s.percentage,
        incorrect: s.incorrect,
        unanswered: s.unanswered,
        total: s.total
      })
    }
  })

  // Connect weaknesses to verified Preparation Hub resources
  const recommendedTopics = []
  const seenHubIds = new Set()

  for (const weak of areasToImprove) {
    if (recommendedTopics.length >= 2) break
    const hubMatch = mapQuestionAreaToHubTopic(weak.name, weak.subject)
    if (hubMatch && !seenHubIds.has(hubMatch.id)) {
      seenHubIds.add(hubMatch.id)
      recommendedTopics.push({
        topicId: hubMatch.id,
        title: hubMatch.title,
        pillar: hubMatch.pillar,
        estimatedHours: hubMatch.estimatedHours,
        description: hubMatch.description,
        evidence: `Score: ${weak.accuracy}% in ${weak.name} (${weak.incorrect} incorrect out of ${weak.total} questions).`,
        hasResource: true
      })
    } else if (!hubMatch) {
      recommendedTopics.push({
        topicName: weak.name,
        subject: weak.subject,
        evidence: `Score: ${weak.accuracy}% in ${weak.name}.`,
        hasResource: false,
        note: 'Resource not available yet'
      })
    }
  }

  // Fallback: If no weaknesses found because student did 100% or very well
  if (recommendedTopics.length === 0 && strongAreas.length > 0) {
    // Recommend next level topic or review
    const nextTopic = COMPANY_CURRICULUM.topics.find(t => !seenHubIds.has(t.id))
    if (nextTopic) {
      recommendedTopics.push({
        topicId: nextTopic.id,
        title: nextTopic.title,
        pillar: nextTopic.pillar,
        estimatedHours: nextTopic.estimatedHours,
        description: nextTopic.description,
        evidence: 'Consistent performance on test! Progress to advanced curriculum milestones.',
        hasResource: true
      })
    }
  }

  const latestAttempt = analysisAttempts[0]
  const avgPct = totalMaxScoreSum > 0 ? Math.round((totalScoreSum / totalMaxScoreSum) * 100) : (latestAttempt.result?.percentage || 0)

  return {
    hasEnoughData: true,
    isPreliminary,
    confidenceLabel: isPreliminary
      ? 'Preliminary Insights (Based on 1 assessment attempt)'
      : `Insights based on ${submittedAttempts} completed attempt${submittedAttempts === 1 ? '' : 's'} (${uniqueAssessmentsCompleted} of ${availableAssessments} unique assessment${availableAssessments === 1 ? '' : 's'})`,
    availableAssessments,
    submittedAttempts,
    uniqueAssessmentsCompleted,
    testsCompleted: submittedAttempts,
    latestAttempt: {
      testTitle: latestAttempt.test?.title || 'Mock Assessment',
      score: latestAttempt.result?.score ?? 0,
      maxScore: latestAttempt.result?.maxScore ?? 24,
      percentage: latestAttempt.result?.percentage ?? 0,
      submittedAt: latestAttempt.submittedAt,
      correctCount: latestAttempt.result?.correctCount ?? 0,
      incorrectCount: latestAttempt.result?.incorrectCount ?? 0,
      unansweredCount: latestAttempt.result?.unansweredCount ?? 0
    },
    performanceSummary: {
      averagePercentage: avgPct,
      totalQuestions: totalCorrect + totalIncorrect + totalUnanswered,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      subjectBreakdown: subjectList
    },
    strongAreas: strongAreas.slice(0, 4),
    areasToImprove: areasToImprove.slice(0, 4),
    recommendedTopics: recommendedTopics.slice(0, 2)
  }
}
