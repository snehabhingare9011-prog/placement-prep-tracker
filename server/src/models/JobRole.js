import mongoose from 'mongoose'

const jobRoleSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Role title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    subjectWeights: [
      {
        subject: { type: String, required: true },
        weight: { type: Number, default: 20 }
      }
    ],
    eligibility: {
      minCgpa: { type: Number, default: 7.0 },
      branches: { type: [String], default: [] }
    },
    packageLpa: {
      type: String,
      default: '8 - 14 LPA'
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

export const JobRole = mongoose.model('JobRole', jobRoleSchema)
