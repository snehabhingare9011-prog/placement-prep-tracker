import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyRoles
} from '../controllers/companyController.js'
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
      // Ignore token failure for public endpoints
    }
  }
  next()
}

const router = Router()

router.get('/', optionalAuth, getCompanies)
router.get('/:id', optionalAuth, getCompanyById)
router.get('/:id/roles', getCompanyRoles)

// Admin company management
router.post('/', authenticate, authorize('admin'), createCompany)
router.patch('/:id', authenticate, authorize('admin'), updateCompany)
router.delete('/:id', authenticate, authorize('admin'), deleteCompany)

export default router
