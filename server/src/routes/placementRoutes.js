import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
  getPlacementDrives,
  getPlacementDriveById,
  createPlacementDrive,
  updatePlacementDrive,
  applyForDrive,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/placementController.js'
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

// Placement drives
router.get('/drives', optionalAuth, getPlacementDrives)
router.get('/drives/:id', optionalAuth, getPlacementDriveById)
router.post('/drives/:id/apply', authenticate, applyForDrive)
router.post('/drives', authenticate, authorize('admin', 'faculty', 'placement_officer'), createPlacementDrive)
router.patch('/drives/:id', authenticate, authorize('admin', 'faculty', 'placement_officer'), updatePlacementDrive)

// Announcements
router.get('/announcements', optionalAuth, getAnnouncements)
router.post('/announcements', authenticate, authorize('admin', 'faculty', 'placement_officer'), createAnnouncement)
router.delete('/announcements/:id', authenticate, authorize('admin'), deleteAnnouncement)

export default router
