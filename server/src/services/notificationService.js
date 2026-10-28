import mongoose from 'mongoose'
import { Notification } from '../models/Notification.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Test } from '../models/Test.js'
import { Roadmap } from '../models/Roadmap.js'
import { PlacementDrive } from '../models/PlacementDrive.js'
import { User } from '../models/User.js'
import { calculateReadiness } from './readinessService.js'
import { mapQuestionAreaToHubTopic } from './mockTestInsightsService.js'

/**
 * Safely create a notification if it doesn't already exist for this user & eventKey
 */
export async function createNotificationIfAbsent(data) {
  if (mongoose.connection.readyState !== 1) return null
  try {
    const existing = await Notification.findOne({
      recipient: data.recipient,
      eventKey: data.eventKey
    })
    if (existing) {
      return existing
    }
    return await Notification.create(data)
  } catch (err) {
    // Catch duplicate key errors gracefully due to race condition
    if (err.code === 11000) {
      return await Notification.findOne({
        recipient: data.recipient,
        eventKey: data.eventKey
      })
    }
    console.error('Failed to create notification:', err.message)
    return null
  }
}

/**
 * Synchronize real notifications for a student based strictly on actual saved progress,
 * mock test attempts, roadmap state, and placement drives.
 */
export async function syncRealNotificationsForUser(user) {
  if (!user || !user._id) return
  if (mongoose.connection.readyState !== 1) return

  const userId = user._id
  const targetCompanyId = user.targetCompany?._id || user.targetCompany
  const targetRole = user.currentTargetRole || 'Software Engineer'
  const companyName = user.targetCompany?.name || 'Target Goal'

  // 1. Sync from actual saved Test Attempts
  const completedAttempts = await TestAttempt.find({ user: userId, status: 'completed' })
    .populate('test', 'title role company durationMinutes questionCount')
    .sort({ createdAt: -1 })
    .lean()
    .catch(() => [])

  for (const attempt of completedAttempts) {
    const testTitle = attempt.test?.title || 'Mock Assessment'
    const resultPct = attempt.result?.percentage !== undefined
      ? attempt.result.percentage
      : Math.round(((attempt.score || 0) / (attempt.totalMarks || 1)) * 100)
    const correctCount = attempt.result?.correctCount || 0
    const weakTopics = attempt.result?.weakTopics || []

    // A. Assessment Result Ready
    await createNotificationIfAbsent({
      recipient: userId,
      category: 'mock_tests',
      type: 'result_ready',
      title: `Assessment Outcome: ${testTitle}`,
      message: `Your attempt has been evaluated with ${resultPct}% score (${correctCount} correct). Detailed solution explanations are ready for review.`,
      actionLabel: 'Review Solutions',
      actionUrl: `/mock-result/${attempt._id}`,
      eventKey: `test_result_${attempt._id}`,
      createdAt: attempt.completedAt || attempt.createdAt || new Date(),
      metadata: { attemptId: attempt._id, testId: attempt.test?._id }
    })

    // B. Weak Topic practice suggestion
    if (weakTopics.length > 0) {
      const primaryWeak = weakTopics[0]
      const hubTopic = mapQuestionAreaToHubTopic(primaryWeak)
      const topicUrl = hubTopic ? `/company-prep?topic=${hubTopic.id}` : '/company-prep'

      await createNotificationIfAbsent({
        recipient: userId,
        category: 'preparation',
        type: 'weak_topic',
        title: `Target Practice: ${primaryWeak}`,
        message: `Your assessment on "${testTitle}" highlighted ${weakTopics.slice(0, 2).join(', ')} as key areas to reinforce in your preparation hub.`,
        actionLabel: 'Study Topic',
        actionUrl: topicUrl,
        eventKey: `weak_topic_${attempt._id}_${primaryWeak.toLowerCase().replace(/\s+/g, '_')}`,
        createdAt: attempt.completedAt || attempt.createdAt || new Date(),
        metadata: { weakTopic: primaryWeak, attemptId: attempt._id, hubTopicId: hubTopic?.id }
      })
    }

    // C. Retake Suggestion if score is below 70%
    if (resultPct < 70) {
      await createNotificationIfAbsent({
        recipient: userId,
        category: 'mock_tests',
        type: 'retake_suggestion',
        title: `Retake Suggestion: ${testTitle}`,
        message: `Reinforce your weaker concepts and take a timed retake of ${testTitle} to elevate your verified target accuracy.`,
        actionLabel: 'Retake Assessment',
        actionUrl: attempt.test?._id ? `/mock-tests?testId=${attempt.test._id}` : '/mock-tests',
        eventKey: `retake_suggest_${attempt._id}`,
        createdAt: attempt.completedAt || attempt.createdAt || new Date(),
        metadata: { testId: attempt.test?._id }
      })
    }
  }

  // 2. Sync from actual Roadmap & Topic Completion
  if (targetCompanyId) {
    const roadmap = await Roadmap.findOne({ user: userId, company: targetCompanyId }).lean().catch(() => null)
    if (roadmap && Array.isArray(roadmap.phases)) {
      for (let idx = 0; idx < roadmap.phases.length; idx++) {
        const phase = roadmap.phases[idx]
        const tasks = phase.tasks || []
        const isPhaseComplete = tasks.length > 0 && tasks.every(t => t.completed)
        if (isPhaseComplete && idx + 1 < roadmap.phases.length) {
          const nextPhase = roadmap.phases[idx + 1]
          const roundNum = nextPhase.roundNumber || (idx + 2)
          await createNotificationIfAbsent({
            recipient: userId,
            category: 'preparation',
            type: 'round_unlocked',
            title: `Stage Unlocked: ${nextPhase.title.replace(/^Phase\s*\d+:\s*/i, '')}`,
            message: `Milestone achieved! Completing all topics in ${phase.title.replace(/^Phase\s*\d+:\s*/i, '')} has unlocked your next interview stage.`,
            actionLabel: 'View Roadmap',
            actionUrl: `/roadmap?round=${roundNum}`,
            eventKey: `round_unlocked_phase_${idx + 1}_${roadmap._id}`,
            createdAt: phase.completedAt || new Date(),
            metadata: { unlockedPhaseIndex: idx + 1, roundNumber: roundNum, roadmapId: roadmap._id }
          })
        }
      }
    }

    // Readiness Score milestone
    try {
      const readinessData = await calculateReadiness(userId, targetCompanyId, targetRole)
      const readinessScore = readinessData?.overallScore || 0
      if (readinessScore >= 70) {
        await createNotificationIfAbsent({
          recipient: userId,
          category: 'preparation',
          type: 'readiness_milestone',
          title: `Milestone: 70%+ Verified Readiness`,
          message: `Your readiness score for ${companyName} (${targetRole}) reached ${readinessScore}%. Your profile meets interview eligibility standards.`,
          actionLabel: 'View Analytics',
          actionUrl: '/readiness',
          eventKey: `readiness_milestone_70_${targetCompanyId}_${userId}`,
          metadata: { readinessScore }
        })
      }
    } catch (e) {
      // Non-blocking
    }

    // Published Mock Assessments available for target company
    const targetTests = await Test.find({
      company: targetCompanyId,
      isPublished: true
    }).lean().catch(() => [])

    for (const test of targetTests) {
      await createNotificationIfAbsent({
        recipient: userId,
        category: 'mock_tests',
        type: 'new_assessment',
        title: `Assessment Live: ${test.title}`,
        message: `A published ${test.durationMinutes}-minute mock test (${test.questionCount} questions) is available for ${companyName}.`,
        actionLabel: 'Start Assessment',
        actionUrl: '/mock-tests',
        eventKey: `test_published_${test._id}`,
        createdAt: test.createdAt || new Date(),
        metadata: { testId: test._id }
      })
    }
  }

  // 3. Sync from actual Placement Drives
  const activeDrives = await PlacementDrive.find({
    status: { $in: ['upcoming', 'ongoing'] }
  })
    .populate('company', 'name')
    .sort({ driveDate: 1 })
    .lean()
    .catch(() => [])

  const now = new Date()

  for (const drive of activeDrives) {
    const driveCompanyName = drive.company?.name || 'Campus Partner'

    // Drive Announced notification
    await createNotificationIfAbsent({
      recipient: userId,
      category: 'placement_drives',
      type: 'new_drive',
      title: `Campus Drive: ${drive.title}`,
      message: `${driveCompanyName} announced a placement drive offering ${drive.packageLpa}. Applications close on ${new Date(drive.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
      actionLabel: 'View Drive Details',
      actionUrl: `/placement-drives?driveId=${drive._id}`,
      eventKey: `drive_announced_${drive._id}`,
      createdAt: drive.createdAt || new Date(),
      metadata: { driveId: drive._id }
    })

    // Upcoming Application Deadline (within next 7 days and not expired)
    const deadline = new Date(drive.applicationDeadline)
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0 && diffDays <= 7) {
      await createNotificationIfAbsent({
        recipient: userId,
        category: 'placement_drives',
        type: 'application_deadline',
        title: `Deadline Approaching: ${drive.title}`,
        message: `Applications for ${drive.title} close in ${diffDays === 0 ? 'less than 24 hours' : `${diffDays} day${diffDays === 1 ? '' : 's'}`}. Ensure your application is submitted on time.`,
        actionLabel: 'Apply Now',
        actionUrl: `/placement-drives?driveId=${drive._id}`,
        eventKey: `drive_deadline_${drive._id}`,
        metadata: { driveId: drive._id, deadline: drive.applicationDeadline }
      })
    }

    // Check student application status (shortlisted / selected)
    const studentApp = (drive.applications || []).find(
      app => app.student?.toString() === userId.toString()
    )
    if (studentApp && (studentApp.status === 'shortlisted' || studentApp.status === 'selected')) {
      await createNotificationIfAbsent({
        recipient: userId,
        category: 'placement_drives',
        type: 'shortlist_update',
        title: `Shortlist Update: ${studentApp.status === 'selected' ? 'Selected' : 'Shortlisted'}!`,
        message: `Great news! You have been ${studentApp.status} for ${drive.title} (${driveCompanyName}).`,
        actionLabel: 'View Application',
        actionUrl: `/placement-drives?driveId=${drive._id}`,
        eventKey: `shortlist_${drive._id}_${studentApp.status}`,
        createdAt: studentApp.appliedAt || new Date(),
        metadata: { driveId: drive._id, status: studentApp.status }
      })
    }
  }
}

/**
 * Fetch notifications with filters, pagination, and category unread counts
 */
export async function getNotifications(user, options = {}) {
  await syncRealNotificationsForUser(user)

  const userId = user._id
  const { category, limit = 20, page = 1 } = options
  const filter = { recipient: userId }

  if (category && category !== 'all') {
    filter.category = category
  }

  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const parsedPage = Math.max(1, parseInt(page, 10) || 1)
  const skip = (parsedPage - 1) * parsedLimit

  const [notifications, totalCount, totalUnread, prepUnread, mockUnread, driveUnread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId, category: 'preparation', isRead: false }),
    Notification.countDocuments({ recipient: userId, category: 'mock_tests', isRead: false }),
    Notification.countDocuments({ recipient: userId, category: 'placement_drives', isRead: false })
  ])

  return {
    notifications,
    totalCount,
    unreadCount: totalUnread,
    categoryUnread: {
      all: totalUnread,
      preparation: prepUnread,
      mock_tests: mockUnread,
      placement_drives: driveUnread
    },
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(totalCount / parsedLimit) || 1
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  ).lean()

  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })
  return { notification, unreadCount }
}

/**
 * Mark all notifications as read for a student
 */
export async function markAllAsRead(userId, category) {
  const filter = { recipient: userId, isRead: false }
  if (category && category !== 'all') {
    filter.category = category
  }

  await Notification.updateMany(filter, { isRead: true, readAt: new Date() })
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })
  return { unreadCount }
}
