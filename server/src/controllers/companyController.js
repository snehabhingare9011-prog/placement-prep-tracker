import { Company } from '../models/Company.js'
import { JobRole } from '../models/JobRole.js'
import { Question } from '../models/Question.js'
import { Test } from '../models/Test.js'
import { PlacementDrive } from '../models/PlacementDrive.js'
import { calculateReadiness } from '../services/readinessService.js'

// @desc Get all companies
// @route GET /api/v1/companies
// @access Public / Private
export async function getCompanies(req, res, next) {
  try {
    const { search, difficulty, industry } = req.query
    const filter = { isActive: true }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roles: { $regex: search, $options: 'i' } },
        { requiredSkills: { $regex: search, $options: 'i' } }
      ]
    }
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty
    }
    if (industry && industry !== 'All') {
      filter.industry = industry
    }

    const companies = await Company.find(filter).sort({ name: 1 })

    // If user is authenticated, attach personalized company readiness if available
    let enriched = companies.map(c => c.toObject())
    if (req.user) {
      enriched = await Promise.all(
        companies.map(async c => {
          const readiness = await calculateReadiness(req.user._id, c._id)
          return {
            ...c.toObject(),
            userReadiness: readiness.hasEnoughData ? readiness.overallScore : null
          }
        })
      )
    }

    res.json({
      success: true,
      count: enriched.length,
      companies: enriched
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get single company details with linked roles, tests, questions, and drives
// @route GET /api/v1/companies/:id
// @access Public / Private
export async function getCompanyById(req, res, next) {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { code: req.params.id.toLowerCase() }

    const company = await Company.findOne(query)
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      })
    }

    const [roles, questions, tests, drives] = await Promise.all([
      JobRole.find({ company: company._id, isActive: true }),
      Question.find({ companies: company._id, isPublished: true })
        .select('-correctAnswer')
        .limit(10),
      Test.find({ company: company._id, isPublished: true }).limit(5),
      PlacementDrive.find({ company: company._id }).sort({ driveDate: 1 }).limit(3)
    ])

    let userProgress = null
    if (req.user) {
      userProgress = await calculateReadiness(req.user._id, company._id)
    }

    res.json({
      success: true,
      company,
      roles,
      questions,
      tests,
      drives,
      userProgress
    })
  } catch (error) {
    next(error)
  }
}

// @desc Create new company
// @route POST /api/v1/companies
// @access Private (Admin)
export async function createCompany(req, res, next) {
  try {
    const {
      name,
      code,
      description,
      industry,
      website,
      logoUrl,
      mark,
      color,
      difficulty,
      roles,
      recruitmentRounds,
      eligibilityCriteria,
      requiredSkills,
      frequentlyTestedSubjects
    } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' })
    }

    const generatedCode = code || name.toLowerCase().replace(/[^a-z0-9]/g, '')

    const company = await Company.create({
      name,
      code: generatedCode,
      description,
      industry,
      website,
      logoUrl,
      mark: mark || name[0].toUpperCase(),
      color: color || '#1769d1',
      difficulty: difficulty || 'Intermediate',
      roles: Array.isArray(roles) ? roles : ['Software Engineer'],
      recruitmentRounds: recruitmentRounds || [],
      eligibilityCriteria: eligibilityCriteria || {},
      requiredSkills: requiredSkills || [],
      frequentlyTestedSubjects: frequentlyTestedSubjects || ['DSA', 'DBMS', 'OS', 'Aptitude']
    })

    res.status(201).json({
      success: true,
      message: 'Company created successfully.',
      company
    })
  } catch (error) {
    next(error)
  }
}

// @desc Update company
// @route PATCH /api/v1/companies/:id
// @access Private (Admin)
export async function updateCompany(req, res, next) {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' })
    }

    res.json({
      success: true,
      message: 'Company updated successfully.',
      company
    })
  } catch (error) {
    next(error)
  }
}

// @desc Delete / Archive company
// @route DELETE /api/v1/companies/:id
// @access Private (Admin)
export async function deleteCompany(req, res, next) {
  try {
    const company = await Company.findById(req.params.id)
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' })
    }

    company.isActive = false
    await company.save()

    res.json({
      success: true,
      message: 'Company archived successfully.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get company roles
// @route GET /api/v1/companies/:id/roles
// @access Public / Private
export async function getCompanyRoles(req, res, next) {
  try {
    const roles = await JobRole.find({ company: req.params.id, isActive: true })
    res.json({ success: true, roles })
  } catch (error) {
    next(error)
  }
}
