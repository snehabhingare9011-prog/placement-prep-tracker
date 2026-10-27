import mongoose from 'mongoose'

const driveApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'selected', 'rejected'],
    default: 'applied'
  },
  notes: {
    type: String,
    default: ''
  }
})

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Placement drive title is required'],
      trim: true
    },
    roles: {
      type: [String],
      default: ['Software Engineer']
    },
    packageLpa: {
      type: String,
      default: '8 - 14 LPA'
    },
    driveDate: {
      type: Date,
      required: true
    },
    applicationDeadline: {
      type: Date,
      required: true
    },
    venue: {
      type: String,
      default: 'Campus Placement Cell & Virtual'
    },
    eligibility: {
      minCgpa: { type: Number, default: 7.0 },
      branches: { type: [String], default: ['Computer Engineering', 'Information Technology'] },
      graduationYears: { type: [Number], default: [2026] }
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    description: {
      type: String,
      default: ''
    },
    applications: [driveApplicationSchema]
  },
  {
    timestamps: true
  }
)

export const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema)
