import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true
    },
    statement: {
      type: String,
      required: [true, 'Question statement is required']
    },
    category: {
      type: String,
      enum: ['DSA', 'Core CS', 'Aptitude', 'Technical', 'HR'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'code-practice', 'short-answer', 'descriptive'],
      default: 'multiple-choice'
    },
    options: {
      type: [String],
      default: []
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    explanation: {
      type: String,
      default: ''
    },
    examples: {
      type: String,
      default: ''
    },
    constraints: {
      type: String,
      default: ''
    },
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
      }
    ],
    roles: {
      type: [String],
      default: []
    },
    estimatedTimeMinutes: {
      type: Number,
      default: 15
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

questionSchema.index({ category: 1, subject: 1, difficulty: 1 })
questionSchema.index({ title: 'text', statement: 'text', topic: 'text' })

export const Question = mongoose.model('Question', questionSchema)
