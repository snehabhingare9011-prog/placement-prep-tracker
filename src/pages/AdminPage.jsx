import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Users,
  Building2,
  Code2,
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function AdminPage() {
  const { showToast } = useAuth()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'users' | 'questions' | 'companies'
  const [loading, setLoading] = useState(true)
  const [overviewStats, setOverviewStats] = useState(null)
  const [users, setUsers] = useState([])
  const [questions, setQuestions] = useState([])
  const [companies, setCompanies] = useState([])

  // User search/filter
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  // Create Question Modal
  const [createQModalOpen, setCreateQModalOpen] = useState(false)
  const [qForm, setQForm] = useState({
    title: '',
    statement: '',
    category: 'DSA',
    subject: 'DSA',
    topic: 'Arrays',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    optionsText: 'Option A\nOption B\nOption C\nOption D',
    correctAnswer: 0,
    explanation: ''
  })
  const [creatingQ, setCreatingQ] = useState(false)

  // Create Company Modal
  const [createCoModalOpen, setCreateCoModalOpen] = useState(false)
  const [coForm, setCoForm] = useState({
    name: '',
    industry: 'Technology',
    difficulty: 'Intermediate',
    roles: 'Software Engineer, Full Stack Developer',
    requiredSkills: 'DSA, DBMS, SQL, OS',
    description: ''
  })
  const [creatingCo, setCreatingCo] = useState(false)

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true)
      try {
        const [overviewRes, usersRes, questionsRes, companiesRes] = await Promise.all([
          api.admin.getOverview(),
          api.admin.getUsers({
            search: userSearch || undefined,
            role: roleFilter !== 'All' ? roleFilter : undefined
          }),
          api.questions.getAll({ limit: 50 }),
          api.companies.getAll()
        ])

        if (overviewRes.success) setOverviewStats(overviewRes)
        if (usersRes.success) setUsers(usersRes.users)
        if (questionsRes.success) setQuestions(questionsRes.questions)
        if (companiesRes.success) setCompanies(companiesRes.companies)
      } catch (err) {
        console.error('Failed to load admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminData()
  }, [userSearch, roleFilter])

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await api.admin.updateUser(user._id, { status: nextStatus })
      if (res.success) {
        showToast(`User marked ${nextStatus}`, 'success')
        setUsers(prev => prev.map(u => (u._id === user._id ? { ...u, status: nextStatus } : u)))
      }
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const res = await api.admin.updateUser(userId, { role: newRole })
      if (res.success) {
        showToast(`User role updated to ${newRole}`, 'success')
        setUsers(prev => prev.map(u => (u._id === userId ? { ...u, role: newRole } : u)))
      }
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleCreateQuestionSubmit = async (e) => {
    e.preventDefault()
    setCreatingQ(true)
    try {
      const options = qForm.optionsText.split('\n').map(o => o.trim()).filter(Boolean)
      const res = await api.questions.create({
        title: qForm.title,
        statement: qForm.statement,
        category: qForm.category,
        subject: qForm.subject,
        topic: qForm.topic,
        difficulty: qForm.difficulty,
        questionType: qForm.questionType,
        options,
        correctAnswer: Number(qForm.correctAnswer),
        explanation: qForm.explanation
      })
      if (res.success) {
        showToast('Question created and published to bank.', 'success')
        setQuestions([res.question, ...questions])
        setCreateQModalOpen(false)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setCreatingQ(false)
    }
  }

  const handleCreateCompanySubmit = async (e) => {
    e.preventDefault()
    setCreatingCo(true)
    try {
      const roles = coForm.roles.split(',').map(r => r.trim()).filter(Boolean)
      const requiredSkills = coForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await api.companies.create({
        name: coForm.name,
        industry: coForm.industry,
        difficulty: coForm.difficulty,
        roles,
        requiredSkills,
        description: coForm.description
      })
      if (res.success) {
        showToast('Company added to system.', 'success')
        setCompanies([res.company, ...companies])
        setCreateCoModalOpen(false)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setCreatingCo(false)
    }
  }

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await api.questions.delete(id)
      setQuestions(prev => prev.filter(q => q._id !== id))
      showToast('Question deleted.', 'info')
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="PLATFORM ADMINISTRATION"
        title="Admin Workspace"
        description="Database-backed administrative controls for user accounts, role permissions, companies, and question bank content."
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => setCreateCoModalOpen(true)}
        >
          <Plus size={15} /> Add Company
        </button>
        <button
          type="button"
          className="button"
          onClick={() => setCreateQModalOpen(true)}
        >
          <Plus size={15} /> Add Question
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="guide-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview Metrics
        </button>
        <button
          type="button"
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Accounts ({users.length})
        </button>
        <button
          type="button"
          className={activeTab === 'questions' ? 'active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          Question Bank ({questions.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <>
          <section className="progress-summary-grid">
            <article className="metric-card blue">
              <span>REGISTERED USERS</span>
              <b>{overviewStats?.stats?.totalUsers || 0}</b>
              <small>{overviewStats?.stats?.totalStudents || 0} Students</small>
            </article>
            <article className="metric-card green">
              <span>ACTIVE COMPANIES</span>
              <b>{overviewStats?.stats?.totalCompanies || 0}</b>
              <small>Campus Blueprints</small>
            </article>
            <article className="metric-card orange">
              <span>QUESTION BANK</span>
              <b>{overviewStats?.stats?.totalQuestions || 0}</b>
              <small>Categorized items</small>
            </article>
            <article className="metric-card blue">
              <span>MOCK ASSESSMENTS</span>
              <b>{overviewStats?.stats?.totalTests || 0}</b>
              <small>{overviewStats?.stats?.totalAttempts || 0} attempts completed</small>
            </article>
          </section>

          <section className="admin-layout" style={{ marginTop: '24px' }}>
            <article className="section-panel">
              <h2>Recent Test Submissions</h2>
              <div className="activity-table">
                {overviewStats?.recentAttempts?.map(att => (
                  <div key={att._id} className="log-row">
                    <div className="log-dot"><CheckCircle2 size={14} /></div>
                    <div>
                      <b>{att.user?.name} · {att.test?.title}</b>
                      <span>{att.user?.branch} · Score: {att.result?.percentage}%</span>
                    </div>
                    <em>{new Date(att.submittedAt).toLocaleTimeString()}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="section-panel">
              <h2>Recent Registrations</h2>
              <div className="activity-table">
                {overviewStats?.recentUsers?.map(u => (
                  <div key={u._id} className="log-row">
                    <div className="log-dot"><Users size={14} /></div>
                    <div>
                      <b>{u.name}</b>
                      <span>{u.email} · {u.branch || u.role}</span>
                    </div>
                    <em>{u.role}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      {/* Tab 2: User Accounts */}
      {activeTab === 'users' && (
        <section className="section-panel">
          <div className="company-toolbar" style={{ marginBottom: '18px' }}>
            <label className="search-input">
              <Search size={16} />
              <input
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </label>

            <label className="select-input">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="placement_officer">Placement Officer</option>
                <option value="faculty">Faculty Mentor</option>
                <option value="admin">System Administrator</option>
              </select>
            </label>
          </div>

          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Assign Role</th>
                  <th>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{u.email}</small>
                    </td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td>
                      <span className={`status-pill ${u.status}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u._id, e.target.value)}
                        className="table-role-select"
                      >
                        <option value="student">Student</option>
                        <option value="placement_officer">Placement Officer</option>
                        <option value="faculty">Faculty Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`button text-btn ${u.status === 'active' ? 'text-red' : 'text-green'}`}
                        onClick={() => handleToggleUserStatus(u)}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Questions */}
      {activeTab === 'questions' && (
        <section className="section-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Question Bank Repository</h2>
            <button
              type="button"
              className="button"
              onClick={() => setCreateQModalOpen(true)}
            >
              <Plus size={15} /> Add New Question
            </button>
          </div>

          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question Title</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q._id}>
                    <td><strong>{q.title}</strong></td>
                    <td>{q.category}</td>
                    <td>{q.subject}</td>
                    <td>{q.topic}</td>
                    <td>
                      <span className={`diff-tag ${q.difficulty.toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button text-btn text-red"
                        onClick={() => handleDeleteQuestion(q._id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Question Modal */}
      {createQModalOpen && (
        <Modal
          title="Add Question to Bank"
          close={() => setCreateQModalOpen(false)}
          maxWidth="640px"
        >
          <form onSubmit={handleCreateQuestionSubmit} className="modal-form-fields">
            <label className="field-label">
              Question Title
              <input
                type="text"
                required
                placeholder="e.g. Detect Cycle in Directed Graph"
                value={qForm.title}
                onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
              />
            </label>

            <div className="form-grid-three">
              <label className="field-label">
                Category
                <select
                  value={qForm.category}
                  onChange={(e) => setQForm({ ...qForm, category: e.target.value })}
                >
                  <option value="DSA">DSA</option>
                  <option value="Core CS">Core CS</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                </select>
              </label>

              <label className="field-label">
                Subject
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS, OS, DSA"
                  value={qForm.subject}
                  onChange={(e) => setQForm({ ...qForm, subject: e.target.value })}
                />
              </label>

              <label className="field-label">
                Topic
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphs, Indexing"
                  value={qForm.topic}
                  onChange={(e) => setQForm({ ...qForm, topic: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid-two">
              <label className="field-label">
                Difficulty
                <select
                  value={qForm.difficulty}
                  onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>

              <label className="field-label">
                Question Type
                <select
                  value={qForm.questionType}
                  onChange={(e) => setQForm({ ...qForm, questionType: e.target.value })}
                >
                  <option value="multiple-choice">Multiple Choice (MCQ)</option>
                  <option value="code-practice">Code Practice</option>
                  <option value="descriptive">Descriptive Interview</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Problem Statement
              <textarea
                rows={3}
                required
                value={qForm.statement}
                onChange={(e) => setQForm({ ...qForm, statement: e.target.value })}
              />
            </label>

            {qForm.questionType === 'multiple-choice' && (
              <>
                <label className="field-label">
                  Options (one per line)
                  <textarea
                    rows={4}
                    required
                    value={qForm.optionsText}
                    onChange={(e) => setQForm({ ...qForm, optionsText: e.target.value })}
                  />
                </label>

                <label className="field-label">
                  Correct Option Index (0 = A, 1 = B, 2 = C, 3 = D)
                  <input
                    type="number"
                    min={0}
                    max={5}
                    required
                    value={qForm.correctAnswer}
                    onChange={(e) => setQForm({ ...qForm, correctAnswer: Number(e.target.value) })}
                  />
                </label>
              </>
            )}

            <label className="field-label">
              Solution Explanation
              <textarea
                rows={3}
                placeholder="Explain the optimal approach and why the correct answer holds..."
                value={qForm.explanation}
                onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreateQModalOpen(false)}
                disabled={creatingQ}
              >
                Cancel
              </button>
              <button type="submit" className="button" disabled={creatingQ}>
                {creatingQ ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Company Modal */}
      {createCoModalOpen && (
        <Modal
          title="Add New Target Company"
          close={() => setCreateCoModalOpen(false)}
        >
          <form onSubmit={handleCreateCompanySubmit} className="modal-form-fields">
            <label className="field-label">
              Company Name
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Cisco, Oracle"
                value={coForm.name}
                onChange={(e) => setCoForm({ ...coForm, name: e.target.value })}
              />
            </label>

            <div className="form-grid-two">
              <label className="field-label">
                Industry
                <input
                  type="text"
                  required
                  value={coForm.industry}
                  onChange={(e) => setCoForm({ ...coForm, industry: e.target.value })}
                />
              </label>

              <label className="field-label">
                Difficulty
                <select
                  value={coForm.difficulty}
                  onChange={(e) => setCoForm({ ...coForm, difficulty: e.target.value })}
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Job Roles (comma-separated)
              <input
                type="text"
                required
                value={coForm.roles}
                onChange={(e) => setCoForm({ ...coForm, roles: e.target.value })}
              />
            </label>

            <label className="field-label">
              Required Skills (comma-separated)
              <input
                type="text"
                required
                value={coForm.requiredSkills}
                onChange={(e) => setCoForm({ ...coForm, requiredSkills: e.target.value })}
              />
            </label>

            <label className="field-label">
              Company Description
              <textarea
                rows={3}
                placeholder="Overview of engineering recruitment focus..."
                value={coForm.description}
                onChange={(e) => setCoForm({ ...coForm, description: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreateCoModalOpen(false)}
                disabled={creatingCo}
              >
                Cancel
              </button>
              <button type="submit" className="button" disabled={creatingCo}>
                {creatingCo ? 'Adding...' : 'Create Company'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminPage
