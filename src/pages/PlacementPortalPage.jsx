import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Megaphone,
  Briefcase
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function PlacementPortalPage() {
  const { user, showToast } = useAuth()

  const [activeTab, setActiveTab] = useState('students') // 'students' | 'drives' | 'announcements'
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters for students
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('All')
  const [minCgpa, setMinCgpa] = useState('')

  // Student detail modal
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetail, setStudentDetail] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(false)

  // Create Drive Modal
  const [createDriveOpen, setCreateDriveOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [driveForm, setDriveForm] = useState({
    companyId: '',
    title: '',
    roles: 'Software Engineer',
    packageLpa: '10 - 15 LPA',
    driveDate: '',
    applicationDeadline: '',
    minCgpa: 7.0,
    branches: 'Computer Engineering, Information Technology',
    description: ''
  })
  const [creatingDrive, setCreatingDrive] = useState(false)

  // Create Announcement Modal
  const [createAnnounceOpen, setCreateAnnounceOpen] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: 'Placement Drive',
    priority: 'medium'
  })
  const [announcing, setAnnouncing] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [studentsRes, companiesRes] = await Promise.all([
          api.users.getStudents({
            search: search || undefined,
            branch: branch !== 'All' ? branch : undefined,
            minCgpa: minCgpa || undefined
          }),
          api.companies.getAll()
        ])

        if (studentsRes.success && studentsRes.students) {
          setStudents(studentsRes.students)
        }
        if (companiesRes.success && companiesRes.companies) {
          setCompanies(companiesRes.companies)
          if (companiesRes.companies.length > 0) {
            setDriveForm(prev => ({ ...prev, companyId: companiesRes.companies[0]._id }))
          }
        }
      } catch (err) {
        console.error('Failed to load portal data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [search, branch, minCgpa])

  const handleOpenStudent = async (student) => {
    setSelectedStudent(student)
    setLoadingStudent(true)
    try {
      const res = await api.users.getStudentById(student._id)
      if (res.success) {
        setStudentDetail(res)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setLoadingStudent(false)
    }
  }

  const handleCreateDriveSubmit = async (e) => {
    e.preventDefault()
    setCreatingDrive(true)
    try {
      const res = await api.placement.createDrive({
        company: driveForm.companyId,
        title: driveForm.title,
        roles: driveForm.roles.split(',').map(r => r.trim()).filter(Boolean),
        packageLpa: driveForm.packageLpa,
        driveDate: new Date(driveForm.driveDate),
        applicationDeadline: new Date(driveForm.applicationDeadline),
        description: driveForm.description,
        eligibility: {
          minCgpa: Number(driveForm.minCgpa),
          branches: driveForm.branches.split(',').map(b => b.trim()).filter(Boolean)
        }
      })
      if (res.success) {
        showToast('Campus placement drive announced successfully.', 'success')
        setCreateDriveOpen(false)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setCreatingDrive(false)
    }
  }

  const handleCreateAnnouncementSubmit = async (e) => {
    e.preventDefault()
    setAnnouncing(true)
    try {
      const res = await api.placement.createAnnouncement(announcementForm)
      if (res.success) {
        showToast('Announcement published to all student feeds.', 'success')
        setCreateAnnounceOpen(false)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setAnnouncing(false)
    }
  }

  return (
    <div className="placement-portal-page">
      <PageHeader
        eyebrow="FACULTY & PLACEMENT OFFICE"
        title="Campus Placement Portal"
        description="Search students, verify eligibility criteria, track test benchmarks, and manage on-campus placement drives."
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => setCreateAnnounceOpen(true)}
        >
          <Megaphone size={15} /> Post Announcement
        </button>
        <button
          type="button"
          className="button"
          onClick={() => setCreateDriveOpen(true)}
        >
          <Plus size={15} /> Announce Placement Drive
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="guide-tabs" style={{ marginBottom: '22px' }}>
        <button
          type="button"
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Student Directory ({students.length})
        </button>
        <button
          type="button"
          className={activeTab === 'drives' ? 'active' : ''}
          onClick={() => setActiveTab('drives')}
        >
          Manage Campus Drives
        </button>
      </div>

      {activeTab === 'students' && (
        <>
          {/* Filters Bar */}
          <div className="company-toolbar" style={{ marginBottom: '20px' }}>
            <label className="search-input">
              <Search size={16} />
              <input
                placeholder="Search student name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="select-input">
              <Filter size={16} />
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="All">All Engineering Branches</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Comm">Electronics & Comm</option>
              </select>
            </label>

            <label className="search-input" style={{ maxWidth: '170px' }}>
              <input
                type="number"
                step="0.1"
                placeholder="Min CGPA (e.g. 7.5)"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
              />
            </label>
          </div>

          {/* Students Table */}
          {loading ? (
            <SkeletonLoader rows={6} height={50} />
          ) : (
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Graduation</th>
                    <th>Target Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(std => (
                    <tr key={std._id}>
                      <td>
                        <div className="table-user-cell">
                          <span className="user-initials-mini">{std.name[0]}</span>
                          <div>
                            <strong>{std.name}</strong>
                            <small>{std.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{std.branch}</td>
                      <td><b>{std.cgpa}</b></td>
                      <td>{std.graduationYear}</td>
                      <td>
                        {std.targetCompany ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CompanyMark company={std.targetCompany} size={18} />
                            <span>{std.targetCompany.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted">Not Set</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => handleOpenStudent(std)}
                        >
                          <Eye size={12} /> Inspect Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                        No students found matching current search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'drives' && (
        <section className="guide-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Campus Placement Drives Administration</h2>
            <button
              type="button"
              className="button"
              onClick={() => setCreateDriveOpen(true)}
            >
              <Plus size={15} /> Create Drive
            </button>
          </div>
          <p>
            Campus drives configured here are instantly published to eligible students matching the CGPA threshold and branch criteria.
          </p>
        </section>
      )}

      {/* Student Inspect Modal */}
      {selectedStudent && (
        <Modal
          title={`Student Profile: ${selectedStudent.name}`}
          close={() => { setSelectedStudent(null); setStudentDetail(null) }}
          maxWidth="640px"
        >
          {loadingStudent ? (
            <SkeletonLoader rows={4} height={50} />
          ) : (
            <div className="student-inspect-content">
              <div className="inspect-header-info">
                <div>
                  <strong>{selectedStudent.name}</strong>
                  <p>{selectedStudent.email} · {selectedStudent.college}</p>
                  <span>Branch: {selectedStudent.branch} | CGPA: {selectedStudent.cgpa}</span>
                </div>
              </div>

              <div className="inspect-stats-strip">
                <div>
                  <span>Practice Solves</span>
                  <b>{studentDetail?.stats?.practiceCount || 0}</b>
                </div>
                <div>
                  <span>Tests Completed</span>
                  <b>{studentDetail?.stats?.testsCompleted || 0}</b>
                </div>
                <div>
                  <span>Curriculum Progress</span>
                  <b>{studentDetail?.stats?.roadmapProgress || 0}%</b>
                </div>
              </div>

              <h3>Recent Assessments Completed:</h3>
              {studentDetail?.recentTests?.length > 0 ? (
                <div className="mini-test-history">
                  {studentDetail.recentTests.map(t => (
                    <div key={t._id} className="history-item">
                      <span>{t.test?.title || 'Mock Assessment'}</span>
                      <b>{t.result?.percentage || 0}%</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">No completed mock tests on record yet.</p>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setSelectedStudent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Drive Modal */}
      {createDriveOpen && (
        <Modal
          title="Announce New Campus Placement Drive"
          close={() => setCreateDriveOpen(false)}
          maxWidth="620px"
        >
          <form onSubmit={handleCreateDriveSubmit} className="modal-form-fields">
            <label className="field-label">
              Company
              <select
                value={driveForm.companyId}
                onChange={(e) => setDriveForm({ ...driveForm, companyId: e.target.value })}
              >
                {companies.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Drive Title
              <input
                type="text"
                required
                placeholder="e.g. Google Campus Hiring Drive 2026"
                value={driveForm.title}
                onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
              />
            </label>

            <div className="form-grid-two">
              <label className="field-label">
                Job Roles (comma-separated)
                <input
                  type="text"
                  required
                  value={driveForm.roles}
                  onChange={(e) => setDriveForm({ ...driveForm, roles: e.target.value })}
                />
              </label>

              <label className="field-label">
                Package (CTC in LPA)
                <input
                  type="text"
                  required
                  placeholder="e.g. 12 - 18 LPA"
                  value={driveForm.packageLpa}
                  onChange={(e) => setDriveForm({ ...driveForm, packageLpa: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid-two">
              <label className="field-label">
                Drive Date
                <input
                  type="date"
                  required
                  value={driveForm.driveDate}
                  onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                />
              </label>

              <label className="field-label">
                Application Deadline
                <input
                  type="date"
                  required
                  value={driveForm.applicationDeadline}
                  onChange={(e) => setDriveForm({ ...driveForm, applicationDeadline: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid-two">
              <label className="field-label">
                Minimum CGPA Requirement
                <input
                  type="number"
                  step="0.1"
                  required
                  value={driveForm.minCgpa}
                  onChange={(e) => setDriveForm({ ...driveForm, minCgpa: e.target.value })}
                />
              </label>

              <label className="field-label">
                Eligible Branches
                <input
                  type="text"
                  required
                  value={driveForm.branches}
                  onChange={(e) => setDriveForm({ ...driveForm, branches: e.target.value })}
                />
              </label>
            </div>

            <label className="field-label">
              Description / Job Details
              <textarea
                rows={3}
                placeholder="Enter details on eligibility, recruitment process, and work expectations..."
                value={driveForm.description}
                onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreateDriveOpen(false)}
                disabled={creatingDrive}
              >
                Cancel
              </button>
              <button type="submit" className="button" disabled={creatingDrive}>
                {creatingDrive ? 'Publishing...' : 'Announce Drive'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Announcement Modal */}
      {createAnnounceOpen && (
        <Modal
          title="Publish Campus Announcement"
          close={() => setCreateAnnounceOpen(false)}
        >
          <form onSubmit={handleCreateAnnouncementSubmit} className="modal-form-fields">
            <label className="field-label">
              Announcement Title
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Pre-Placement Mock Assessment"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              />
            </label>

            <label className="field-label">
              Message Content
              <textarea
                rows={4}
                required
                placeholder="Enter detailed notice for students..."
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreateAnnounceOpen(false)}
                disabled={announcing}
              >
                Cancel
              </button>
              <button type="submit" className="button" disabled={announcing}>
                {announcing ? 'Publishing...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default PlacementPortalPage
