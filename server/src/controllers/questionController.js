import { Question } from '../models/Question.js'
import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { SavedQuestion } from '../models/SavedQuestion.js'
import { ActivityLog } from '../models/ActivityLog.js'

// @desc Get all questions with filtering, pagination, and user attempt state
// @route GET /api/v1/questions
// @access Public / Private
export async function getQuestions(req, res, next) {
  try {
    const {
      search,
      category,
      subject,
      topic,
      difficulty,
      companyId,
      questionType,
      page = 1,
      limit = 20
    } = req.query

    const filter = { isPublished: true }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { statement: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ]
    }
    if (category && category !== 'All categories') filter.category = category
    if (subject && subject !== 'All subjects') filter.subject = subject
    if (topic && topic !== 'All topics') filter.topic = topic
    if (difficulty && difficulty !== 'All difficulties') filter.difficulty = difficulty
    if (questionType) filter.questionType = questionType
    if (companyId) filter.companies = companyId

    const skip = (Number(page) - 1) * Number(limit)

    // Omit correctAnswer from list view to prevent key leakage
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select('-correctAnswer')
        .populate('companies', 'name code mark color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(filter)
    ])

    // If authenticated, attach user's attempt status and bookmarks
    let enriched = questions.map(q => q.toObject())
    if (req.user) {
      const questionIds = questions.map(q => q._id)
      const [attempts, bookmarks] = await Promise.all([
        PracticeAttempt.find({ user: req.user._id, question: { $in: questionIds } }).lean(),
        SavedQuestion.find({ user: req.user._id, question: { $in: questionIds } }).lean()
      ])

      const attemptMap = new Map(attempts.map(a => [a.question.toString(), a]))
      const bookmarkSet = new Set(bookmarks.map(b => b.question.toString()))

      enriched = enriched.map(q => {
        const attempt = attemptMap.get(q._id.toString())
        return {
          ...q,
          isSaved: bookmarkSet.has(q._id.toString()),
          attemptStatus: attempt ? (attempt.isCorrect ? 'solved' : 'attempted') : 'unanswered',
          previousAttempt: attempt || null
        }
      })
    }

    res.json({
      success: true,
      questions: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get question by id with user attempt details
// @route GET /api/v1/questions/:id
// @access Public / Private
export async function getQuestionById(req, res, next) {
  try {
    const question = await Question.findById(req.params.id).populate('companies', 'name code mark color')
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }

    let previousAttempt = null
    let isSaved = false

    if (req.user) {
      previousAttempt = await PracticeAttempt.findOne({ user: req.user._id, question: question._id }).lean()
      const bookmark = await SavedQuestion.findOne({ user: req.user._id, question: question._id })
      isSaved = !!bookmark
    }

    const questionObj = question.toObject()
    // Do not leak correctAnswer unless attempted, or if user is admin
    if (!previousAttempt && (!req.user || req.user.role === 'student')) {
      delete questionObj.correctAnswer
    }

    res.json({
      success: true,
      question: questionObj,
      previousAttempt,
      isSaved
    })
  } catch (error) {
    next(error)
  }
}

// @desc Record practice attempt & evaluate objective answers server-side
// @route POST /api/v1/questions/:id/attempts
// @access Private
export async function recordPracticeAttempt(req, res, next) {
  try {
    const { answer, notes, timeTakenSeconds } = req.body

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }

    let isCorrect = false
    let evaluationNote = ''

    if (question.questionType === 'multiple-choice') {
      isCorrect = String(answer) === String(question.correctAnswer)
      evaluationNote = isCorrect
        ? 'Correct answer! Excellent problem-solving.'
        : `Incorrect. The correct answer was option ${Number(question.correctAnswer) + 1}.`
    } else {
      // Descriptive, code snippet, or short answer approach
      isCorrect = true // Saved solution attempt
      evaluationNote = 'Approach recorded to your practice history.'
    }

    const attempt = await PracticeAttempt.findOneAndUpdate(
      { user: req.user._id, question: question._id },
      {
        submittedAnswer: answer,
        isCorrect,
        notes: notes || '',
        status: isCorrect ? 'solved' : 'attempted',
        timeTakenSeconds: timeTakenSeconds || 60
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    await ActivityLog.create({
      user: req.user._id,
      activityType: isCorrect ? 'practice_solve' : 'practice_attempt',
      title: `${isCorrect ? 'Solved' : 'Attempted'}: ${question.title}`,
      subject: question.subject,
      details: { questionId: question._id, topic: question.topic, isCorrect }
    })

    res.json({
      success: true,
      message: evaluationNote,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      attempt
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get student practice history
// @route GET /api/v1/practice/history
// @access Private
export async function getPracticeHistory(req, res, next) {
  try {
    const attempts = await PracticeAttempt.find({ user: req.user._id })
      .populate('question')
      .sort({ updatedAt: -1 })
      .limit(50)

    res.json({
      success: true,
      count: attempts.length,
      history: attempts
    })
  } catch (error) {
    next(error)
  }
}

// @desc Save / bookmark question
// @route POST /api/v1/questions/:id/save
// @access Private
export async function saveQuestion(req, res, next) {
  try {
    await SavedQuestion.findOneAndUpdate(
      { user: req.user._id, question: req.params.id },
      { user: req.user._id, question: req.params.id },
      { upsert: true }
    )

    res.json({
      success: true,
      message: 'Question bookmarked for later review.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Unsave / remove bookmark
// @route DELETE /api/v1/questions/:id/save
// @access Private
export async function unsaveQuestion(req, res, next) {
  try {
    await SavedQuestion.findOneAndDelete({ user: req.user._id, question: req.params.id })
    res.json({
      success: true,
      message: 'Bookmark removed.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get saved questions
// @route GET /api/v1/questions/saved
// @access Private
export async function getSavedQuestions(req, res, next) {
  try {
    const saved = await SavedQuestion.find({ user: req.user._id })
      .populate({
        path: 'question',
        populate: { path: 'companies', select: 'name mark color' }
      })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      saved: saved.map(s => s.question).filter(Boolean)
    })
  } catch (error) {
    next(error)
  }
}

// @desc Create question (Admin)
// @route POST /api/v1/questions
// @access Private (Admin)
export async function createQuestion(req, res, next) {
  try {
    const question = await Question.create(req.body)
    res.status(201).json({
      success: true,
      message: 'Question added to question bank.',
      question
    })
  } catch (error) {
    next(error)
  }
}

// @desc Update question (Admin)
// @route PATCH /api/v1/questions/:id
// @access Private (Admin)
export async function updateQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }
    res.json({ success: true, message: 'Question updated.', question })
  } catch (error) {
    next(error)
  }
}

// @desc Delete question (Admin)
// @route DELETE /api/v1/questions/:id
// @access Private (Admin)
export async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id)
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }
    res.json({ success: true, message: 'Question deleted from bank.' })
  } catch (error) {
    next(error)
  }
}
