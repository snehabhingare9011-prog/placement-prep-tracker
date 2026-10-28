import * as notificationService from '../services/notificationService.js'

// @desc Get current student notifications
// @route GET /api/v1/notifications
// @access Private (Student / Staff)
export async function getNotifications(req, res, next) {
  try {
    const { category, limit, page } = req.query
    const result = await notificationService.getNotifications(req.user, { category, limit, page })
    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
}

// @desc Mark single notification as read
// @route PATCH /api/v1/notifications/:id/read
// @access Private
export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params
    const result = await notificationService.markAsRead(req.user._id, id)
    if (!result.notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' })
    }
    res.json({
      success: true,
      notification: result.notification,
      unreadCount: result.unreadCount
    })
  } catch (error) {
    next(error)
  }
}

// @desc Mark all notifications as read
// @route PATCH /api/v1/notifications/read-all
// @access Private
export async function markAllNotificationsRead(req, res, next) {
  try {
    const category = req.body?.category || req.query?.category
    const result = await notificationService.markAllAsRead(req.user._id, category)
    res.json({
      success: true,
      message: 'Notifications marked as read.',
      unreadCount: result.unreadCount
    })
  } catch (error) {
    next(error)
  }
}
