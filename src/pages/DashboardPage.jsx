import { useState, useEffect } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Milestone,
  Building2,
  ChevronRight,
  BookOpen,
  FileText,
  UserCheck,
  BarChart3,
  Lightbulb,
  Award,
  Layers,
  Sparkles
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
  const outletContext = useOutletContext()
  const onOpenTarget = outletContext?.onOpenTarget

  const [loading, setLoading] = useState(true)
  const [readinessData, setReadinessData] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [targetCompany, setTargetCompany] = useState(null)
  const [curriculumProgress, setCurriculumProgress] = useState(null)
  const [testHistory, setTestHistory] = useState([])

  const coId = user?.targetCompany?._id || user?.targetCompany
  const currentRole = user?.currentTargetRole || 'Full Stack Developer'

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      try {
        const [readinessRes, roadmapRes, curriculumRes, testHistoryRes] = await Promise.all([
          api.readiness.getOverall({ companyId: coId, role: currentRole }),
          api.roadmaps.get({ companyId: coId, role: currentRole }),
          api.curriculum.getUserProgress({ companyId: coId, role: currentRole }),
          api.tests.getHistory().catch(() => ({ success: false, history: [] }))
        ])

        if (readinessRes.success) setReadinessData(readinessRes.readiness)
        if (roadmapRes.success) setRoadmap(roadmapRes.roadmap)
        if (curriculumRes.success) setCurriculumProgress(curriculumRes)
        if (testHistoryRes.success && testHistoryRes.history) setTestHistory(testHistoryRes.history)

        // Get company details
        if (coId) {
          if (user?.targetCompany?.name && user?.targetCompany?.roles) {
            setTargetCompany(user.targetCompany)
          } else {
            const coRes = await api.companies.getById(coId)
            if (coRes.success) setTargetCompany(coRes.company)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [user, coId, currentRole])

  // Toggle roadmap task directly from today's plan
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
    name: 'Selected Company',
    mark: 'H',
    color: '#2563eb',
    difficulty: 'Intermediate',
    recruitmentRounds: [{ name: 'Screening Assessment' }]
  }

  // Curriculum progress calculation
  const totalTopics = curriculumProgress?.totalTopics || 0
  const completedTopicsCount = curriculumProgress?.completedTopics?.length || 0
  const remainingTopicsCount = Math.max(0, totalTopics - completedTopicsCount)
  const topicProgressPct = curriculumProgress?.progressPercentage || 0

  // Roadmap tasks
  const allTasks = roadmap?.phases?.flatMap(p => p.tasks) || []
  const pendingTasks = allTasks.filter(t => !t.completed)
  const completedTasksCount = allTasks.filter(t => t.completed).length
  const todayTasks = pendingTasks.slice(0, 4)
  const nextRoadmapTask = pendingTasks[0] || null

  // Readiness score logic
  const hasEnoughData = readinessData?.hasEnoughData
  const readinessScore = hasEnoughData ? readinessData.overallScore : null

  // Mock test statistics
  const testsCount = testHistory.length
  const latestAttempt = testHistory[0] || null
  const latestTestScore = latestAttempt?.result?.percentage ?? null
  const averageTestScore = testsCount > 0
    ? Math.round(testHistory.reduce((acc, t) => acc + (t.result?.percentage || 0), 0) / testsCount)
    : null

  // Deterministic Next Recommended Action:
  let nextAction = {
    title: 'Study Next Syllabus Topic',
    description: `Open the Preparation Hub to review documentation and video tutorials for ${activeCo.name}.`,
    link: '/company-prep',
    buttonText: 'Open Preparation Hub',
    icon: BookOpen
  }

  if (remainingTopicsCount > 0) {
    nextAction = {
      title: `Study Next Topic in Preparation Hub`,
      description: `${remainingTopicsCount} topics remaining to master ${activeCo.name}'s curriculum for ${currentRole}.`,
      link: '/company-prep',
      buttonText: 'Continue Learning Topics',
      icon: BookOpen
    }
  } else if (testsCount === 0) {
    nextAction = {
      title: `Take Your First Mock Assessment`,
      description: `Test your pacing, accuracy, and negative marking under real exam timing for ${activeCo.name}.`,
      link: '/mock-tests',
      buttonText: 'Start Mock Assessment',
      icon: FileCheck2
    }
  } else if (nextRoadmapTask) {
    nextAction = {
      title: `Roadmap: ${nextRoadmapTask.title}`,
      description: `${nextRoadmapTask.subject || 'Milestone'} · ${nextRoadmapTask.estimatedMinutes || 30} mins recommended.`,
      link: '/roadmap',
      buttonText: 'Continue Next Milestone',
      icon: Milestone
    }
  } else if (latestTestScore !== null && latestTestScore < 70) {
    nextAction = {
      title: 'Review Recent Mock Assessment Mistakes',
      description: `Your last test score was ${latestTestScore}%. Review the step-by-step explanations to correct weak areas.`,
      link: latestAttempt ? `/mock-result/${latestAttempt._id}` : '/mock-tests',
      buttonText: 'Review Test Results',
      icon: FileCheck2
    }
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="STUDENT PREPARATION COMMAND CENTER"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}.`}
        description="Track your learning topics, roadmap milestones, and mock assessment results."
      >
        <Link to="/companies" className="button secondary">
          <Building2 size={15} /> All Companies
        </Link>
        <Link to="/company-prep" className="button">
          <BookOpen size={15} /> Preparation Hub
        </Link>
      </PageHeader>

      {/* 1. Target Company & Role Header Banner */}
      {!coId ? (
        <section className="target-banner" style={{ background: '#f8fafc', border: '1px dashed #93c5fd' }}>
          <div className="target-company">
            <Target size={36} color="#2563eb" />
            <div>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>GET STARTED</span>
              <h2>No Target Company Selected</h2>
              <p>Choose a company to unlock your structured learning curriculum, roadmap, and mock assessments.</p>
            </div>
          </div>
          <div className="target-meta">
            <button
              type="button"
              className="button primary"
              onClick={onOpenTarget ? onOpenTarget : () => navigate('/onboarding')}
            >
              Select Placement Target <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : (
        <section className="target-banner">
          <div className="target-company">
            <CompanyMark company={activeCo} large />
            <div>
              <span>ACTIVE PLACEMENT TARGET</span>
              <h2>{activeCo.name}</h2>
              <p>{currentRole}</p>
            </div>
          </div>

          <div className="target-meta">
            <div>
              <span>Screening Focus</span>
              <strong>{activeCo.recruitmentRounds?.[0]?.name || 'Online Assessment'}</strong>
            </div>
            <div>
              <span>Company Tier</span>
              <strong>{activeCo.difficulty || 'Intermediate'}</strong>
            </div>
            <Link to={`/companies/${activeCo._id || activeCo.code}`} className="button secondary">
              Company Guide <ArrowRight size={14} />
            </Link>
            {onOpenTarget && (
              <button
                type="button"
                className="button secondary"
                onClick={onOpenTarget}
                title="Change your target company or job role"
              >
                Change Target
              </button>
            )}
          </div>
        </section>
      )}

      {/* 2. Direct Shortcuts Bar */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <Link
          to="/company-prep"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#1e293b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', display: 'block' }}>Preparation Hub</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Syllabus topics & resources</span>
          </div>
        </Link>

        <Link
          to="/roadmap"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#1e293b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '8px' }}>
            <Milestone size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', display: 'block' }}>Roadmap</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>4-phase milestone sequence</span>
          </div>
        </Link>

        <Link
          to="/mock-tests"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#1e293b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '8px' }}>
            <FileCheck2 size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', display: 'block' }}>Mock Tests</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Timed screening exams</span>
          </div>
        </Link>

        <Link
          to="/analytics"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#1e293b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '10px', borderRadius: '8px' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', display: 'block' }}>Progress Analytics</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Topic coverage & scores</span>
          </div>
        </Link>
      </section>

      {/* 3. Primary Status Grid: Preparation Score & Recommended Next Step */}
      <section className="dashboard-grid primary-grid">
        {/* Overall Preparation Readiness Card */}
        <article className="readiness-summary">
          <div className="section-head">
            <div>
              <h2>Preparation Readiness</h2>
              <span>Derived from verified topic completion & mock tests</span>
            </div>
            <Link to="/readiness" className="head-link">
              Readiness Details <ChevronRight size={14} />
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
                  <strong style={{ fontSize: '24px', letterSpacing: '0', color: '#64748b' }}>Pending</strong>
                  <p style={{ marginTop: '8px', color: '#64748b', fontSize: '11px' }}>
                    Need baseline study & test
                  </p>
                </>
              )}
            </div>

            <div className="readiness-bars">
              {hasEnoughData ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <ProgressBar
                    label="Curriculum Topics Completed"
                    value={topicProgressPct}
                    tone="blue"
                  />
                  <ProgressBar
                    label="Roadmap Milestone Progress"
                    value={roadmap?.progressPercentage || 0}
                    tone="green"
                  />
                  {testsCount > 0 && (
                    <ProgressBar
                      label="Mock Test Average Score"
                      value={averageTestScore || 0}
                      tone="orange"
                    />
                  )}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                    Complete some learning topics and take a mock test to start tracking your preparation.
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                    Study topics in the Preparation Hub and complete at least one timed mock assessment to calculate your verified score.
                  </p>
                  <Link to="/company-prep" className="button secondary" style={{ fontSize: '11px', padding: '5px 10px' }}>
                    <BookOpen size={12} /> Explore Preparation Hub
                  </Link>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Highlighted Recommended Next Step */}
        <article className="next-action">
          <span className="action-icon">
            <nextAction.icon size={22} />
          </span>
          <p>RECOMMENDED NEXT STEP</p>
          <h2>{nextAction.title}</h2>
          <span className="action-description">
            {nextAction.description}
          </span>
          <Link to={nextAction.link} className="button" style={{ marginTop: 'auto' }}>
            {nextAction.buttonText} <ArrowRight size={14} />
          </Link>
        </article>
      </section>

      {/* 4. Middle Row: Preparation Topic Progress & Mock Test Performance */}
      <section className="dashboard-grid content-grid-two">
        {/* Preparation Topic Progress */}
        <article className="section-panel">
          <div className="section-head">
            <div>
              <h2>Preparation Content Completion</h2>
              <span>Curriculum topics mastered for {activeCo.name}</span>
            </div>
            <Link to="/company-prep" className="head-link">
              Preparation Hub <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ marginTop: '14px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ background: '#f8fafc', padding: '12px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block' }}>TOTAL TOPICS</span>
                <strong style={{ fontSize: '20px', color: '#1e293b' }}>{totalTopics}</strong>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, display: 'block' }}>COMPLETED</span>
                <strong style={{ fontSize: '20px', color: '#16a34a' }}>{completedTopicsCount}</strong>
              </div>
              <div style={{ background: '#eff6ff', padding: '12px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600, display: 'block' }}>REMAINING</span>
                <strong style={{ fontSize: '20px', color: '#2563eb' }}>{remainingTopicsCount}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Curriculum Progress</span>
                <strong style={{ color: '#0f172a' }}>{topicProgressPct}%</strong>
              </div>
              <ProgressBar value={topicProgressPct} tone="blue" showValue={false} height={8} />
            </div>

            <p style={{
              margin: '12px 0 0',
              fontSize: '11px',
              color: '#64748b',
              lineHeight: 1.45,
              background: '#f8fafc',
              padding: '8px 10px',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <strong>Note:</strong> Topic completion measures syllabus topics you have marked completed in the Preparation Hub.
            </p>
          </div>
        </article>

        {/* Mock Test Performance Summary */}
        <article className="section-panel">
          <div className="section-head">
            <div>
              <h2>Mock Assessment Performance</h2>
              <span>Results from submitted timed tests</span>
            </div>
            <Link to="/mock-tests" className="head-link">
              All Tests <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ marginTop: '14px' }}>
            {testsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <FileCheck2 size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '14px', margin: '0 0 4px', color: '#334155' }}>No mock tests completed yet</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px' }}>
                  Take your first timed mock assessment to test your exam pacing and establish your baseline score.
                </p>
                <Link to="/mock-tests" className="button" style={{ display: 'inline-flex' }}>
                  Take a Mock Test <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>TESTS COMPLETED</span>
                    <strong style={{ fontSize: '22px', color: '#0f172a' }}>{testsCount}</strong>
                    <small style={{ display: 'block', color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                      Server-evaluated sessions
                    </small>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '11px', color: '#16a34a', display: 'block' }}>LATEST SCORE</span>
                    <strong style={{ fontSize: '22px', color: '#16a34a' }}>
                      {latestTestScore !== null ? `${latestTestScore}%` : 'N/A'}
                    </strong>
                    <small style={{ display: 'block', color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                      Average: {averageTestScore}%
                    </small>
                  </div>
                </div>

                {latestAttempt && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ fontSize: '12px', display: 'block', color: '#1e293b' }}>
                        {latestAttempt.test?.title || 'Recent Mock Test'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Submitted {new Date(latestAttempt.submittedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      to={`/mock-result/${latestAttempt._id}`}
                      className="button secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      View Report
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </section>

      {/* 5. Lower Row: Roadmap Milestones & AI Career Tools */}
      <section className="dashboard-grid lower-grid">
        {/* Roadmap Milestones */}
        <article className="section-panel today-panel">
          <div className="section-head">
            <div>
              <h2>Upcoming Roadmap Milestones</h2>
              <span>{completedTasksCount} of {allTasks.length} tasks completed</span>
            </div>
            <Link to="/roadmap" className="head-link">
              Full Roadmap <ChevronRight size={14} />
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
                <p>All active milestones completed! Open your roadmap to explore your next sprint.</p>
              </div>
            )}
          </div>
        </article>

        {/* AI Career Tools */}
        <article className="section-panel performance-panel">
          <div className="section-head">
            <div>
              <h2>Career & Interview Tools</h2>
              <span>Resume ATS scoring & virtual interview practice</span>
            </div>
          </div>

          <div className="dashboard-tools-list">
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

            <Link to="/placement-drives" className="dashboard-tool-card">
              <div className="tool-icon-box prep-hub">
                <Building2 size={18} />
              </div>
              <div className="tool-info">
                <strong>Campus Placement Drives</strong>
                <span>Upcoming company visits & eligibility</span>
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
