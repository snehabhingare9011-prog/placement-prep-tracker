import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  updatePassword,
  setTargetGoal,
  getStudents,
  getStudentById
} from '../controllers/userController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'

const router = Router()

// Current authenticated user routes
router.get('/me', authenticate, getProfile)
router.patch('/me', authenticate, updateProfile)
router.patch('/me/password', authenticate, updatePassword)
router.patch('/me/target', authenticate, setTargetGoal)

// Staff & Placement Officer & Admin routes to manage students
router.get('/students', authenticate, authorize('admin', 'faculty', 'placement_officer'), getStudents)
router.get('/students/:id', authenticate, authorize('admin', 'faculty', 'placement_officer'), getStudentById)

export default router
