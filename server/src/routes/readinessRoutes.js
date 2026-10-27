import { Router } from 'express'
import {
  getReadiness,
  getCompanyReadiness,
  getStudentAnalytics
} from '../controllers/readinessController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.get('/', authenticate, getReadiness)
router.get('/company/:companyId', authenticate, getCompanyReadiness)
router.get('/company/:companyId/role/:roleId', authenticate, getCompanyReadiness)
router.get('/analytics/student', authenticate, getStudentAnalytics)

export default router
