import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
  getQuestions,
  getQuestionById,
  recordPracticeAttempt,
  getPracticeHistory,
  getSavedQuestions,
  saveQuestion,
  unsaveQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../controllers/questionController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { ENV } from '../config/env.js'
import { User } from '../models/User.js'

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, ENV.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    } catch (e) {
      // Ignore
    }
  }
  next()
}

const router = Router()

// Saved questions & practice history
router.get('/saved', authenticate, getSavedQuestions)
router.get('/history', authenticate, getPracticeHistory)

// Question listing and detail
router.get('/', optionalAuth, getQuestions)
router.get('/:id', optionalAuth, getQuestionById)

// Practice interaction
router.post('/:id/attempts', authenticate, recordPracticeAttempt)
router.post('/:id/save', authenticate, saveQuestion)
router.delete('/:id/save', authenticate, unsaveQuestion)

// Administrative management
router.post('/', authenticate, authorize('admin'), createQuestion)
router.patch('/:id', authenticate, authorize('admin'), updateQuestion)
router.delete('/:id', authenticate, authorize('admin'), deleteQuestion)

export default router
