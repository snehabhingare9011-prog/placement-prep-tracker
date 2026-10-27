import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required']
    },
    category: {
      type: String,
      enum: ['Placement Drive', 'Mock Test', 'Roadmap Update', 'General', 'Workshop'],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'final_year', 'third_year'],
      default: 'all'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authorName: {
      type: String,
      default: 'Placement Officer'
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

export const Announcement = mongoose.model('Announcement', announcementSchema)
