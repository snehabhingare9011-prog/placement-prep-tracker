import { PlacementDrive } from '../models/PlacementDrive.js'
import { Announcement } from '../models/Announcement.js'
import { ActivityLog } from '../models/ActivityLog.js'

// @desc Get placement drives
// @route GET /api/v1/placement-drives
// @access Public / Private
export async function getPlacementDrives(req, res, next) {
  try {
    const { status } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status

    const drives = await PlacementDrive.find(filter)
      .populate('company', 'name code mark color website')
      .sort({ driveDate: 1 })
      .lean()

    let enriched = drives
    if (req.user) {
      enriched = drives.map(d => {
        const hasApplied = d.applications?.some(a => a.student?.toString() === req.user._id.toString())
        return {
          ...d,
          hasApplied,
          applicationCount: d.applications?.length || 0
        }
      })
    }

    res.json({
      success: true,
      count: enriched.length,
      drives: enriched
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get single placement drive details
// @route GET /api/v1/placement-drives/:id
// @access Public / Private
export async function getPlacementDriveById(req, res, next) {
  try {
    const drive = await PlacementDrive.findById(req.params.id)
      .populate('company')
      .populate('applications.student', 'name email branch graduationYear cgpa')

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' })
    }

    res.json({ success: true, drive })
  } catch (error) {
    next(error)
  }
}

// @desc Create placement drive
// @route POST /api/v1/placement-drives
// @access Private (Admin, Faculty, Placement Officer)
export async function createPlacementDrive(req, res, next) {
  try {
    const drive = await PlacementDrive.create(req.body)
    res.status(201).json({
      success: true,
      message: 'Placement drive announced successfully.',
      drive
    })
  } catch (error) {
    next(error)
  }
}

// @desc Update placement drive
// @route PATCH /api/v1/placement-drives/:id
// @access Private (Admin, Faculty, Placement Officer)
export async function updatePlacementDrive(req, res, next) {
  try {
    const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found.' })
    }
    res.json({ success: true, message: 'Drive updated.', drive })
  } catch (error) {
    next(error)
  }
}

// @desc Student applies for placement drive
// @route POST /api/v1/placement-drives/:id/apply
// @access Private (Student)
export async function applyForDrive(req, res, next) {
  try {
    const drive = await PlacementDrive.findById(req.params.id)
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found.' })
    }

    const alreadyApplied = drive.applications.some(
      a => a.student.toString() === req.user._id.toString()
    )

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this placement drive.'
      })
    }

    // Check CGPA eligibility
    if (drive.eligibility?.minCgpa && req.user.cgpa < drive.eligibility.minCgpa) {
      return res.status(400).json({
        success: false,
        message: `Eligibility criteria not met: Minimum CGPA of ${drive.eligibility.minCgpa} required. Your CGPA is ${req.user.cgpa}.`
      })
    }

    drive.applications.push({
      student: req.user._id,
      appliedAt: new Date(),
      status: 'applied'
    })
    await drive.save()

    await ActivityLog.create({
      user: req.user._id,
      activityType: 'target_change',
      title: `Applied for drive: ${drive.title}`,
      subject: 'Placement Drive'
    })

    res.json({
      success: true,
      message: 'Application registered successfully.'
    })
  } catch (error) {
    next(error)
  }
}

// @desc Get announcements
// @route GET /api/v1/announcements
// @access Public / Private
export async function getAnnouncements(req, res, next) {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, count: announcements.length, announcements })
  } catch (error) {
    next(error)
  }
}

// @desc Create announcement
// @route POST /api/v1/announcements
// @access Private (Admin, Faculty, Placement Officer)
export async function createAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      author: req.user._id,
      authorName: req.user.name
    })

    res.status(201).json({
      success: true,
      message: 'Announcement published.',
      announcement
    })
  } catch (error) {
    next(error)
  }
}

// @desc Delete announcement
// @route DELETE /api/v1/announcements/:id
// @access Private (Admin)
export async function deleteAnnouncement(req, res, next) {
  try {
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Announcement deleted.' })
  } catch (error) {
    next(error)
  }
}
