import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Test } from '../models/Test.js'
import { Roadmap } from '../models/Roadmap.js'
import { Company } from '../models/Company.js'
import { User } from '../models/User.js'
import { Question } from '../models/Question.js'
import { getCurriculumForCompany } from './curriculumService.js'
import { mapQuestionAreaToHubTopic } from './mockTestInsightsService.js'

export async function calculateReadiness(userId, companyId = null, roleTitle = null) {
  const user = await User.findById(userId).lean()
  const activeCompanyId = companyId || user?.targetCompany
  const activeRole = roleTitle || user?.currentTargetRole || 'Software Engineer'

  // Fetch student practice attempts (for legacy compatibility in test suites)
  const practiceAttempts = await PracticeAttempt.find({ user: userId }).populate('question').lean().catch(() => [])

  // Fetch student completed mock test attempts with populated questions
  const testAttempts = await TestAttempt.find({ user: userId, status: 'completed' })
    .populate({
      path: 'test',
      populate: { path: 'questions' }
    })
    .populate('company', 'name code mark color')
    .sort({ submittedAt: -1 })
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

  // Ensure tasks completed in roadmap are unified with completedTopics
  const completedTopicSet = new Set(completedTopics)
  let allRoadmapTasks = []
  if (roadmap?.phases?.length > 0) {
    roadmap.phases.forEach(p => {
      (p.tasks || []).forEach(t => {
        if (t.completed && t.taskId) completedTopicSet.add(t.taskId)
        if (t.completed && t.topicId) completedTopicSet.add(t.topicId)
        const isDone = !!t.completed || completedTopicSet.has(t.taskId) || (t.topicId && completedTopicSet.has(t.topicId))
        allRoadmapTasks.push({
          taskId: t.taskId,
          topicId: t.topicId,
          title: t.title,
          completed: isDone,
          phaseName: p.title || p.name || 'Preparation Phase',
          subject: t.subject
        })
      })
    })
  }
  const unifiedCompletedList = Array.from(completedTopicSet)

  // Curriculum topics for target company
  const curriculum = targetCompany ? getCurriculumForCompany(targetCompany, [activeRole]) : null
  const totalCurriculumTopics = curriculum?.totalTopics || 0
  const completedCurriculumCount = curriculum?.topics?.filter(t => unifiedCompletedList.includes(t.id)).length || 0

  // =========================================================================
  // SECTION A: My Preparation Progress (Roadmap & Curriculum Milestones)
  // =========================================================================
  // Deduplicate roadmap tasks by topic identity to prevent duplicate counting
  const uniqueTasksMap = new Map()
  allRoadmapTasks.forEach(t => {
    const key = t.topicId || t.taskId || t.title
    if (!uniqueTasksMap.has(key) || t.completed) {
      uniqueTasksMap.set(key, t)
    }
  })
  const uniqueTaskList = Array.from(uniqueTasksMap.values())

  let prepTotal = 0
  let prepCompleted = 0
  let nextIncomplete = null

  if (uniqueTaskList.length > 0) {
    prepTotal = uniqueTaskList.length
    prepCompleted = uniqueTaskList.filter(t => t.completed).length
    nextIncomplete = uniqueTaskList.find(t => !t.completed)
  } else if (curriculum && curriculum.topics?.length > 0) {
    prepTotal = curriculum.totalTopics
    prepCompleted = completedCurriculumCount
    nextIncomplete = curriculum.topics.find(t => !unifiedCompletedList.includes(t.id))
  }

  const preparationProgress = prepTotal > 0 ? Math.round((prepCompleted / prepTotal) * 100) : 0

  let nextIncompleteTopic = null
  if (nextIncomplete) {
    const mappedHub = mapQuestionAreaToHubTopic(nextIncomplete.title, nextIncomplete.subject || '')
    nextIncompleteTopic = {
      taskId: nextIncomplete.taskId || nextIncomplete.id,
      title: nextIncomplete.title,
      phaseName: nextIncomplete.phaseName || 'Preparation Phase',
      hubTopicId: mappedHub ? mappedHub.id : (nextIncomplete.topicId || nextIncomplete.taskId || nextIncomplete.id),
      hubTopicTitle: mappedHub ? mappedHub.title : nextIncomplete.title,
      estimatedHours: mappedHub?.estimatedHours || '3 hrs'
    }
  }

  // Calculate phase progression breakdown
  const phasesProgress = (roadmap?.phases || []).map((p, idx) => {
    const tasks = p.tasks || []
    const done = tasks.filter(t => t.completed || completedTopicSet.has(t.taskId) || (t.topicId && completedTopicSet.has(t.topicId))).length
    const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
    const isCompleted = done === tasks.length && tasks.length > 0
    const isActive = !isCompleted && (idx === 0 || (roadmap.phases[idx - 1]?.tasks || []).every(t => t.completed || completedTopicSet.has(t.taskId) || (t.topicId && completedTopicSet.has(t.topicId))))
    return {
      phaseNumber: idx + 1,
      name: p.title || p.name || `Phase ${idx + 1}`,
      total: tasks.length,
      completed: done,
      percentage: pct,
      status: isCompleted ? 'Completed' : (isActive ? 'Active' : 'Upcoming')
    }
  })

  // =========================================================================
  // SECTION B: My Mock-Test Performance (Real submitted test attempts)
  // Strictly isolated by authenticated student, target company, and target role
  // =========================================================================
  // 1. Fetch available published assessments matching target company and role
  const allTargetTests = await Test.find({ isPublished: true }).lean().catch(() => [])
  const matchingAvailableTests = allTargetTests.filter(test => {
    if (!activeCompanyId) return true
    const testCompId = (test.company?._id || test.company)?.toString()
    if (testCompId !== activeCompanyId.toString()) return false
    if (!test.role || !activeRole) return true
    return test.role.toLowerCase() === activeRole.toLowerCase()
  })
  const availableAssessments = matchingAvailableTests.length

  // 2. Filter user's completed test attempts strictly for active target company and role
  let relevantTests = []
  if (activeCompanyId) {
    relevantTests = testAttempts.filter(t => {
      const tCompId = (t.company?._id || t.company || t.test?.company?._id || t.test?.company)?.toString()
      if (tCompId !== activeCompanyId.toString()) return false

      const tRole = t.role || t.test?.role
      if (tRole && activeRole) {
        return tRole.toLowerCase() === activeRole.toLowerCase()
      }
      return true
    })
  } else {
    relevantTests = testAttempts
  }

  const completedAttempts = relevantTests.filter(t => t.status === 'completed')
  const submittedAttempts = completedAttempts.length

  // Distinct completed assessment IDs
  const uniqueCompletedAssessmentIds = new Set(
    completedAttempts
      .map(t => (t.test?._id || t.test)?.toString())
      .filter(Boolean)
  )
  const uniqueAssessmentsCompleted = uniqueCompletedAssessmentIds.size
  const testScores = completedAttempts.map(t => t.result?.percentage ?? 0)
  const averageTestScore = testScores.length > 0
    ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length)
    : null

  const recentTestHistory = completedAttempts.slice(0, 5).map(t => {
    const qLen = t.test?.questions?.length || 5
    const marksPerQ = t.test?.marksPerQuestion || 4
    const computedMax = t.result?.maxScore || (qLen * marksPerQ)
    return {
      attemptId: t._id,
      testTitle: t.test?.title || 'Mock Assessment',
      companyName: t.company?.name || targetCompany?.name || 'Target Assessment',
      score: t.result?.score ?? 0,
      maxScore: computedMax,
      percentage: t.result?.percentage ?? 0,
      correctCount: t.result?.correctCount ?? 0,
      incorrectCount: t.result?.incorrectCount ?? 0,
      unansweredCount: t.result?.unansweredCount ?? 0,
      submittedAt: t.submittedAt || t.updatedAt
    }
  })

  // Data sufficiency check
  const hasEnoughData = completedAttempts.length >= 1 || prepCompleted >= 2 || preparationProgress >= 10 || practiceAttempts.length >= 2

  // Standard subjects list
  const defaultSubjects = ['DSA', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks', 'Aptitude', 'OOP']
  const companySubjects = targetCompany?.frequentlyTestedSubjects?.length > 0
    ? targetCompany.frequentlyTestedSubjects
    : defaultSubjects

  if (!hasEnoughData) {
    const emptySubjectAnalysis = companySubjects.map(name => {
      const mappedHub = mapQuestionAreaToHubTopic('', name)
      return {
        name,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        accuracy: null,
        status: 'Not Attempted',
        hubTopicId: mappedHub ? mappedHub.id : null,
        hubTopicTitle: mappedHub ? mappedHub.title : null,
        testedTopics: []
      }
    })

    const baselineActions = [
      {
        priority: 1,
        badge: 'Priority 1 · Roadmap Milestone',
        type: 'roadmap',
        title: nextIncompleteTopic ? `Complete: ${nextIncompleteTopic.title}` : 'Start Roadmap Topics',
        description: 'Complete your first structured syllabus milestones to establish baseline preparation.',
        actionText: 'Study in Hub',
        actionLink: nextIncompleteTopic?.hubTopicId
          ? `/company-prep?company=${activeCompanyId}&topic=${nextIncompleteTopic.hubTopicId}`
          : `/roadmap`
      },
      {
        priority: 2,
        badge: 'Priority 2 · Diagnostic Test',
        type: 'mock-test',
        title: `Take ${targetCompany ? targetCompany.name : 'Target'} Diagnostic Assessment`,
        description: 'Benchmark exam speed, question accuracy, and negative marking under timed exam conditions.',
        actionText: 'Take Mock Test',
        actionLink: '/mock-tests'
      },
      {
        priority: 3,
        badge: 'Priority 3 · Preparation Hub',
        type: 'hub',
        title: 'Explore Target Syllabus in Hub',
        description: 'Review interview questions, company problem notes, and sample code snippets.',
        actionText: 'Open Hub',
        actionLink: activeCompanyId ? `/company-prep?company=${activeCompanyId}` : '/company-prep'
      }
    ]

    return {
      hasEnoughData: false,
      overallScore: null,
      statusLabel: 'Not enough activity yet',
      message: 'Complete some learning topics and take a mock test to establish your verified readiness score.',
      targetCompany: targetCompany ? targetCompany.name : 'Target Company',
      targetCompanyId: activeCompanyId,
      targetRole: activeRole,
      preparation: {
        completedTopics: prepCompleted,
        totalTopics: prepTotal,
        percentage: preparationProgress,
        nextIncompleteTopic,
        phasesProgress: []
      },
      mockPerformance: {
        availableAssessments,
        submittedAttempts,
        uniqueAssessmentsCompleted,
        testsCompleted: submittedAttempts,
        averageScorePercentage: null,
        totalAttemptedQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalUnanswered: 0,
        negativeMarksLost: 0,
        examAccuracyPercentage: null,
        recentTestHistory: []
      },
      subjectAnalysis: emptySubjectAnalysis,
      nextActions: baselineActions,
      metrics: {
        availableAssessments,
        submittedAttempts,
        uniqueAssessmentsCompleted,
        testsCompleted: submittedAttempts,
        averageTestScore: null,
        preparationProgress,
        roadmapCompletion: preparationProgress,
        curriculumTopicsCompleted: prepCompleted,
        totalCurriculumTopics: prepTotal
      },
      skillsBreakdown: emptySubjectAnalysis.map(s => ({
        name: s.name,
        score: null,
        status: 'untested',
        attempted: 0
      })),
      roundReadiness: [],
      strengths: [],
      weakAreas: [],
      recommendedActions: baselineActions.map(a => a.description),
      formulaExplanation: 'Readiness Score = (50% Syllabus Topics Completed) + (50% Mock-Test Performance)'
    }
  }

  // =========================================================================
  // SECTION C: Strong Areas & Topics to Focus On (Strictly Attempted Questions)
  // =========================================================================
  let totalAttemptedQuestions = 0
  let totalCorrect = 0
  let totalIncorrect = 0
  let totalUnanswered = 0
  let totalNegativeMarksLost = 0

  const subjectMap = new Map()
  companySubjects.forEach(s => {
    subjectMap.set(s, { attempted: 0, correct: 0, incorrect: 0, testedTopics: new Map() })
  })

  const topicStatsMap = new Map()

  // Aggregate questions from actual completed mock tests
  completedAttempts.forEach(attempt => {
    const testQuestions = attempt.test?.questions || []
    const qMap = new Map()
    testQuestions.forEach(q => {
      if (q && q._id) qMap.set(q._id.toString(), q)
    })

    const negMark = attempt.test?.negativeMarking || 1

    if (Array.isArray(attempt.answers)) {
      attempt.answers.forEach(ans => {
        // Only count if an option was actually selected
        const isAttempted = ans.selectedOption !== null && ans.selectedOption !== undefined && ans.selectedOption !== ''
        if (!isAttempted) {
          totalUnanswered += 1
          return
        }

        const qId = (ans.questionId?._id || ans.questionId)?.toString()
        const question = qMap.get(qId)
        if (!question) return

        totalAttemptedQuestions += 1

        const subj = question.subject || 'General'
        const top = question.topic || question.subject || 'General'

        if (!subjectMap.has(subj)) {
          subjectMap.set(subj, { attempted: 0, correct: 0, incorrect: 0, testedTopics: new Map() })
        }
        const subjStats = subjectMap.get(subj)
        subjStats.attempted += 1

        if (!topicStatsMap.has(top)) {
          topicStatsMap.set(top, {
            topic: top,
            subject: subj,
            attempted: 0,
            correct: 0,
            incorrect: 0
          })
        }
        const topStats = topicStatsMap.get(top)
        topStats.attempted += 1

        const isCorrect = String(ans.selectedOption) === String(question.correctAnswer)
        if (isCorrect) {
          totalCorrect += 1
          subjStats.correct += 1
          topStats.correct += 1
        } else {
          totalIncorrect += 1
          totalNegativeMarksLost += negMark
          subjStats.incorrect += 1
          topStats.incorrect += 1
        }

        if (!subjStats.testedTopics.has(top)) {
          subjStats.testedTopics.set(top, { topic: top, attempted: 0, correct: 0, incorrect: 0 })
        }
        const subTop = subjStats.testedTopics.get(top)
        subTop.attempted += 1
        if (isCorrect) subTop.correct += 1
        else subTop.incorrect += 1
      })
    }
  })

  // Legacy practice attempts (for test suite backward compatibility)
  practiceAttempts.forEach(p => {
    const subj = p.question?.subject
    if (subj) {
      if (!subjectMap.has(subj)) subjectMap.set(subj, { attempted: 0, correct: 0, incorrect: 0, testedTopics: new Map() })
      const stats = subjectMap.get(subj)
      stats.attempted += 1
      totalAttemptedQuestions += 1
      if (p.isCorrect || p.status === 'solved') {
        stats.correct += 1
        totalCorrect += 1
      } else {
        stats.incorrect += 1
        totalIncorrect += 1
      }
    }
  })

  const examAccuracyPercentage = totalAttemptedQuestions > 0
    ? Math.round((totalCorrect / totalAttemptedQuestions) * 100)
    : null

  // Classify each subject into 4 evidence-backed statuses:
  // 1. Strong: >= 3 attempted, >= 70%
  // 2. Needs Focus: >= 2 attempted, < 60%
  // 3. Not Enough Data: some attempts, but < 3 questions / between thresholds
  // 4. Not Attempted: 0 questions attempted
  const subjectAnalysis = Array.from(subjectMap.entries()).map(([name, data]) => {
    const mappedHub = mapQuestionAreaToHubTopic('', name)
    const testedTopicsList = Array.from(data.testedTopics?.values() || []).map(tt => ({
      topic: tt.topic,
      attempted: tt.attempted,
      correct: tt.correct,
      incorrect: tt.incorrect,
      accuracy: tt.attempted > 0 ? Math.round((tt.correct / tt.attempted) * 100) : 0
    }))

    if (data.attempted === 0) {
      return {
        name,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        accuracy: null,
        status: 'Not Attempted',
        hubTopicId: mappedHub ? mappedHub.id : null,
        hubTopicTitle: mappedHub ? mappedHub.title : null,
        testedTopics: []
      }
    }

    const accuracy = Math.round((data.correct / data.attempted) * 100)
    let status = 'Not Enough Data'
    if (data.attempted >= 3 && accuracy >= 70) {
      status = 'Strong'
    } else if (data.attempted >= 2 && accuracy < 60) {
      status = 'Needs Focus'
    } else {
      status = 'Not Enough Data'
    }

    return {
      name,
      attempted: data.attempted,
      correct: data.correct,
      incorrect: data.incorrect,
      accuracy,
      status,
      hubTopicId: mappedHub ? mappedHub.id : null,
      hubTopicTitle: mappedHub ? mappedHub.title : null,
      testedTopics: testedTopicsList
    }
  })

  // Comprehensive Strong Areas (Subjects & Specific Topics)
  const strongAreas = []

  // Subject-level strong areas
  subjectAnalysis
    .filter(s => s.status === 'Strong')
    .forEach(s => {
      strongAreas.push({
        name: s.name,
        category: 'Subject',
        subject: s.name,
        accuracy: s.accuracy,
        correct: s.correct,
        total: s.attempted,
        note: `${s.correct} of ${s.attempted} questions answered correctly (${s.accuracy}% accuracy)`,
        badgeText: s.attempted >= 3 ? 'High Mastery' : 'Verified Strength',
        hubTopicId: s.hubTopicId,
        hubTopicTitle: s.hubTopicTitle
      })
    })

  // Granular Topic-level strong areas (require at least 2 questions attempted)
  Array.from(topicStatsMap.values()).forEach(t => {
    const acc = t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0
    if (t.attempted >= 2 && acc >= 70) {
      if (!strongAreas.some(sa => sa.name === t.topic)) {
        const hubMatch = mapQuestionAreaToHubTopic(t.topic, t.subject)
        strongAreas.push({
          name: t.topic,
          category: 'Topic',
          subject: t.subject,
          accuracy: acc,
          correct: t.correct,
          total: t.attempted,
          note: `${t.correct} of ${t.attempted} correct in ${t.subject} (${acc}%)`,
          badgeText: t.attempted >= 3 ? 'High Mastery' : 'Proficient',
          hubTopicId: hubMatch ? hubMatch.id : null,
          hubTopicTitle: hubMatch ? hubMatch.title : null
        })
      }
    }
  })

  // Comprehensive Weak & Focus Areas (Subjects & Specific Topics with penalties)
  const weakAreas = []

  // Granular Topic-level weak areas
  Array.from(topicStatsMap.values()).forEach(t => {
    const acc = t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0
    if (t.attempted >= 1 && (acc < 60 || t.incorrect > 0)) {
      const hubMatch = mapQuestionAreaToHubTopic(t.topic, t.subject)
      weakAreas.push({
        name: t.topic,
        category: 'Topic',
        subject: t.subject,
        accuracy: acc,
        incorrect: t.incorrect,
        attempted: t.attempted,
        marksLost: t.incorrect * 1,
        note: `${t.incorrect} wrong answer${t.incorrect === 1 ? '' : 's'} out of ${t.attempted} attempted (-${t.incorrect} marks penalty)`,
        priority: acc < 40 ? 'High Priority' : 'Medium Priority',
        hubTopicId: hubMatch ? hubMatch.id : null,
        hubTopicTitle: hubMatch ? hubMatch.title : null,
        estimatedHours: hubMatch?.estimatedHours || '2 hrs',
        description: hubMatch?.description || `Revise core concepts of ${t.topic} to eliminate negative marking penalty.`
      })
    }
  })

  // Subject-level weak areas
  subjectAnalysis
    .filter(s => s.status === 'Needs Focus')
    .forEach(s => {
      if (!weakAreas.some(w => w.name === s.name)) {
        weakAreas.push({
          name: s.name,
          category: 'Subject',
          subject: s.name,
          accuracy: s.accuracy,
          incorrect: s.incorrect,
          attempted: s.attempted,
          marksLost: s.incorrect * 1,
          note: `Accuracy is ${s.accuracy}% across ${s.attempted} questions (-${s.incorrect} marks penalty)`,
          priority: (s.accuracy || 0) < 40 ? 'High Priority' : 'Medium Priority',
          hubTopicId: s.hubTopicId,
          hubTopicTitle: s.hubTopicTitle,
          estimatedHours: '3 hrs',
          description: `Revise topics in ${s.name} in the Preparation Hub to raise your exam score.`
        })
      }
    })

  // Skills breakdown for test suite backward compatibility
  const skillsBreakdown = subjectAnalysis.map(s => ({
    name: s.name,
    score: s.accuracy,
    status: s.attempted === 0 ? 'untested' : (s.status === 'Strong' ? 'strong' : (s.status === 'Needs Focus' ? 'needs work' : 'on track')),
    attempted: s.attempted
  }))

  // =========================================================================
  // SECTION D: What Should I Do Next? (Max 3 Prioritized Actions)
  // =========================================================================
  const nextActions = []

  // Action 1: Continue Preparation: Next incomplete topic in active roadmap stage
  if (nextIncompleteTopic) {
    nextActions.push({
      priority: 1,
      badge: 'Priority 1 · Roadmap Milestone',
      type: 'roadmap',
      title: `Complete: ${nextIncompleteTopic.title}`,
      description: `Next incomplete topic in ${nextIncompleteTopic.phaseName}. Study the notes and check it off once completed.`,
      actionText: 'Study Topic',
      actionLink: nextIncompleteTopic.hubTopicId && activeCompanyId
        ? `/company-prep?company=${activeCompanyId}&topic=${nextIncompleteTopic.hubTopicId}`
        : `/roadmap`,
      estimatedHours: nextIncompleteTopic.estimatedHours || '3 hrs'
    })
  }

  // Action 2: Improve a Weak Area: Evidenced weak subject or topic
  const topWeakArea = weakAreas.length > 0 ? weakAreas[0] : null
  if (topWeakArea) {
    nextActions.push({
      priority: 2,
      badge: 'Priority 2 · Revision Focus',
      type: 'revision',
      title: `Revise: ${topWeakArea.name}`,
      description: `Your exam accuracy is ${topWeakArea.accuracy}% across ${topWeakArea.attempted} attempted questions. Revising this area will prevent losing ${topWeakArea.marksLost || 1} marks to negative marking.`,
      actionText: 'Study in Hub',
      actionLink: topWeakArea.hubTopicId && activeCompanyId
        ? `/company-prep?company=${activeCompanyId}&topic=${topWeakArea.hubTopicId}`
        : `/company-prep?company=${activeCompanyId}`,
      estimatedHours: topWeakArea.estimatedHours || '2 hrs'
    })
  } else {
    const unattempted = subjectAnalysis.find(s => s.attempted === 0)
    if (unattempted) {
      nextActions.push({
        priority: 2,
        badge: 'Priority 2 · Explore Topic',
        type: 'explore',
        title: `Explore ${unattempted.name}`,
        description: `You have not attempted any questions in ${unattempted.name} yet. Review foundational notes before testing.`,
        actionText: 'Browse Topic',
        actionLink: unattempted.hubTopicId && activeCompanyId
          ? `/company-prep?company=${activeCompanyId}&topic=${unattempted.hubTopicId}`
          : `/company-prep?company=${activeCompanyId}`,
        estimatedHours: '2 hrs'
      })
    }
  }

  // Action 3: Take a Mock Test: Timed mock test benchmark
  nextActions.push({
    priority: 3,
    badge: 'Priority 3 · Benchmark Assessment',
    type: 'mock-test',
    title: completedAttempts.length === 0
      ? `Take ${targetCompany ? targetCompany.name : 'Target'} Diagnostic Mock Test`
      : `Attempt ${targetCompany ? targetCompany.name : 'Target'} Mock Assessment`,
    description: completedAttempts.length === 0
      ? 'Benchmark exam speed, question accuracy, and negative marking under timed exam conditions.'
      : 'Reinforce time management, build testing endurance, and track score improvement across attempts.',
    actionText: 'Take Mock Test',
    actionLink: '/mock-tests',
    estimatedHours: '30 mins'
  })

  const prioritizedNextActions = nextActions.slice(0, 3)

  // Combined score for backward compatibility
  let overallScore = 0
  let statusLabel = 'On track'
  let formulaExplanation = ''

  if (averageTestScore !== null) {
    overallScore = Math.round((preparationProgress * 0.50) + (averageTestScore * 0.50))
    formulaExplanation = 'Readiness Score = (50% Syllabus Topics Completed) + (50% Mock-Test Performance)'
    if (overallScore >= 80) statusLabel = 'Strong preparation'
    else if (overallScore >= 60) statusLabel = 'Good foundation'
    else statusLabel = 'Needs reinforcement'
  } else {
    overallScore = preparationProgress
    formulaExplanation = 'Syllabus Preparation Score = 100% Topic Checklists · Mock-Test Assessment Pending'
    statusLabel = 'Mock Assessment Pending'
  }

  // Round-by-round readiness based on real company rounds & roadmap
  let roundReadiness = []
  if (targetCompany?.recruitmentRounds?.length > 0) {
    roundReadiness = targetCompany.recruitmentRounds.map((rnd, idx) => {
      const isAssessment = rnd.roundType === 'Online Assessment' || 
        /assessment|aptitude|test|screening|cognitive/i.test(rnd.name)

      if (isAssessment) {
        return {
          roundNumber: rnd.roundNumber || idx + 1,
          name: rnd.name,
          roundType: rnd.roundType,
          status: completedAttempts.length > 0 ? 'Completed' : 'Pending',
          score: averageTestScore,
          detail: completedAttempts.length > 0
            ? `${submittedAttempts} attempt${submittedAttempts === 1 ? '' : 's'} across ${uniqueAssessmentsCompleted} of ${availableAssessments} unique assessment${availableAssessments === 1 ? '' : 's'} (${averageTestScore}% average)`
            : 'No mock test submitted yet'
        }
      } else {
        const phase = roadmap?.phases?.[idx]
        const phaseTasks = phase?.tasks || []
        const phaseDone = phaseTasks.filter(t => t.completed).length
        const pct = phaseTasks.length > 0 ? Math.round((phaseDone / phaseTasks.length) * 100) : 0
        return {
          roundNumber: rnd.roundNumber || idx + 1,
          name: rnd.name,
          roundType: rnd.roundType,
          status: phaseDone === phaseTasks.length && phaseTasks.length > 0 ? 'Completed' : (phaseDone > 0 ? 'In Progress' : 'Pending'),
          score: pct,
          detail: phaseTasks.length > 0 ? `${phaseDone} of ${phaseTasks.length} topics completed (${pct}%)` : 'Topic mapping pending'
        }
      }
    })
  }

  return {
    hasEnoughData: true,
    overallScore,
    statusLabel,
    hasMockTestData: averageTestScore !== null,
    targetCompany: targetCompany ? targetCompany.name : 'Target Company',
    targetCompanyId: activeCompanyId,
    targetRole: activeRole,
    preparation: {
      completedTopics: prepCompleted,
      totalTopics: prepTotal,
      percentage: preparationProgress,
      nextIncompleteTopic,
      phasesProgress
    },
    mockPerformance: {
      availableAssessments,
      submittedAttempts,
      uniqueAssessmentsCompleted,
      testsCompleted: submittedAttempts,
      averageScorePercentage: averageTestScore,
      totalAttemptedQuestions,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      negativeMarksLost: totalNegativeMarksLost,
      examAccuracyPercentage,
      recentTestHistory
    },
    subjectAnalysis,
    nextActions: prioritizedNextActions,
    metrics: {
      availableAssessments,
      submittedAttempts,
      uniqueAssessmentsCompleted,
      testsCompleted: submittedAttempts,
      averageTestScore,
      preparationProgress,
      roadmapCompletion: preparationProgress,
      curriculumTopicsCompleted: prepCompleted,
      totalCurriculumTopics: prepTotal
    },
    skillsBreakdown,
    roundReadiness,
    strengths: strongAreas,
    weakAreas,
    recommendedActions: prioritizedNextActions.map(a => a.description),
    formulaExplanation
  }
}
