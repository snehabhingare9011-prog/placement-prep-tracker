import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'placement_officer', 'admin'],
      default: 'student'
    },
    college: {
      type: String,
      default: 'Apex Institute of Technology'
    },
    degree: {
      type: String,
      default: 'B.Tech'
    },
    branch: {
      type: String,
      default: 'Computer Engineering'
    },
    graduationYear: {
      type: Number,
      default: 2026
    },
    cgpa: {
      type: Number,
      default: 8.4,
      min: 0,
      max: 10
    },
    skills: {
      type: [String],
      default: ['JavaScript', 'React', 'Node.js', 'SQL', 'DSA']
    },
    targetRoles: {
      type: [String],
      default: ['Full Stack Developer', 'Software Engineer']
    },
    targetCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    currentTargetRole: {
      type: String,
      default: 'Full Stack Developer'
    },
    selectedRoles: {
      type: [String],
      default: ['Full Stack Developer', 'Software Engineer']
    },
    completedTopics: {
      type: [String],
      default: []
    },
    targetProgress: [
      {
        company: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Company'
        },
        role: {
          type: String,
          default: ''
        },
        completedTopics: {
          type: [String],
          default: []
        }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  {
    timestamps: true
  }
)

// Pre-save password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare candidate password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Clean JSON representation (exclude password and sensitive tokens)
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  return obj
}

export const User = mongoose.model('User', userSchema)
export default User
