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
  Code2
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

  useEffect(() => {
    async function loadRoadmap() {
      setLoading(true)
      try {
        const [roadmapRes, companiesRes] = await Promise.all([
          api.roadmaps.get(),
          api.companies.getAll()
        ])

        if (roadmapRes.success && roadmapRes.roadmap) {
          setRoadmap(roadmapRes.roadmap)
          setSelectedCompanyId(roadmapRes.roadmap.company?._id || '')
          setSelectedRole(roadmapRes.roadmap.role || '')
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
  }, [])

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
  const progressPct = roadmap?.progressPercentage || 0

  const company = roadmap?.company || user?.targetCompany || {
    name: 'Accenture',
    mark: '>',
    color: '#a100ff'
  }

  return (
    <div className="roadmap-page">
      <PageHeader
        eyebrow="TARGET CURRICULUM"
        title="Your Preparation Roadmap"
        description={`${company.name} · ${roadmap?.role || 'Software Engineer'} · 4-phase structured preparation curriculum.`}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => setRegenModalOpen(true)}
        >
          <RotateCcw size={15} /> Configure & Regenerate
        </button>
      </PageHeader>

      {/* Progress Header Strip */}
      <section className="roadmap-hero-strip">
        <div className="roadmap-strip-left">
          <CompanyMark company={company} large />
          <div>
            <span>TARGET MILESTONES</span>
            <h2>{roadmap?.role || 'Software Engineer'} at {company.name}</h2>
            <p>
              {completedTasks.length} of {allTasks.length} tasks completed ({progressPct}% progress)
            </p>
          </div>
        </div>

        <div className="roadmap-strip-meter">
          <div className="meter-numbers">
            <span>Overall Progress</span>
            <b>{progressPct}%</b>
          </div>
          <ProgressBar value={progressPct} tone="blue" showValue={false} height={10} />
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="roadmap-filter-tabs">
        <button
          type="button"
          className={`filter-tab ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          All Tasks ({allTasks.length})
        </button>
        <button
          type="button"
          className={`filter-tab ${filterMode === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterMode('pending')}
        >
          Pending ({allTasks.length - completedTasks.length})
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

          return (
            <article key={phase.phaseNumber || pIdx} className="journey-step">
              <header className="journey-step-header">
                <span className="step-circle">{phase.phaseNumber}</span>
                <div className="step-info">
                  <small>PHASE {phase.phaseNumber}</small>
                  <h2>{phase.title}</h2>
                  <p>{phase.subtitle}</p>
                </div>
                <b className="step-progress-label">
                  {doneInPhase}/{phase.tasks.length} Done
                </b>
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
                            <Calendar size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="task-card-action">
                      <Link to="/practice" className="button secondary text-btn">
                        Practice <ArrowRight size={13} />
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
          title="Regenerate Preparation Roadmap"
          close={() => setRegenModalOpen(false)}
        >
          <p className="modal-copy">
            HireVerse uses transparent, deterministic rules to generate your roadmap based on required company skills and your past mock test performance.
          </p>

          <div className="modal-form-fields">
            <label className="field-label">
              Target Company
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value)
                  const comp = companies.find(c => c._id === e.target.value)
                  if (comp && comp.roles?.length > 0) setSelectedRole(comp.roles[0])
                }}
              >
                {companies.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Target Role
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </label>

            <label className="field-label">
              Available Preparation Weeks
              <select
                value={availableWeeks}
                onChange={(e) => setAvailableWeeks(Number(e.target.value))}
              >
                <option value={4}>4 Weeks (Intensive Sprint)</option>
                <option value={8}>8 Weeks (Standard Recommended)</option>
                <option value={12}>12 Weeks (Comprehensive)</option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setRegenModalOpen(false)}
              disabled={regenerating}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              onClick={handleRegenerateRoadmap}
              disabled={regenerating}
            >
              {regenerating ? 'Generating...' : 'Generate Roadmap'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RoadmapPage
