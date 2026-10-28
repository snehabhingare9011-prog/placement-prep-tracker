import { Roadmap } from '../models/Roadmap.js'
import { Company } from '../models/Company.js'
import { User } from '../models/User.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { generateRoadmapForStudent } from '../services/roadmapService.js'

// @desc Get current student roadmap
// @route GET /api/v1/roadmaps
// @access Private
export async function getRoadmap(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('targetCompany')
    const targetCompanyId = req.query.companyId || user?.targetCompany?._id || user?.targetCompany
    const targetRole = req.query.role || user?.currentTargetRole || 'Software Engineer'

    let roadmap = null

    if (targetCompanyId) {
      roadmap = await Roadmap.findOne({ user: req.user._id, company: targetCompanyId })
        .populate('company', 'name code mark color difficulty roles recruitmentRounds')
        .sort({ updatedAt: -1 })
    }

    if (!roadmap && targetCompanyId) {
      const generated = await generateRoadmapForStudent(
        req.user._id,
        targetCompanyId,
        targetRole,
        8
      )
      roadmap = await Roadmap.findById(generated._id).populate('company', 'name code mark color difficulty roles recruitmentRounds')
    }

    if (!roadmap) {
      roadmap = await Roadmap.findOne({ user: req.user._id })
        .populate('company', 'name code mark color difficulty roles recruitmentRounds')
        .sort({ updatedAt: -1 })

      if (!roadmap) {
        const firstCo = await Company.findOne({ isActive: true })
        if (firstCo) {
          const generated = await generateRoadmapForStudent(
            req.user._id,
            firstCo._id,
            'Software Engineer',
            8
          )
          roadmap = await Roadmap.findById(generated._id).populate('company', 'name code mark color difficulty roles recruitmentRounds')
        }
      }
    }

    if (!roadmap) {
      return res.json({
        success: true,
        roadmap: null,
        message: 'No roadmap is available yet for this company and role.'
      })
    }

    // Synchronize tasks with user's saved targetProgress to guarantee consistency
    const companyId = roadmap.company?._id?.toString() || roadmap.company?.toString()
    const role = roadmap.role || targetRole

    let completedTopicIds = user?.completedTopics || []
    if (companyId && user?.targetProgress?.length > 0) {
      const entry = user.targetProgress.find(
        tp => tp.company?.toString() === companyId && (!role || tp.role === role || !tp.role)
      )
      if (entry && Array.isArray(entry.completedTopics)) {
        completedTopicIds = entry.completedTopics
      }
    }

    let modified = false
    roadmap.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        const shouldBeCompleted = completedTopicIds.includes(task.taskId)
        if (task.completed !== shouldBeCompleted) {
          task.completed = shouldBeCompleted
          task.completedAt = shouldBeCompleted ? (task.completedAt || new Date()) : null
          modified = true
        }
      })
    })

    // Calculate overall completion from unique required roadmap topics
    const allTasks = roadmap.phases.flatMap(p => p.tasks)
    const uniqueTaskIds = [...new Set(allTasks.map(t => t.taskId))]
    const uniqueCompleted = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]
    const overallPercentage = uniqueTaskIds.length > 0
      ? Math.round((uniqueCompleted.length / uniqueTaskIds.length) * 100)
      : 0

    if (roadmap.progressPercentage !== overallPercentage || modified) {
      roadmap.progressPercentage = overallPercentage
      roadmap.markModified('phases')
      await roadmap.save()
    }

    // Compute detailed stats per round
    const phasesWithStats = roadmap.phases.map(phase => {
      const total = phase.tasks.length
      const completed = phase.tasks.filter(t => completedTopicIds.includes(t.taskId)).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      const status = completed === 0 ? 'Not Started' : (completed === total ? 'Topics Completed' : 'In Progress')
      return {
        ...phase.toObject(),
        tasks: phase.tasks.map(t => ({
          ...t.toObject(),
          completed: completedTopicIds.includes(t.taskId)
        })),
        totalTopics: total,
        completedTopics: completed,
        percentage,
        status
      }
    })

    res.json({
      success: true,
      roadmap: {
        ...roadmap.toObject(),
        phases: phasesWithStats,
        uniqueTotalTopics: uniqueTaskIds.length,
        uniqueCompletedTopics: uniqueCompleted.length,
        progressPercentage: overallPercentage
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc Generate or regenerate roadmap
// @route POST /api/v1/roadmaps
// @access Private
export async function createOrRegenerateRoadmap(req, res, next) {
  try {
    const { companyId, role, availableWeeks } = req.body

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' })
    }

    const roadmap = await generateRoadmapForStudent(
      req.user._id,
      companyId,
      role,
      availableWeeks ? Number(availableWeeks) : 8
    )

    const populated = await Roadmap.findById(roadmap._id).populate('company', 'name code mark color difficulty roles recruitmentRounds')

    res.json({
      success: true,
      message: 'Personalized preparation roadmap generated.',
      roadmap: populated
    })
  } catch (error) {
    next(error)
  }
}

// @desc Toggle roadmap task completion
// @route PATCH /api/v1/roadmaps/:id/tasks/:taskId
// @access Private
export async function toggleTaskComplete(req, res, next) {
  try {
    const roadmap = await Roadmap.findById(req.params.id)
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found.' })
    }

    // Ownership check
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' })
    }

    const { taskId } = req.params
    const user = await User.findById(req.user._id)
    const companyId = roadmap.company?.toString()
    const role = roadmap.role

    if (!user.targetProgress) {
      user.targetProgress = []
    }

    let targetEntry = null
    if (companyId) {
      targetEntry = user.targetProgress.find(
        tp => tp.company?.toString() === companyId && (!role || tp.role === role || !tp.role)
      )
      if (!targetEntry) {
        targetEntry = {
          company: roadmap.company,
          role: role,
          completedTopics: user.completedTopics?.length > 0 ? [...user.completedTopics] : []
        }
        user.targetProgress.push(targetEntry)
      }
    }

    let completedTopics = targetEntry ? targetEntry.completedTopics : (user.completedTopics || [])
    let isCompleted = false

    if (completedTopics.includes(taskId)) {
      completedTopics = completedTopics.filter(id => id !== taskId)
      isCompleted = false
    } else {
      completedTopics.push(taskId)
      isCompleted = true
    }

    if (targetEntry) {
      targetEntry.completedTopics = completedTopics
    }

    // Keep active target in sync
    const currentTargetId = user.targetCompany?._id || user.targetCompany
    if (!companyId || companyId === currentTargetId?.toString()) {
      user.completedTopics = completedTopics
    }

    user.markModified('targetProgress')
    await user.save()

    // Update ALL occurrences of this taskId across all phases in the roadmap
    let targetTask = null
    roadmap.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        if (task.taskId === taskId) {
          targetTask = task
          task.completed = isCompleted
          task.completedAt = isCompleted ? new Date() : null
        }
      })
    })

    if (!targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found in roadmap.' })
    }

    // Recalculate progress percentage using unique topics
    const allTasks = roadmap.phases.flatMap(p => p.tasks)
    const uniqueTaskIds = [...new Set(allTasks.map(t => t.taskId))]
    const uniqueCompleted = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]
    roadmap.progressPercentage = uniqueTaskIds.length > 0
      ? Math.round((uniqueCompleted.length / uniqueTaskIds.length) * 100)
      : 0

    roadmap.markModified('phases')
    await roadmap.save()

    if (isCompleted) {
      await ActivityLog.create({
        user: req.user._id,
        activityType: 'roadmap_task',
        title: `Completed milestone: ${targetTask.title}`,
        subject: targetTask.subject,
        details: { taskId: targetTask.taskId }
      }).catch(() => {})
    }

    res.json({
      success: true,
      message: isCompleted ? 'Topic marked as completed.' : 'Topic marked as incomplete.',
      task: targetTask,
      isCompleted,
      progressPercentage: roadmap.progressPercentage,
      completedTopics
    })
  } catch (error) {
    next(error)
  }
}
