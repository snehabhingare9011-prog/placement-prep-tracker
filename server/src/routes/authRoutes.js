import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  register,
  login,
  logout,
  getMe
} from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait before trying again.'
  }
})

const router = Router()

router.post('/send-otp', authLimiter, sendRegistrationOtp)
router.post('/verify-otp', authLimiter, verifyRegistrationOtp)
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, getMe)

export default router
