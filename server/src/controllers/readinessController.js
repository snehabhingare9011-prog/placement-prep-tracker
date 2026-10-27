import { calculateReadiness } from '../services/readinessService.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Company } from '../models/Company.js'

// @desc Get readiness analysis for authenticated student
// @route GET /api/v1/readiness
// @access Private
export async function getReadiness(req, res, next) {
  try {
    const companyId = req.query.companyId || req.user.targetCompany
    const role = req.query.role || req.user.currentTargetRole

    const readiness = await calculateReadiness(req.user._id, companyId, role)

    res.json({
      success: true,
      readiness
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get company-specific readiness score
// @route GET /api/v1/readiness/:companyId/:roleId?
// @access Private
export async function getCompanyReadiness(req, res, next) {
  try {
    const { companyId, roleId } = req.params
    const readiness = await calculateReadiness(req.user._id, companyId, roleId)

    res.json({
      success: true,
      readiness
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get student preparation analytics & streak calculations
// @route GET /api/v1/analytics/student
// @access Private
export async function getStudentAnalytics(req, res, next) {
  try {
    const userId = req.user._id

    // Fetch past 30 days of activities
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [activities, practiceAttempts, testAttempts, targetCompanies] = await Promise.all([
      ActivityLog.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: 1 }).lean(),
      PracticeAttempt.find({ user: userId }).populate('question', 'subject topic difficulty').lean(),
      TestAttempt.find({ user: userId, status: 'completed' }).populate('test', 'title category').sort({ submittedAt: 1 }).lean(),
      Company.find({ isActive: true }).limit(5).lean()
    ])

    // Calculate real activity streak
    const activityDays = new Set(
      activities.map(a => new Date(a.createdAt).toISOString().split('T')[0])
    )

    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      if (activityDays.has(checkDate)) {
        currentStreak += 1
      } else if (i === 0) {
        // Today hasn't had activity yet, check if yesterday had
        continue
      } else {
        break
      }
    }

    // Weekly day breakdown (Mon - Sun)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    activities.filter(a => new Date(a.createdAt) >= sevenDaysAgo).forEach(a => {
      const dayName = daysOfWeek[new Date(a.createdAt).getDay()]
      if (weeklyCounts[dayName] !== undefined) {
        weeklyCounts[dayName] += 1
      }
    })

    const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      count: weeklyCounts[day],
      value: Math.min(100, weeklyCounts[day] * 25)
    }))

    // Practice accuracy trends
    const solvedCount = practiceAttempts.filter(p => p.isCorrect || p.status === 'solved').length
    const overallAccuracy = practiceAttempts.length > 0
      ? Math.round((solvedCount / practiceAttempts.length) * 100)
      : 0

    // Subject breakdown
    const subjectStats = {}
    practiceAttempts.forEach(p => {
      const s = p.question?.subject || 'Other'
      if (!subjectStats[s]) subjectStats[s] = { total: 0, correct: 0 }
      subjectStats[s].total += 1
      if (p.isCorrect || p.status === 'solved') subjectStats[s].correct += 1
    })

    const topicPerformance = Object.entries(subjectStats).map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempts: data.total
    }))

    // Company readiness comparison
    const companyComparison = await Promise.all(
      targetCompanies.map(async c => {
        const r = await calculateReadiness(userId, c._id)
        return {
          id: c._id,
          name: c.name,
          mark: c.mark,
          color: c.color,
          readiness: r.overallScore || 50
        }
      })
    )

    res.json({
      success: true,
      analytics: {
        currentStreak,
        totalQuestionsSolved: solvedCount,
        totalAttempts: practiceAttempts.length,
        accuracyPercentage: overallAccuracy,
        testsCompleted: testAttempts.length,
        weeklyActivity,
        topicPerformance,
        companyComparison,
        recentActivities: activities.slice(-10).reverse()
      }
    })
  } catch (error) {
    next(error)
  }
}
