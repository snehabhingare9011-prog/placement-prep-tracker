import { Roadmap } from '../models/Roadmap.js'
import { Company } from '../models/Company.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { generateRoadmapForStudent } from '../services/roadmapService.js'

// @desc Get current student roadmap
// @route GET /api/v1/roadmaps
// @access Private
export async function getRoadmap(req, res, next) {
  try {
    const targetCompanyId = req.query.companyId || req.user.targetCompany
    const targetRole = req.query.role || req.user.currentTargetRole || 'Software Engineer'

    let roadmap = null

    if (targetCompanyId) {
      roadmap = await Roadmap.findOne({ user: req.user._id, company: targetCompanyId })
        .populate('company', 'name code mark color difficulty roles')
        .sort({ updatedAt: -1 })
    }

    if (!roadmap && targetCompanyId) {
      const generated = await generateRoadmapForStudent(
        req.user._id,
        targetCompanyId,
        targetRole,
        8
      )
      roadmap = await Roadmap.findById(generated._id).populate('company', 'name code mark color difficulty roles')
    }

    if (!roadmap) {
      roadmap = await Roadmap.findOne({ user: req.user._id })
        .populate('company', 'name code mark color difficulty roles')
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
          roadmap = await Roadmap.findById(generated._id).populate('company', 'name code mark color difficulty roles')
        }
      }
    }

    res.json({
      success: true,
      roadmap
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

    const populated = await Roadmap.findById(roadmap._id).populate('company', 'name code mark color difficulty roles')

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

    let targetTask = null
    for (const phase of roadmap.phases) {
      const task = phase.tasks.find(t => t.taskId === req.params.taskId)
      if (task) {
        targetTask = task
        task.completed = !task.completed
        task.completedAt = task.completed ? new Date() : null
        break
      }
    }

    if (!targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found in roadmap.' })
    }

    // Recalculate progress percentage
    const allTasks = roadmap.phases.flatMap(p => p.tasks)
    const completedTasks = allTasks.filter(t => t.completed)
    roadmap.progressPercentage = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0

    await roadmap.save()

    if (targetTask.completed) {
      await ActivityLog.create({
        user: req.user._id,
        activityType: 'roadmap_task',
        title: `Completed milestone: ${targetTask.title}`,
        subject: targetTask.subject,
        details: { taskId: targetTask.taskId }
      })
    }

    res.json({
      success: true,
      message: targetTask.completed ? 'Task marked complete.' : 'Task reopened.',
      task: targetTask,
      progressPercentage: roadmap.progressPercentage
    })
  } catch (error)
  {
    next(error)
  }
}
