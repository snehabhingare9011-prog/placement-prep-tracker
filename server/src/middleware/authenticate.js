import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import { User } from '../models/User.js'

export async function authenticate(req, res, next) {
  try {
    let token = null
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in to continue.'
      })
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or token no longer valid.'
      })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact your placement administrator.'
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    })
  }
}
