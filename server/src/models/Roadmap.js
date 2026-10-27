import mongoose from 'mongoose'

const roadmapTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  detail: { type: String, default: '' },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  estimatedMinutes: { type: Number, default: 30 },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
})

const roadmapPhaseSchema = new mongoose.Schema({
  phaseNumber: { type: Number, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  tasks: [roadmapTaskSchema]
})

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String,
      required: true,
      default: 'Software Engineer'
    },
    availableWeeks: {
      type: Number,
      default: 8
    },
    targetDate: {
      type: Date
    },
    phases: [roadmapPhaseSchema],
    progressPercentage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

roadmapSchema.index({ user: 1, company: 1, role: 1 })

export const Roadmap = mongoose.model('Roadmap', roadmapSchema)
