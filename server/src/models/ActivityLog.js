import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    activityType: {
      type: String,
      enum: ['practice_solve', 'practice_attempt', 'mock_test_complete', 'roadmap_task', 'target_change', 'login'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      default: 'General'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

activityLogSchema.index({ user: 1, createdAt: -1 })

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
