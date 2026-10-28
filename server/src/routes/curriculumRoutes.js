import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import Company from '../models/Company.js'
import User from '../models/User.js'
import { Roadmap } from '../models/Roadmap.js'
import { isPhaseUnlocked } from '../controllers/roadmapController.js'
import { getCurriculumForCompany, COMPANY_CURRICULUM } from '../services/curriculumService.js'
import { syncRealNotificationsForUser } from '../services/notificationService.js'

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
    const companyId = req.query.companyId || user.targetCompany?._id || user.targetCompany
    const role = req.query.role || user.currentTargetRole

    let completedTopics = user.completedTopics || []
    if (companyId && user.targetProgress?.length > 0) {
      const entry = user.targetProgress.find(
        tp => tp.company?.toString() === companyId.toString() && (!role || tp.role === role || !tp.role)
      )
      if (entry) {
        completedTopics = entry.completedTopics || []
      }
    }

    const selectedRoles = user.selectedRoles?.length > 0 ? user.selectedRoles : (user.targetRoles || [role || 'Full Stack Developer'])

    let totalTopics = 0
    let progressPercentage = 0

    let company = user.targetCompany
    if (companyId && (!company || company._id?.toString() !== companyId.toString())) {
      company = await Company.findById(companyId)
    }

    if (company) {
      const curriculum = getCurriculumForCompany(company, selectedRoles)
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
    const { topicId, companyId: paramCompanyId, role: paramRole } = req.body
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId is required' })
    }

    const user = await User.findById(req.user._id).populate('targetCompany')
    const activeCompanyId = paramCompanyId || user.targetCompany?._id || user.targetCompany
    const activeRole = paramRole || user.currentTargetRole || 'Software Engineer'

    // Check if task belongs to a locked roadmap round and enforce sequential unlocking
    let roadmap = null
    if (activeCompanyId) {
      roadmap = await Roadmap.findOne({ user: user._id, company: activeCompanyId })
      if (roadmap) {
        const containingPhases = []
        roadmap.phases.forEach((phase, idx) => {
          if (phase.tasks.some(t => t.taskId === topicId)) {
            containingPhases.push({ phase, idx })
          }
        })
        if (containingPhases.length > 0) {
          const isAnyUnlocked = containingPhases.some(({ idx }) => isPhaseUnlocked(idx, roadmap.phases))
          if (!isAnyUnlocked) {
            const lockedNums = containingPhases.map(({ idx }) => idx + 1).join(', ')
            return res.status(400).json({
              success: false,
              message: `Cannot update topic. Stage ${lockedNums} in your preparation roadmap is locked. Complete all required topics in prerequisite stages first.`
            })
          }
        }
      }
    }

    if (!user.targetProgress) {
      user.targetProgress = []
    }

    let targetEntry = null
    if (activeCompanyId) {
      targetEntry = user.targetProgress.find(
        tp => tp.company?.toString() === activeCompanyId.toString() && (tp.role === activeRole || !tp.role)
      )
      if (!targetEntry) {
        targetEntry = {
          company: activeCompanyId,
          role: activeRole,
          completedTopics: user.completedTopics?.length > 0 ? [...user.completedTopics] : []
        }
        user.targetProgress.push(targetEntry)
      }
    }

    let completedTopics = targetEntry ? targetEntry.completedTopics : (user.completedTopics || [])

    let isCompleted = false
    if (completedTopics.includes(topicId)) {
      completedTopics = completedTopics.filter(id => id !== topicId)
      isCompleted = false
    } else {
      completedTopics.push(topicId)
      isCompleted = true
    }

    if (targetEntry) {
      targetEntry.completedTopics = completedTopics
    }

    const currentTargetId = user.targetCompany?._id || user.targetCompany
    const isCurrentActiveTarget = !paramCompanyId || paramCompanyId.toString() === currentTargetId?.toString()
    if (isCurrentActiveTarget) {
      user.completedTopics = completedTopics
    }

    user.markModified('targetProgress')
    await user.save()

    // Keep active Roadmap tasks synchronized in database
    if (activeCompanyId) {
      const roadmap = await Roadmap.findOne({ user: user._id, company: activeCompanyId })
      if (roadmap) {
        roadmap.phases.forEach(phase => {
          phase.tasks.forEach(task => {
            if (task.taskId === topicId) {
              task.completed = isCompleted
              task.completedAt = isCompleted ? new Date() : null
            }
          })
        })
        const allTasks = roadmap.phases.flatMap(p => p.tasks)
        const uniqueTaskIds = [...new Set(allTasks.map(t => t.taskId))]
        const uniqueCompleted = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]
        roadmap.progressPercentage = uniqueTaskIds.length > 0
          ? Math.round((uniqueCompleted.length / uniqueTaskIds.length) * 100)
          : 0
        roadmap.markModified('phases')
        await roadmap.save()
      }
    }

    const selectedRoles = user.selectedRoles?.length > 0 ? user.selectedRoles : (user.targetRoles || [activeRole])
    let progressPercentage = 0
    let totalTopics = 0

    let company = user.targetCompany
    if (activeCompanyId && (!company || company._id?.toString() !== activeCompanyId.toString())) {
      company = await Company.findById(activeCompanyId)
    }

    if (company) {
      const curriculum = getCurriculumForCompany(company, selectedRoles)
      totalTopics = curriculum.totalTopics
      const completedCount = curriculum.topics.filter(t => completedTopics.includes(t.id)).length
      progressPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0
    }

    if (isCompleted) {
      syncRealNotificationsForUser(user).catch(err => {
        console.error('Failed to sync progress notifications:', err.message)
      })
    }

    res.json({
      success: true,
      completedTopics,
      isCompleted,
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
