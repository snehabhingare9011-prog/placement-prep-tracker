import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import Company from '../models/Company.js'
import User from '../models/User.js'
import { getCurriculumForCompany, COMPANY_CURRICULUM } from '../services/curriculumService.js'

const router = Router()

// GET /api/v1/curriculum/all-topics
router.get('/all-topics', (req, res) => {
  res.json({
    success: true,
    topics: COMPANY_CURRICULUM.topics
  })
})

// GET /api/v1/curriculum/company/:companyId
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params
    let company = null

    if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(companyId)
    } else {
      company = await Company.findOne({ code: companyId.toLowerCase() })
    }

    if (!company) {
      // Fallback to first available company or generic
      company = await Company.findOne() || {
        name: 'Target Tech Company',
        roles: ['Full Stack Developer', 'Software Engineer']
      }
    }

    // Parse roles query parameter if provided
    let roles = []
    if (req.query.roles) {
      roles = req.query.roles.split(',').map(r => r.trim()).filter(Boolean)
    } else if (company.roles && company.roles.length > 0) {
      roles = company.roles
    } else {
      roles = ['Full Stack Developer', 'Software Engineer']
    }

    const curriculum = getCurriculumForCompany(company, roles)

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        code: company.code,
        industry: company.industry,
        difficulty: company.difficulty,
        roles: company.roles
      },
      ...curriculum
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/v1/curriculum/user-progress
router.get('/user-progress', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('targetCompany')
    const completedTopics = user.completedTopics || []
    const selectedRoles = user.selectedRoles?.length > 0 ? user.selectedRoles : (user.targetRoles || ['Full Stack Developer'])

    let totalTopics = 0
    let progressPercentage = 0

    if (user.targetCompany) {
      const curriculum = getCurriculumForCompany(user.targetCompany, selectedRoles)
      totalTopics = curriculum.totalTopics
      const completedCount = curriculum.topics.filter(t => completedTopics.includes(t.id)).length
      progressPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0
    }

    res.json({
      success: true,
      completedTopics,
      selectedRoles,
      totalTopics,
      progressPercentage
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PATCH /api/v1/curriculum/toggle-topic
router.patch('/toggle-topic', authenticate, async (req, res) => {
  try {
    const { topicId } = req.body
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId is required' })
    }

    const user = await User.findById(req.user._id).populate('targetCompany')
    let completedTopics = user.completedTopics || []

    if (completedTopics.includes(topicId)) {
      completedTopics = completedTopics.filter(id => id !== topicId)
    } else {
      completedTopics.push(topicId)
    }

    user.completedTopics = completedTopics
    await user.save()

    const selectedRoles = user.selectedRoles?.length > 0 ? user.selectedRoles : (user.targetRoles || ['Full Stack Developer'])
    let progressPercentage = 0
    let totalTopics = 0

    if (user.targetCompany) {
      const curriculum = getCurriculumForCompany(user.targetCompany, selectedRoles)
      totalTopics = curriculum.totalTopics
      const completedCount = curriculum.topics.filter(t => completedTopics.includes(t.id)).length
      progressPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0
    }

    res.json({
      success: true,
      completedTopics,
      isCompleted: completedTopics.includes(topicId),
      totalTopics,
      progressPercentage
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PATCH /api/v1/curriculum/roles
router.patch('/roles', authenticate, async (req, res) => {
  try {
    const { roles } = req.body
    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ success: false, message: 'roles array is required' })
    }

    const user = await User.findById(req.user._id)
    user.selectedRoles = roles
    await user.save()

    res.json({
      success: true,
      selectedRoles: user.selectedRoles
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
