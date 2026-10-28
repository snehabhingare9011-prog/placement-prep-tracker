import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { Otp } from '../models/Otp.js'
import { ENV } from '../config/env.js'
import { generateOtp, hashOtp, sendOtpEmail } from '../services/emailService.js'

function generateToken(id) {
  return jwt.sign({ id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  })
}

// @desc Request registration OTP email
// @route POST /api/v1/auth/send-otp
// @access Public
export async function sendRegistrationOtp(req, res, next) {
  try {
    const { email, name, password } = req.body

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.'
      })
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      })
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account may already exist for this email. Try signing in or use another email.'
      })
    }

    // Check for resend rate limit / cooldown
    const existingOtp = await Otp.findOne({ email: normalizedEmail })
    if (existingOtp && existingOtp.resendAvailableAt && existingOtp.resendAvailableAt > Date.now()) {
      const remainingSeconds = Math.ceil((existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000)
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} second(s) before requesting another code.`
      })
    }

    // Generate secure 6-digit OTP
    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    const resendAvailableAt = new Date(Date.now() + 60 * 1000) // 60 seconds

    // Upsert OTP record
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        attempts: 0,
        expiresAt,
        resendAvailableAt
      },
      { upsert: true, new: true }
    )

    // Dispatch OTP email
    await sendOtpEmail({
      to: normalizedEmail,
      name: name.trim(),
      otp
    })

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Verify registration OTP
// @route POST /api/v1/auth/verify-otp
// @access Public
export async function verifyRegistrationOtp(req, res, next) {
  try {
    const { email, otp } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.'
      })
    }

    if (!otp || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the verification code.'
      })
    }

    if (otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the complete verification code.'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const otpRecord = await Otp.findOne({ email: normalizedEmail })

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'This code has already been used. Request a new code if needed.'
      })
    }

    if (otpRecord.expiresAt < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id })
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Request a new code.'
      })
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id })
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please wait or request a new code.'
      })
    }

    const hashedInput = hashOtp(otp.trim())
    if (otpRecord.otpHash !== hashedInput) {
      otpRecord.attempts += 1
      await otpRecord.save()
      return res.status(400).json({
        success: false,
        message: 'The verification code is incorrect. Please try again.'
      })
    }

    res.json({
      success: true,
      message: 'Email verified successfully.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Register a new user
// @route POST /api/v1/auth/register
// @access Public
export async function register(req, res, next) {
  try {
    const { name, email, password, college, degree, branch, graduationYear, cgpa, skills } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.'
      })
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account may already exist for this email. Try signing in or use another email.'
      })
    }

    // Role cannot be escalated through public registration
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
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

    if (!email && !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address and password.'
      })
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.'
      })
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password.'
      })
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('targetCompany')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.'
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
