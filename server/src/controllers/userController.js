import { User } from '../models/User.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { Company } from '../models/Company.js'
import { Roadmap } from '../models/Roadmap.js'
import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'

// @desc Get current user profile
// @route GET /api/v1/users/me
// @access Private
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('targetCompany')
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
}

// @desc Update current user profile
// @route PATCH /api/v1/users/me
// @access Private
export async function updateProfile(req, res, next) {
  try {
    const allowedUpdates = [
      'name',
      'college',
      'degree',
      'branch',
      'graduationYear',
      'cgpa',
      'skills',
      'targetRoles',
      'currentTargetRole'
    ]

    const updates = {}
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key]
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).populate('targetCompany')

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    })
  } catch (error) {
    next(error)
  }
}

// @desc Update user password
// @route PATCH /api/v1/users/me/password
// @access Private
export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      })
    }

    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.matchPassword(currentPassword)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      })
    }

    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password changed successfully.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Set active target company & role
// @route PATCH /api/v1/users/me/target
// @access Private
export async function setTargetGoal(req, res, next) {
  try {
    const { companyId, role } = req.body

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      })
    }

    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      })
    }

    const targetRole = role || company.roles[0] || 'Software Engineer'

    const userDoc = await User.findById(req.user._id)
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (!userDoc.targetProgress) {
      userDoc.targetProgress = []
    }

    // Preserve previous target's completed topics
    if (userDoc.targetCompany) {
      const oldCompanyId = userDoc.targetCompany.toString()
      const oldRole = userDoc.currentTargetRole || ''
      const existingIdx = userDoc.targetProgress.findIndex(
        tp => tp.company?.toString() === oldCompanyId && (tp.role === oldRole || !tp.role)
      )
      if (existingIdx >= 0) {
        userDoc.targetProgress[existingIdx].completedTopics = userDoc.completedTopics || []
      } else {
        userDoc.targetProgress.push({
          company: userDoc.targetCompany,
          role: oldRole,
          completedTopics: userDoc.completedTopics || []
        })
      }
    }

    // Load or initialize new target's completed topics
    const newEntry = userDoc.targetProgress.find(
      tp => tp.company?.toString() === company._id.toString() && (tp.role === targetRole || !tp.role)
    )
    if (newEntry) {
      userDoc.completedTopics = newEntry.completedTopics || []
    } else {
      userDoc.completedTopics = []
      userDoc.targetProgress.push({
        company: company._id,
        role: targetRole,
        completedTopics: []
      })
    }

    userDoc.targetCompany = company._id
    userDoc.currentTargetRole = targetRole
    await userDoc.save()
    await userDoc.populate('targetCompany')

    await ActivityLog.create({
      user: req.user._id,
      activityType: 'target_change',
      title: `Changed target to ${company.name} · ${targetRole}`,
      subject: 'Target',
      details: { company: company.name, role: targetRole }
    })

    res.json({
      success: true,
      message: `Target set to ${company.name} · ${targetRole}`,
      user: userDoc
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get students list for staff / placement officers
// @route GET /api/v1/students
// @access Private (Admin, Faculty, Placement Officer)
export async function getStudents(req, res, next) {
  try {
    const { search, branch, graduationYear, minCgpa, page = 1, limit = 20 } = req.query

    const filter = { role: 'student' }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (branch && branch !== 'All') {
      filter.branch = branch
    }
    if (graduationYear) {
      filter.graduationYear = Number(graduationYear)
    }
    if (minCgpa) {
      filter.cgpa = { $gte: Number(minCgpa) }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [students, total] = await Promise.all([
      User.find(filter)
        .populate('targetCompany', 'name code mark color')
        .sort({ cgpa: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ])

    res.json({
      success: true,
      students,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get single student full details for placement team
// @route GET /api/v1/students/:id
// @access Private (Admin, Faculty, Placement Officer)
export async function getStudentById(req, res, next) {
  try {
    const student = await User.findById(req.params.id).populate('targetCompany')
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      })
    }

    const [practiceAttempts, testAttempts, roadmap] = await Promise.all([
      PracticeAttempt.find({ user: student._id }).populate('question', 'title subject topic difficulty').lean(),
      TestAttempt.find({ user: student._id, status: 'completed' }).populate('test', 'title category').lean(),
      Roadmap.findOne({ user: student._id }).lean()
    ])

    res.json({
      success: true,
      student,
      stats: {
        practiceCount: practiceAttempts.length,
        testsCompleted: testAttempts.length,
        roadmapProgress: roadmap ? roadmap.progressPercentage : 0
      },
      recentTests: testAttempts.slice(0, 5),
      recentPractice: practiceAttempts.slice(0, 10)
    })
  } catch (error) {
    next(error)
  }
}
