import { User } from '../models/User.js'
import { Company } from '../models/Company.js'
import { Question } from '../models/Question.js'
import { Test } from '../models/Test.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { PlacementDrive } from '../models/PlacementDrive.js'
import { PracticeAttempt } from '../models/PracticeAttempt.js'

// @desc Get administrative overview metrics
// @route GET /api/v1/admin/overview
// @access Private (Admin, Placement Officer)
export async function getOverview(req, res, next) {
  try {
    const [
      totalUsers,
      totalStudents,
      totalStaff,
      totalCompanies,
      totalQuestions,
      totalTests,
      totalAttempts,
      totalDrives,
      recentUsers,
      recentAttempts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['admin', 'faculty', 'placement_officer'] } }),
      Company.countDocuments({ isActive: true }),
      Question.countDocuments({ isPublished: true }),
      Test.countDocuments({ isPublished: true }),
      TestAttempt.countDocuments({ status: 'completed' }),
      PlacementDrive.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      TestAttempt.find({ status: 'completed' })
        .populate('user', 'name email branch')
        .populate('test', 'title category')
        .sort({ submittedAt: -1 })
        .limit(5)
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalStaff,
        totalCompanies,
        totalQuestions,
        totalTests,
        totalAttempts,
        totalDrives
      },
      recentUsers,
      recentAttempts
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get user directory for administrative management
// @route GET /api/v1/admin/users
// @access Private (Admin)
export async function getUsers(req, res, next) {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query
    const filter = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (role && role !== 'All') filter.role = role
    if (status && status !== 'All') filter.status = status

    const skip = (Number(page) - 1) * Number(limit)
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('targetCompany', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ])

    res.json({
      success: true,
      users,
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

// @desc Update user status or assign permitted role
// @route PATCH /api/v1/admin/users/:id
// @access Private (Admin)
export async function updateUser(req, res, next) {
  try {
    const allowed = ['role', 'status', 'college', 'branch', 'cgpa']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    res.json({
      success: true,
      message: 'User updated successfully.',
      user
    })
  } catch (error) {
    next(error)
  }
}

// @desc Aggregate placement readiness and department-level analytics
// @route GET /api/v1/admin/analytics
// @access Private (Admin, Faculty, Placement Officer)
export async function getAdminAnalytics(req, res, next) {
  try {
    const [branchStats, companyInterest, totalPracticeAttempts] = await Promise.all([
      User.aggregate([
        { $match: { role: 'student' } },
        {
          $group: {
            _id: '$branch',
            studentCount: { $sum: 1 },
            avgCgpa: { $avg: '$cgpa' }
          }
        },
        { $sort: { studentCount: -1 } }
      ]),
      User.aggregate([
        { $match: { role: 'student', targetCompany: { $ne: null } } },
        {
          $group: {
            _id: '$targetCompany',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: 'companies',
            localField: '_id',
            foreignField: '_id',
            as: 'company'
          }
        },
        { $unwind: '$company' },
        {
          $project: {
            name: '$company.name',
            mark: '$company.mark',
            color: '$company.color',
            count: 1
          }
        }
      ]),
      PracticeAttempt.countDocuments()
    ])

    res.json({
      success: true,
      analytics: {
        branchStats,
        companyInterest,
        totalPracticeAttempts
      }
    })
  } catch (error) {
    next(error)
  }
}
