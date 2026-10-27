import { Router } from 'express'
import {
  getRoadmap,
  createOrRegenerateRoadmap,
  toggleTaskComplete
} from '../controllers/roadmapController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.get('/', authenticate, getRoadmap)
router.post('/', authenticate, createOrRegenerateRoadmap)
router.patch('/:id/tasks/:taskId', authenticate, toggleTaskComplete)

export default router
