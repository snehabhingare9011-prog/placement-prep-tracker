import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
  getTests,
  getTestById,
  startTest,
  getTestAttempt,
  updateTestAnswers,
  submitTest,
  getTestResults,
  getTestHistory,
  createTest,
  updateTest,
  deleteTest
} from '../controllers/testController.js'
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

// Test discovery
router.get('/', optionalAuth, getTests)
router.get('/history', authenticate, getTestHistory)
router.get('/:id', optionalAuth, getTestById)

// Test session and execution
router.post('/:id/start', authenticate, startTest)
router.get('/attempts/:id', authenticate, getTestAttempt)
router.patch('/attempts/:id/answers', authenticate, updateTestAnswers)
router.post('/attempts/:id/submit', authenticate, submitTest)
router.get('/attempts/:id/results', authenticate, getTestResults)

// Admin management
router.post('/', authenticate, authorize('admin'), createTest)
router.patch('/:id', authenticate, authorize('admin'), updateTest)
router.delete('/:id', authenticate, authorize('admin'), deleteTest)

export default router
