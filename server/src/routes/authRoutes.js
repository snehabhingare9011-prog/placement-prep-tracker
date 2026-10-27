import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
})

const router = Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, getMe)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)

export default router
