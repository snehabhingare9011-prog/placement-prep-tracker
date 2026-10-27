import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import companyRoutes from './companyRoutes.js'
import questionRoutes from './questionRoutes.js'
import testRoutes from './testRoutes.js'
import roadmapRoutes from './roadmapRoutes.js'
import readinessRoutes from './readinessRoutes.js'
import placementRoutes from './placementRoutes.js'
import adminRoutes from './adminRoutes.js'
import curriculumRoutes from './curriculumRoutes.js'

const router = Router()

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'HireVerse MERN API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/', userRoutes) // allows /students and /students/:id
router.use('/companies', companyRoutes)
router.use('/questions', questionRoutes)
router.use('/practice', questionRoutes) // allows /practice/history
router.use('/tests', testRoutes)
router.use('/test-attempts', testRoutes) // allows /test-attempts/:id/...
router.use('/roadmaps', roadmapRoutes)
router.use('/readiness', readinessRoutes)
router.use('/analytics', readinessRoutes) // allows /analytics/student
router.use('/placement', placementRoutes)
router.use('/placement-drives', placementRoutes)
router.use('/announcements', placementRoutes)
router.use('/admin', adminRoutes)
router.use('/curriculum', curriculumRoutes)

export default router
