import mongoose from 'mongoose'

const practiceAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    submittedAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['solved', 'attempted', 'reviewed'],
      default: 'attempted'
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

practiceAttemptSchema.index({ user: 1, question: 1 })

export const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema)
