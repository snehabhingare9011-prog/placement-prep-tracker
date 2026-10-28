import { Router } from 'express'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.get('/', authenticate, getNotifications)
router.patch('/read-all', authenticate, markAllNotificationsRead)
router.patch('/:id/read', authenticate, markNotificationRead)

export default router
