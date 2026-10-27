import mongoose from 'mongoose'

const recruitmentRoundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String },
  roundType: {
    type: String,
    enum: ['Online Assessment', 'Technical Interview', 'HR Interview', 'Managerial', 'System Design', 'Other'],
    default: 'Technical Interview'
  }
})

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    industry: {
      type: String,
      default: 'Technology & Software'
    },
    website: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    mark: {
      type: String,
      default: 'C'
    },
    color: {
      type: String,
      default: '#1769d1'
    },
    difficulty: {
      type: String,
      enum: ['Foundation', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    roles: {
      type: [String],
      default: ['Software Engineer']
    },
    recruitmentRounds: [recruitmentRoundSchema],
    eligibilityCriteria: {
      minCgpa: { type: Number, default: 7.0 },
      allowedBranches: { type: [String], default: ['Computer Engineering', 'Information Technology', 'Electronics & Comm'] },
      graduationYears: { type: [Number], default: [2026, 2027] }
    },
    requiredSkills: {
      type: [String],
      default: ['DSA', 'Core CS', 'Aptitude', 'SQL']
    },
    frequentlyTestedSubjects: {
      type: [String],
      default: ['DSA', 'DBMS', 'OS', 'Aptitude', 'System Design']
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

export const Company = mongoose.model('Company', companySchema)
export default Company
