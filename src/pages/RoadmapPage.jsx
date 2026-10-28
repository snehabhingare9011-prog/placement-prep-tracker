import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Milestone,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
  Code2,
  BookOpen,
  Check,
  Target,
  FileCheck2,
  Layers
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function RoadmapPage() {
  const { user, showToast } = useAuth()

  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'pending' | 'completed'

  // Regeneration modal
  const [regenModalOpen, setRegenModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [availableWeeks, setAvailableWeeks] = useState(8)
  const [regenerating, setRegenerating] = useState(false)

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'

  useEffect(() => {
    async function loadRoadmap() {
      setLoading(true)
      try {
        const [roadmapRes, companiesRes] = await Promise.all([
          api.roadmaps.get({ companyId: targetCompanyId, role: targetRole }),
          api.companies.getAll()
        ])

        if (roadmapRes.success && roadmapRes.roadmap) {
          setRoadmap(roadmapRes.roadmap)
          setSelectedCompanyId(roadmapRes.roadmap.company?._id || targetCompanyId || '')
          setSelectedRole(roadmapRes.roadmap.role || targetRole || '')
        }
        if (companiesRes.success && companiesRes.companies) {
          setCompanies(companiesRes.companies)
        }
      } catch (err) {
        console.error('Failed to load roadmap:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [targetCompanyId, targetRole])

  const handleToggleTask = async (taskId) => {
    if (!roadmap) return
    try {
      const res = await api.roadmaps.toggleTask(roadmap._id, taskId)
      if (res.success) {
        showToast(res.message, 'success')
        setRoadmap(prev => {
          if (!prev) return prev
          const updatedPhases = prev.phases.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(t => (t.taskId === taskId ? { ...t, completed: !t.completed } : t))
          }))
          return {
            ...prev,
            phases: updatedPhases,
            progressPercentage: res.progressPercentage
          }
        })
      }
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleRegenerateRoadmap = async () => {
    if (!selectedCompanyId) return
    setRegenerating(true)
    try {
      const res = await api.roadmaps.generate(selectedCompanyId, selectedRole, availableWeeks)
      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap)
        showToast('Personalized preparation roadmap generated.', 'success')
        setRegenModalOpen(false)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="roadmap-loading">
        <PageHeader eyebrow="PREPARATION ROADMAP" title="Loading curriculum milestones..." />
        <SkeletonLoader rows={6} height={70} />
      </div>
    )
  }

  const allTasks = roadmap?.phases?.flatMap(p => p.tasks) || []
  const completedTasks = allTasks.filter(t => t.completed)
  const remainingTasks = allTasks.filter(t => !t.completed)
  const progressPct = roadmap?.progressPercentage || 0

  const company = roadmap?.company || user?.targetCompany || {
    name: 'Selected Company',
    mark: 'H',
    color: '#2563eb'
  }

  // Next prioritized incomplete task
  const nextIncompleteTask = remainingTasks[0] || null

  return (
    <div className="roadmap-page">
      <PageHeader
        eyebrow="TARGET PREPARATION TIMELINE"
        title="Follow Your Recommended Preparation Sequence"
        description={`${company.name} · ${roadmap?.role || targetRole} · 4-phase structured milestones indicating what to study first, next, and after that.`}
      >
        <Link to="/company-prep" className="button secondary">
          <BookOpen size={15} /> Preparation Hub
        </Link>
        <button
          type="button"
          className="button secondary"
          onClick={() => setRegenModalOpen(true)}
        >
          <RotateCcw size={15} /> Configure Timeline
        </button>
      </PageHeader>

      {/* Progress Header Strip */}
      <section className="roadmap-hero-strip">
        <div className="roadmap-strip-left">
          <CompanyMark company={company} large />
          <div>
            <span>TARGET ROADMAP</span>
            <h2>{roadmap?.role || targetRole} at {company.name}</h2>
            <p>
              {completedTasks.length} of {allTasks.length} tasks completed ({progressPct}% progress · {remainingTasks.length} milestones remaining)
            </p>
          </div>
        </div>

        <div className="roadmap-strip-meter">
          <div className="meter-numbers">
            <span>Overall Roadmap Completion</span>
            <b>{progressPct}%</b>
          </div>
          <ProgressBar value={progressPct} tone="blue" showValue={false} height={10} />
        </div>
      </section>

      {/* Highlighted Next Incomplete Milestone */}
      {nextIncompleteTask && (
        <section style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderLeft: '4px solid #2563eb',
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 320px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
              <Milestone size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.6px' }}>
                NEXT RECOMMENDED STEP
              </span>
              <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                {nextIncompleteTask.title}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                {nextIncompleteTask.detail || `${nextIncompleteTask.subject} milestone`}. Estimated effort: {nextIncompleteTask.estimatedMinutes || 30} mins.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button"
              onClick={() => handleToggleTask(nextIncompleteTask.taskId)}
            >
              <Check size={14} /> Mark as Finished
            </button>
            <Link to="/company-prep" className="button secondary">
              <BookOpen size={14} /> Study in Prep Hub
            </Link>
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="roadmap-filter-tabs">
        <button
          type="button"
          className={`filter-tab ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          All Milestones ({allTasks.length})
        </button>
        <button
          type="button"
          className={`filter-tab ${filterMode === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterMode('pending')}
        >
          Remaining ({remainingTasks.length})
        </button>
        <button
          type="button"
          className={`filter-tab ${filterMode === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterMode('completed')}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* 4 Phases List */}
      <div className="journey-roadmap">
        {roadmap?.phases?.map((phase, pIdx) => {
          const phaseTasks = phase.tasks.filter(t => {
            if (filterMode === 'pending') return !t.completed
            if (filterMode === 'completed') return t.completed
            return true
          })

          const doneInPhase = phase.tasks.filter(t => t.completed).length
          const phasePct = phase.tasks.length > 0 ? Math.round((doneInPhase / phase.tasks.length) * 100) : 0

          return (
            <article key={phase.phaseNumber || pIdx} className="journey-step">
              <header className="journey-step-header">
                <span className="step-circle">{phase.phaseNumber}</span>
                <div className="step-info">
                  <small>PHASE {phase.phaseNumber}</small>
                  <h2>{phase.title}</h2>
                  <p>{phase.subtitle || `Focus on ${phase.title.toLowerCase()} for ${company.name}`}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b className="step-progress-label">
                    {doneInPhase} of {phase.tasks.length} Done ({phasePct}%)
                  </b>
                  <div style={{ width: '120px', marginTop: '6px' }}>
                    <ProgressBar value={phasePct} tone={phasePct === 100 ? 'green' : 'blue'} showValue={false} height={4} />
                  </div>
                </div>
              </header>

              <div className="phase-tasks-list">
                {phaseTasks.map(task => (
                  <div
                    key={task.taskId}
                    className={`journey-task-card ${task.completed ? 'done' : ''}`}
                  >
                    <button
                      type="button"
                      className="task-check-circle"
                      onClick={() => handleToggleTask(task.taskId)}
                      aria-label="Toggle task status"
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed && <CheckCircle2 size={16} />}
                    </button>

                    <div className="task-content-body">
                      <div className="task-title-row">
                        <strong>{task.title}</strong>
                        <span className={`task-priority ${task.priority.toLowerCase()}`}>
                          {task.priority} Priority
                        </span>
                      </div>
                      <p className="task-detail-text">{task.detail}</p>
                      <div className="task-tags-row">
                        <span className="task-subject-tag">{task.subject}</span>
                        <span><Clock size={12} /> {task.estimatedMinutes} min</span>
                        {task.dueDate && (
                          <span>
                            <Calendar size={12} /> Target: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="task-card-action">
                      <Link to="/company-prep" className="button secondary text-btn">
                        Study Topic <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}

                {phaseTasks.length === 0 && (
                  <p className="empty-inline-copy">No tasks matching current filter in this phase.</p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Regeneration Modal */}
      {regenModalOpen && (
        <Modal
          title="Configure Preparation Roadmap"
          close={() => setRegenModalOpen(false)}
        >
          <p className="modal-copy">
            HireVerse adjusts your milestone timeline based on required skills for {company.name} and your target weeks before campus placement.
          </p>

          <div className="modal-form-fields" style={{ display: 'grid', gap: '14px', margin: '16px 0' }}>
            <label className="field-label" style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
              <span>Target Company</span>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{ height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px' }}
              >
                {companies.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="field-label" style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
              <span>Target Job Role</span>
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                style={{ height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px' }}
              />
            </label>

            <label className="field-label" style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
              <span>Available Preparation Weeks ({availableWeeks} weeks)</span>
              <input
                type="range"
                min="4"
                max="16"
                value={availableWeeks}
                onChange={(e) => setAvailableWeeks(Number(e.target.value))}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setRegenModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              onClick={handleRegenerateRoadmap}
              disabled={regenerating}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Timeline'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RoadmapPage
