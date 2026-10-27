import mongoose from 'mongoose'

const savedQuestionSchema = new mongoose.Schema(
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
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

savedQuestionSchema.index({ user: 1, question: 1 }, { unique: true })

export const SavedQuestion = mongoose.model('SavedQuestion', savedQuestionSchema)
