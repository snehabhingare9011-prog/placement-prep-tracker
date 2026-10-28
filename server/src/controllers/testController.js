import { Test } from '../models/Test.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { evaluateTestAttempt } from '../services/testEvaluationService.js'
import { generateMockTestInsights } from '../services/mockTestInsightsService.js'
import { syncRealNotificationsForUser } from '../services/notificationService.js'

// @desc Get mock tests list
// @route GET /api/v1/tests
// @access Public / Private
export async function getTests(req, res, next) {
  try {
    const { category, difficulty, companyId, role } = req.query
    const filter = { isPublished: true }

    if (category && category !== 'All') filter.category = category
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty
    if (companyId) filter.company = companyId
    if (role && role !== 'All') filter.role = role

    const tests = await Test.find(filter)
      .populate('company', 'name code mark color')
      .sort({ createdAt: -1 })
      .lean()

    let enriched = tests.map(t => ({
      ...t,
      questionCount: t.questions?.length || 0,
      totalMarks: t.totalMarks || (t.questions?.length || 0) * (t.marksPerQuestion || 4)
    }))

    if (req.user) {
      const testIds = tests.map(t => t._id)
      const attempts = await TestAttempt.find({
        user: req.user._id,
        test: { $in: testIds },
        status: 'completed'
      }).lean()

      const attemptMap = new Map()
      attempts.forEach(a => {
        const key = a.test.toString()
        const existing = attemptMap.get(key)
        if (!existing || (a.result?.percentage || 0) > (existing.result?.percentage || 0)) {
          attemptMap.set(key, a)
        }
      })

      enriched = enriched.map(t => {
        const best = attemptMap.get(t._id.toString())
        return {
          ...t,
          bestAttempt: best ? { score: best.result?.score, percentage: best.result?.percentage, date: best.submittedAt } : null
        }
      })
    }

    res.json({ success: true, count: enriched.length, tests: enriched })
  } catch (error) {
    next(error)
  }
}

// @desc Get test instructions and details
// @route GET /api/v1/tests/:id
// @access Public / Private
export async function getTestById(req, res, next) {
  try {
    const test = await Test.findById(req.params.id)
      .populate('company', 'name code mark color')
      .populate({
        path: 'questions',
        select: '-correctAnswer -explanation' // Never leak answer key
      })

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' })
    }

    let activeAttempt = null
    if (req.user) {
      activeAttempt = await TestAttempt.findOne({
        user: req.user._id,
        test: test._id,
        status: 'in_progress',
        expiryTime: { $gt: new Date() }
      }).lean()
    }

    res.json({
      success: true,
      test: {
        ...test.toObject(),
        questionCount: test.questions.length,
        totalMarks: test.totalMarks || test.questions.length * test.marksPerQuestion
      },
      activeAttemptId: activeAttempt?._id || null
    })
  } catch (error) {
    next(error)
  }
}

// @desc Start or resume a test attempt (creates server-side timer)
// @route POST /api/v1/tests/:id/start
// @access Private
export async function startTest(req, res, next) {
  try {
    const test = await Test.findById(req.params.id).populate({
      path: 'questions',
      select: '-correctAnswer -explanation' // Answers stripped!
    })

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' })
    }

    // Check if user already has an active, unexpired attempt
    let attempt = await TestAttempt.findOne({
      user: req.user._id,
      test: test._id,
      status: 'in_progress',
      expiryTime: { $gt: new Date() }
    })

    if (!attempt) {
      const startTime = new Date()
      const expiryTime = new Date(startTime.getTime() + test.durationMinutes * 60 * 1000)

      const initialAnswers = test.questions.map(q => ({
        questionId: q._id,
        selectedOption: null,
        markedForReview: false
      }))

      attempt = await TestAttempt.create({
        user: req.user._id,
        test: test._id,
        company: test.company || req.user?.targetCompany,
        role: test.role || req.user?.currentTargetRole,
        startTime,
        durationMinutes: test.durationMinutes,
        expiryTime,
        status: 'in_progress',
        answers: initialAnswers
      })
    }

    const timeRemainingSeconds = Math.max(
      0,
      Math.round((new Date(attempt.expiryTime).getTime() - Date.now()) / 1000)
    )

    res.json({
      success: true,
      message: 'Test session active.',
      attemptId: attempt._id,
      startTime: attempt.startTime,
      expiryTime: attempt.expiryTime,
      durationMinutes: attempt.durationMinutes,
      timeRemainingSeconds,
      test: {
        _id: test._id,
        title: test.title,
        durationMinutes: test.durationMinutes,
        marksPerQuestion: test.marksPerQuestion,
        negativeMarking: test.negativeMarking,
        questions: test.questions
      },
      answers: attempt.answers
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get current attempt status with remaining time
// @route GET /api/v1/test-attempts/:id
// @access Private
export async function getTestAttempt(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id).populate({
      path: 'test',
      populate: {
        path: 'questions',
        select: '-correctAnswer -explanation'
      }
    })

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Test attempt not found.' })
    }

    // Ownership check
    if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden access to this test attempt.' })
    }

    const now = Date.now()
    const expiryTimeMs = new Date(attempt.expiryTime).getTime()

    // Auto-expire if timer exceeded and still in_progress
    if (attempt.status === 'in_progress' && now >= expiryTimeMs) {
      const evaluation = await evaluateTestAttempt(attempt, attempt.test)
      attempt.status = 'completed'
      attempt.submittedAt = new Date(expiryTimeMs)
      attempt.result = evaluation
      await attempt.save()

      return res.json({
        success: true,
        isExpired: true,
        status: 'completed',
        attempt
      })
    }

    const timeRemainingSeconds = Math.max(0, Math.round((expiryTimeMs - now) / 1000))

    res.json({
      success: true,
      attempt,
      timeRemainingSeconds,
      isExpired: false
    })
  } catch (error) {
    next(error)
  }
}

// @desc Save ongoing answers for an active test
// @route PATCH /api/v1/test-attempts/:id/answers
// @access Private
export async function updateTestAnswers(req, res, next) {
  try {
    const { answers } = req.body
    const attempt = await TestAttempt.findById(req.params.id)

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' })
    }

    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' })
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update answers. This test has already been submitted or expired.'
      })
    }

    if (Date.now() > new Date(attempt.expiryTime).getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Test time has expired. Please submit your assessment.'
      })
    }

    if (Array.isArray(answers)) {
      attempt.answers = answers
      await attempt.save()
    }

    res.json({
      success: true,
      message: 'Answers saved.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Submit mock test & calculate deterministic score on server
// @route POST /api/v1/test-attempts/:id/submit
// @access Private
export async function submitTest(req, res, next) {
  try {
    const { answers } = req.body
    const attempt = await TestAttempt.findById(req.params.id).populate('test')

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' })
    }

    if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' })
    }

    // Idempotent check
    if (attempt.status === 'completed') {
      return res.json({
        success: true,
        message: 'Test already submitted.',
        result: attempt.result,
        attemptId: attempt._id
      })
    }

    if (Array.isArray(answers) && answers.length > 0) {
      attempt.answers = answers
    }

    // Evaluate answers server-side
    const evaluation = await evaluateTestAttempt(attempt, attempt.test)

    attempt.status = 'completed'
    attempt.submittedAt = new Date()
    attempt.result = evaluation
    await attempt.save()

    await ActivityLog.create({
      user: req.user._id,
      activityType: 'mock_test_complete',
      title: `Completed ${attempt.test?.title || 'Mock Test'}`,
      subject: attempt.test?.category || 'Mock Test',
      details: {
        score: evaluation.score,
        percentage: evaluation.percentage,
        correct: evaluation.correctCount,
        testId: attempt.test?._id
      }
    })

    // Immediately trigger real outcome notifications for student
    syncRealNotificationsForUser(req.user).catch(err => {
      console.error('Failed to sync post-test notifications:', err.message)
    })

    res.json({
      success: true,
      message: 'Test submitted and evaluated successfully.',
      result: evaluation,
      attemptId: attempt._id
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get full results and review with solutions revealed
// @route GET /api/v1/test-attempts/:id/results
// @access Private
export async function getTestResults(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({
        path: 'test',
        populate: {
          path: 'questions' // Explanations & correct answers now revealed for post-test review!
        }
      })

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' })
    }

    if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' })
    }

    res.json({
      success: true,
      attempt,
      result: attempt.result
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get user's test history
// @route GET /api/v1/test-attempts/history
// @access Private
export async function getTestHistory(req, res, next) {
  try {
    const attempts = await TestAttempt.find({ user: req.user._id, status: 'completed' })
      .populate('test', 'title category difficulty durationMinutes')
      .sort({ submittedAt: -1 })
      .limit(30)

    res.json({
      success: true,
      count: attempts.length,
      history: attempts
    })
  } catch (error) {
    next(error)
  }
}

// @desc Create test (Admin)
// @route POST /api/v1/tests
// @access Private (Admin)
export async function createTest(req, res, next) {
  try {
    const test = await Test.create(req.body)
    res.status(201).json({ success: true, message: 'Mock test created.', test })
  } catch (error) {
    next(error)
  }
}

// @desc Update test (Admin)
// @route PATCH /api/v1/tests/:id
// @access Private (Admin)
export async function updateTest(req, res, next) {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!test) return res.status(404).json({ success: false, message: 'Test not found.' })
    res.json({ success: true, message: 'Test updated.', test })
  } catch (error) {
    next(error)
  }
}

// @desc Delete test (Admin)
// @route DELETE /api/v1/tests/:id
// @access Private (Admin)
export async function deleteTest(req, res, next) {
  try {
    const test = await Test.findByIdAndDelete(req.params.id)
    if (!test) return res.status(404).json({ success: false, message: 'Test not found.' })
    res.json({ success: true, message: 'Test deleted.' })
  } catch (error) {
    next(error)
  }
}

// @desc Get mock test strengths and areas to improve
// @route GET /api/v1/tests/insights
// @access Private
export async function getMockTestInsights(req, res, next) {
  try {
    const { companyId, role } = req.query
    const insights = await generateMockTestInsights(req.user._id, companyId, role)
    res.json({
      success: true,
      insights
    })
  } catch (error) {
    next(error)
  }
}
