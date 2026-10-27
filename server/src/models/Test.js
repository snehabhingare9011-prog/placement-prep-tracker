import mongoose from 'mongoose'

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String,
      default: 'Software Engineer'
    },
    category: {
      type: String,
      default: 'Comprehensive'
    },
    difficulty: {
      type: String,
      enum: ['Foundation', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      }
    ],
    marksPerQuestion: {
      type: Number,
      default: 4
    },
    negativeMarking: {
      type: Number,
      default: 1
    },
    totalMarks: {
      type: Number,
      default: function () {
        return (this.questions ? this.questions.length : 0) * (this.marksPerQuestion || 4)
      }
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

export const Test = mongoose.model('Test', testSchema)
