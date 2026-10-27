import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { ENV } from '../config/env.js'

function generateToken(id) {
  return jwt.sign({ id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  })
}

// @desc Register a new student
// @route POST /api/v1/auth/register
// @access Public
export async function register(req, res, next) {
  try {
    const { name, email, password, college, degree, branch, graduationYear, cgpa, skills } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      })
    }

    // Role cannot be escalated through public registration
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
      college: college || 'Apex Institute of Technology',
      degree: degree || 'B.Tech',
      branch: branch || 'Computer Engineering',
      graduationYear: graduationYear ? Number(graduationYear) : 2026,
      cgpa: cgpa ? Number(cgpa) : 8.0,
      skills: Array.isArray(skills) ? skills : ['JavaScript', 'React', 'DSA']
    })

    const token = generateToken(user._id)

    await ActivityLog.create({
      user: user._id,
      activityType: 'login',
      title: 'Registered account and signed in',
      subject: 'Account'
    })

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    next(error)
  }
}

// @desc Login user
// @route POST /api/v1/auth/login
// @access Public
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('targetCompany')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact your placement administrator.'
      })
    }

    const token = generateToken(user._id)

    await ActivityLog.create({
      user: user._id,
      activityType: 'login',
      title: 'Signed in to HireVerse',
      subject: 'Account'
    })

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    next(error)
  }
}

// @desc Logout user
// @route POST /api/v1/auth/logout
// @access Private
export async function logout(req, res) {
  res.json({
    success: true,
    message: 'Signed out successfully.'
  })
}

// @desc Get current authenticated user
// @route GET /api/v1/auth/me
// @access Private
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('targetCompany')
    res.json({
      success: true,
      user
    })
  } catch (error) {
    next(error)
  }
}

// @desc Forgot password token generation
// @route POST /api/v1/auth/forgot-password
// @access Public
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address.'
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address.'
      })
    }

    const resetToken = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000 // 30 minutes
    await user.save({ validateBeforeSave: false })

    res.json({
      success: true,
      message: 'Password reset token generated. Use this token to reset your password.',
      resetToken: ENV.NODE_ENV === 'development' ? resetToken : undefined
    })
  } catch (error) {
    next(error)
  }
}

// @desc Reset password
// @route POST /api/v1/auth/reset-password
// @access Public
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.'
      })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired.'
      })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.'
    })
  } catch (error) {
    next(error)
  }
}
