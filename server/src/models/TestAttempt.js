import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: mongoose.Schema.Types.Mixed, // number for MCQ index or string
      default: null
    },
    markedForReview: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
)

const subjectScoreSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    totalQuestions: { type: Number, default: 0 },
    correctQuestions: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  { _id: false }
)

const testAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    durationMinutes: {
      type: Number,
      required: true
    },
    expiryTime: {
      type: Date,
      required: true
    },
    submittedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'expired'],
      default: 'in_progress'
    },
    answers: [answerSchema],
    result: {
      score: { type: Number, default: 0 },
      maxScore: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
      incorrectCount: { type: Number, default: 0 },
      unansweredCount: { type: Number, default: 0 },
      timeTakenSeconds: { type: Number, default: 0 },
      subjectBreakdown: [subjectScoreSchema],
      weakTopics: [String]
    }
  },
  {
    timestamps: true
  }
)

testAttemptSchema.index({ user: 1, test: 1, status: 1 })

export const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema)
