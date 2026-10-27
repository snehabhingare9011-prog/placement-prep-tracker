import { Router } from 'express'
import {
  getOverview,
  getUsers,
  updateUser,
  getAdminAnalytics
} from '../controllers/adminController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'

const router = Router()

// Admin and placement staff endpoints
router.get('/overview', authenticate, authorize('admin', 'placement_officer'), getOverview)
router.get('/users', authenticate, authorize('admin'), getUsers)
router.patch('/users/:id', authenticate, authorize('admin'), updateUser)
router.get('/analytics', authenticate, authorize('admin', 'faculty', 'placement_officer'), getAdminAnalytics)

export default router
