import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function PlacementDrivesPage() {
  const { user, showToast } = useAuth()
  const [searchParams] = useSearchParams()
  const targetDriveId = searchParams.get('driveId')

  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'upcoming' | 'ongoing'
  const [applyingId, setApplyingId] = useState(null)

  useEffect(() => {
    async function loadDrives() {
      setLoading(true)
      try {
        const res = await api.placement.getDrives({
          status: statusFilter !== 'all' ? statusFilter : undefined
        })
        if (res.success && res.drives) {
          setDrives(res.drives)
        }
      } catch (err) {
        console.error('Failed to load drives:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDrives()
  }, [statusFilter])

  // Scroll to targeted drive if driveId provided in query param
  useEffect(() => {
    if (targetDriveId && drives.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`drive-${targetDriveId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [targetDriveId, drives])

  const handleApply = async (driveId) => {
    setApplyingId(driveId)
    try {
      const res = await api.placement.applyDrive(driveId)
      if (res.success) {
        showToast(res.message, 'success')
        setDrives(prev =>
          prev.map(d => (d._id === driveId ? { ...d, hasApplied: true, applicationCount: (d.applicationCount || 0) + 1 } : d))
        )
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div className="placement-drives-page">
      <PageHeader
        eyebrow="CAMPUS RECRUITMENT"
        title="Placement Drives"
        description="Official campus placement drives, registration deadlines, eligibility checks, and application tracking."
      />

      {/* Filter strip */}
      <div className="drives-filter-bar">
        <label className="select-input">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming Drives</option>
            <option value="ongoing">Ongoing Drives</option>
            <option value="completed">Completed Drives</option>
          </select>
        </label>
        <span className="results-count">Showing <b>{drives.length}</b> drives</span>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} height={140} />
      ) : (
        <div className="drives-cards-list">
          {drives.map(drive => {
            const minCgpa = drive.eligibility?.minCgpa || 7.0
            const userCgpa = user?.cgpa || 8.0
            const isEligible = userCgpa >= minCgpa

            return (
              <article
                key={drive._id}
                id={`drive-${drive._id}`}
                className={`drive-card ${targetDriveId === drive._id ? 'drive-card-highlighted' : ''}`}
              >
                <div className="drive-card-header">
                  <div className="drive-company-badge">
                    <CompanyMark company={drive.company} large />
                    <div>
                      <h2>{drive.title}</h2>
                      <span className="drive-company-name">{drive.company?.name}</span>
                    </div>
                  </div>

                  <div className="drive-status-badge-wrap">
                    <span className={`status-pill ${drive.status}`}>
                      {drive.status.toUpperCase()}
                    </span>
                    {drive.hasApplied && (
                      <span className="status-pill applied">
                        <CheckCircle2 size={13} /> Applied
                      </span>
                    )}
                  </div>
                </div>

                <p className="drive-desc">{drive.description}</p>

                <div className="drive-details-grid">
                  <div>
                    <span>Offered Package</span>
                    <strong>{drive.packageLpa}</strong>
                  </div>
                  <div>
                    <span>Drive Date</span>
                    <strong>{new Date(drive.driveDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span>Application Deadline</span>
                    <strong>{new Date(drive.applicationDeadline).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span>Eligibility Criteria</span>
                    <strong className={isEligible ? 'text-green' : 'text-red'}>
                      Min CGPA: {minCgpa} (Your CGPA: {userCgpa})
                    </strong>
                  </div>
                </div>

                <div className="drive-allowed-branches">
                  <span>Eligible Branches:</span>
                  <div className="branch-tags">
                    {drive.eligibility?.branches?.map(b => (
                      <span key={b}>{b}</span>
                    ))}
                  </div>
                </div>

                <div className="drive-card-footer">
                  <span className="applicant-count">
                    <b>{drive.applicationCount || 0}</b> students applied
                  </span>

                  {user?.role === 'student' && (
                    <button
                      type="button"
                      className={`button ${drive.hasApplied ? 'secondary' : ''}`}
                      disabled={drive.hasApplied || applyingId === drive._id || !isEligible}
                      onClick={() => handleApply(drive._id)}
                    >
                      {drive.hasApplied
                        ? 'Application Registered'
                        : !isEligible
                        ? 'CGPA Criteria Not Met'
                        : applyingId === drive._id
                        ? 'Submitting...'
                        : 'Register for Drive'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}

          {drives.length === 0 && (
            <p className="empty-copy">No placement drives found matching filter criteria.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default PlacementDrivesPage
