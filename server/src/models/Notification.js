import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['preparation', 'mock_tests', 'placement_drives'],
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'round_unlocked',
        'readiness_milestone',
        'weak_topic',
        'preparation_progress',
        'new_assessment',
        'result_ready',
        'retake_suggestion',
        'new_drive',
        'application_deadline',
        'shortlist_update'
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    actionLabel: {
      type: String,
      default: ''
    },
    actionUrl: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    // EventKey ensures strict deduplication so identical events never duplicate
    eventKey: {
      type: String,
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

// Ensure uniqueness per recipient and event
notificationSchema.index({ recipient: 1, eventKey: 1 }, { unique: true })
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.model('Notification', notificationSchema)
