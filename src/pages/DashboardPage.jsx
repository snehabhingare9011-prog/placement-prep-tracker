import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Code2,
  Milestone,
  Flame,
  Calendar,
  Sparkles,
  Building2,
  ChevronRight,
  BookOpen,
  FileText,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function DashboardPage() {
  const { user, showToast } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [readinessData, setReadinessData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [targetCompany, setTargetCompany] = useState(null)
  const [curriculumProgress, setCurriculumProgress] = useState(null)

  const currentRole = user?.currentTargetRole || 'Full Stack Developer'

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      try {
        const [readinessRes, analyticsRes, roadmapRes, curriculumRes] = await Promise.all([
          api.readiness.getOverall(),
          api.readiness.getStudentAnalytics(),
          api.roadmaps.get(),
          api.curriculum.getUserProgress()
        ])

        if (readinessRes.success) setReadinessData(readinessRes.readiness)
        if (analyticsRes.success) setAnalyticsData(analyticsRes.analytics)
        if (roadmapRes.success) setRoadmap(roadmapRes.roadmap)
        if (curriculumRes.success) setCurriculumProgress(curriculumRes)

        // Get company details
        const coId = user?.targetCompany?._id || user?.targetCompany
        if (coId) {
          const coRes = await api.companies.getById(coId)
          if (coRes.success) setTargetCompany(coRes.company)
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [user])

  // Toggle roadmap task directly from today's plan
  const handleToggleTask = async (taskId) => {
    if (!roadmap) return
    try {
      const res = await api.roadmaps.toggleTask(roadmap._id, taskId)
      if (res.success) {
        showToast(res.message, 'success')
        // Update local state
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <PageHeader
          eyebrow="PLACEMENT PREPARATION DASHBOARD"
          title="Loading your preparation workspace..."
        />
        <SkeletonLoader rows={6} height={60} />
      </div>
    )
  }

  const activeCo = targetCompany || {
    name: 'Accenture',
    mark: '>',
    color: '#a100ff',
    difficulty: 'Intermediate',
    recruitmentRounds: [{ name: 'Cognitive & Technical Assessment' }]
  }

  // Get up to 4 pending tasks from roadmap for today's plan
  const allTasks = roadmap?.phases?.flatMap(p => p.tasks) || []
  const todayTasks = allTasks.filter(t => !t.completed).slice(0, 4)
  const completedTasksCount = allTasks.filter(t => t.completed).length

  const readinessScore = readinessData?.hasEnoughData ? readinessData.overallScore : null

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="PLACEMENT PREPARATION DASHBOARD"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}.`}
        description="Here is your verified preparation status, target alignment, and prioritized milestones."
      >
        <Link to="/companies" className="button secondary">
          <Building2 size={15} /> Explore Companies
        </Link>
        <Link to="/roadmap" className="button">
          <Milestone size={15} /> View Full Roadmap
        </Link>
      </PageHeader>

      {/* Target Banner */}
      <section className="target-banner">
        <div className="target-company">
          <CompanyMark company={activeCo} large />
          <div>
            <span>CURRENT TARGET</span>
            <h2>{activeCo.name}</h2>
            <p>{currentRole}</p>
          </div>
        </div>

        <div className="target-meta">
          <div>
            <span>Next Round Focus</span>
            <strong>{activeCo.recruitmentRounds?.[0]?.name || 'Online Assessment'}</strong>
          </div>
          <div>
            <span>Target Level</span>
            <strong>{activeCo.difficulty || 'Intermediate'}</strong>
          </div>
          <Link to={`/companies/${activeCo._id || activeCo.code}`} className="button secondary">
            View Preparation Guide <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Primary Metrics Grid */}
      <section className="dashboard-grid primary-grid">
        {/* Overall Readiness Card */}
        <article className="readiness-summary">
          <div className="section-head">
            <div>
              <h2>Overall Readiness Score</h2>
              <span>Verifiable company preparation score</span>
            </div>
            <Link to="/readiness" className="head-link">
              Detailed analysis <ChevronRight size={14} />
            </Link>
          </div>

          <div className="readiness-content">
            <div className="score-block">
              {readinessScore !== null ? (
                <>
                  <strong>{readinessScore}</strong>
                  <span>/ 100</span>
                  <p>{readinessData?.statusLabel || 'On track'}</p>
                </>
              ) : (
                <>
                  <strong style={{ fontSize: '24px', letterSpacing: '0' }}>New</strong>
                  <p style={{ marginTop: '8px' }}>Not enough activity</p>
                </>
              )}
            </div>

            <div className="readiness-bars">
              {readinessData?.skillsBreakdown ? (
                readinessData.skillsBreakdown.slice(0, 5).map(skill => (
                  <ProgressBar
                    key={skill.name}
                    label={skill.name}
                    value={skill.score}
                    tone={skill.status === 'strong' ? 'green' : skill.status === 'needs work' ? 'orange' : 'blue'}
                  />
                ))
              ) : (
                <p className="empty-copy">Complete practice questions to calibrate your skills.</p>
              )}
            </div>
          </div>
        </article>

        {/* Recommended Next Step */}
        <article className="next-action">
          <span className="action-icon">
            <Target size={22} />
          </span>
          <p>RECOMMENDED NEXT STEP</p>
          <h2>
            {readinessData?.recommendedActions?.[0] || 'Start with high-frequency DSA questions.'}
          </h2>
          <span className="action-description">
            Prioritized by deterministic rules evaluating weak areas against {activeCo.name}'s required skills.
          </span>
          <Link to="/practice" className="button">
            <Code2 size={15} /> Start Targeted Practice
          </Link>
        </article>
      </section>

      {/* Middle Row: Today's Plan & Weak Areas */}
      <section className="dashboard-grid content-grid-two">
        {/* Today's Prioritized Tasks */}
        <article className="section-panel today-panel">
          <div className="section-head">
            <div>
              <h2>Today’s Preparation Tasks</h2>
              <span>{completedTasksCount} of {allTasks.length} curriculum tasks completed</span>
            </div>
            <Link to="/roadmap" className="head-link">
              Curriculum <ChevronRight size={14} />
            </Link>
          </div>

          <div className="plan-list">
            {todayTasks.length > 0 ? (
              todayTasks.map(item => (
                <button
                  key={item.taskId}
                  type="button"
                  className={`plan-item ${item.completed ? 'complete' : ''}`}
                  onClick={() => handleToggleTask(item.taskId)}
                >
                  <span className="check-box">
                    {item.completed && <CheckCircle2 size={14} />}
                  </span>
                  <span className="plan-copy">
                    <b>{item.title}</b>
                    <small>{item.subject} · {item.estimatedMinutes} min</small>
                  </span>
                  <em className={item.priority.toLowerCase()}>{item.priority}</em>
                </button>
              ))
            ) : (
              <div className="empty-inline">
                <CheckCircle2 size={24} style={{ color: 'var(--green)' }} />
                <p>All active milestones completed! Open your roadmap to generate your next sprint.</p>
              </div>
            )}
          </div>
        </article>

        {/* Areas to Improve */}
        <article className="section-panel weak-panel">
          <div className="section-head">
            <div>
              <h2>Identified Bottlenecks</h2>
              <span>Detected from objective practice & test attempts</span>
            </div>
            <Link to="/readiness" className="head-link">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="weak-list">
            {readinessData?.weakAreas && readinessData.weakAreas.length > 0 ? (
              readinessData.weakAreas.slice(0, 3).map(area => (
                <div key={area.name} className="weak-row">
                  <div>
                    <strong>{area.name}</strong>
                    <span>{area.note}</span>
                  </div>
                  <b>{area.score}%</b>
                  <ProgressBar value={area.score} tone="orange" showValue={false} />
                </div>
              ))
            ) : (
              <p className="empty-copy">No severe bottlenecks detected yet. Keep practicing!</p>
            )}

            <div className="weak-action-box">
              <Link to="/practice" className="button secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Practice Weak Subjects <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* Lower Row: Progress Stats & Placement Drives */}
      <section className="dashboard-grid lower-grid">
        {/* Progress Stats Panel */}
        <article className="section-panel progress-panel">
          <div className="section-head">
            <div>
              <h2>Preparation Metrics</h2>
              <span>Real data recorded in your account</span>
            </div>
          </div>

          <div className="compact-stats">
            <div>
              <strong>{analyticsData?.totalQuestionsSolved || 0}</strong>
              <span>Questions Solved</span>
            </div>
            <div>
              <strong>{analyticsData?.testsCompleted || 0}</strong>
              <span>Mock Tests</span>
            </div>
            <div>
              <strong>{analyticsData?.accuracyPercentage || 0}%</strong>
              <span>Accuracy</span>
            </div>
            <div>
              <strong>{analyticsData?.currentStreak || 0}d</strong>
              <span>Active Streak</span>
            </div>
          </div>

          <div className="roadmap-meter">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Curriculum Completion</span>
              <b>{completedTasksCount} / {allTasks.length} milestones</b>
            </div>
            <ProgressBar
              value={roadmap?.progressPercentage || 0}
              tone="blue"
              showValue={false}
              height={8}
            />
          </div>
        </article>

        {/* AI Career Accelerators & Preparation Hub */}
        <article className="section-panel performance-panel">
          <div className="section-head">
            <div>
              <h2>AI Preparation & Career Tools</h2>
              <span>Targeted practice and automated feedback</span>
            </div>
          </div>

          <div className="dashboard-tools-list">
            <Link to="/company-prep" className="dashboard-tool-card">
              <div className="tool-icon-box prep-hub">
                <BookOpen size={18} />
              </div>
              <div className="tool-info">
                <strong>Company Learning Hub</strong>
                <span>Requirements checklist & free video playlists</span>
              </div>
              <ArrowRight size={14} className="tool-arrow" />
            </Link>

            <Link to="/resume-analyzer" className="dashboard-tool-card">
              <div className="tool-icon-box resume-hub">
                <FileText size={18} />
              </div>
              <div className="tool-info">
                <strong>AI Resume Analyzer</strong>
                <span>Instant ATS scoring & keyword gap detector</span>
              </div>
              <ArrowRight size={14} className="tool-arrow" />
            </Link>

            <Link to="/ai-interview" className="dashboard-tool-card">
              <div className="tool-icon-box interview-hub">
                <UserCheck size={18} />
              </div>
              <div className="tool-info">
                <strong>AI Mock Interview</strong>
                <span>Virtual technical and STAR behavioral rounds</span>
              </div>
              <ArrowRight size={14} className="tool-arrow" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
