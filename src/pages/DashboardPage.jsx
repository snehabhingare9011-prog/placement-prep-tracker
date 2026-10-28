import { useState, useEffect } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  FileCheck2,
  Target,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  ChevronRight,
  Globe,
  Video as YoutubeIcon,
  Play,
  Check,
  Award,
  Sparkles,
  ExternalLink,
  Milestone,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import ProgressBar from '../components/common/ProgressBar'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function DashboardPage() {
  const { user, showToast } = useAuth()
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const onOpenTarget = outletContext?.onOpenTarget

  const [loading, setLoading] = useState(true)
  const [targetCompany, setTargetCompany] = useState(null)
  const [topics, setTopics] = useState([])
  const [completedTopicIds, setCompletedTopicIds] = useState([])
  const [mockTests, setMockTests] = useState([])
  const [roadmapData, setRoadmapData] = useState(null)
  const [readinessData, setReadinessData] = useState(null)
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [selectedTestForStart, setSelectedTestForStart] = useState(null)
  const [starting, setStarting] = useState(false)
  const [updatingTopicId, setUpdatingTopicId] = useState(null)

  const coId = user?.targetCompany?._id || user?.targetCompany
  const currentRole = user?.currentTargetRole || 'Full Stack Developer'

  useEffect(() => {
    async function loadDashboardContent() {
      if (!coId) {
        setLoading(false)
        setTargetCompany(null)
        setTopics([])
        setMockTests([])
        setRoadmapData(null)
        setReadinessData(null)
        return
      }

      setLoading(true)
      try {
        const [coRes, curriculumRes, progressRes, testsRes, roadmapRes, readinessRes] = await Promise.all([
          (user?.targetCompany?.name && user?.targetCompany?.roles)
            ? { success: true, company: user.targetCompany }
            : api.companies.getById(coId).catch(() => ({ success: false })),
          api.curriculum.getByCompany(coId, [currentRole]).catch(() => ({ success: false, topics: [] })),
          api.curriculum.getUserProgress({ companyId: coId, role: currentRole }).catch(() => ({ success: false, completedTopics: [] })),
          api.tests.getAll().catch(() => ({ success: false, tests: [] })),
          api.roadmaps.get({ companyId: coId, role: currentRole }).catch(() => ({ success: false })),
          api.readiness.getOverall({ companyId: coId, role: currentRole }).catch(() => ({ success: false }))
        ])

        if (coRes.success && coRes.company) {
          setTargetCompany(coRes.company)
        }

        if (curriculumRes.success && curriculumRes.topics) {
          const relevantTopics = curriculumRes.topics.filter(t => t.roles.includes(currentRole))
          setTopics(relevantTopics)
        } else {
          setTopics([])
        }

        if (progressRes.success && progressRes.completedTopics) {
          setCompletedTopicIds(progressRes.completedTopics)
        } else {
          setCompletedTopicIds([])
        }

        if (roadmapRes.success && roadmapRes.roadmap) {
          setRoadmapData(roadmapRes.roadmap)
        } else {
          setRoadmapData(null)
        }

        if (readinessRes.success && readinessRes.readiness) {
          setReadinessData(readinessRes.readiness)
        } else {
          setReadinessData(null)
        }

        if (testsRes.success && testsRes.tests) {
          const matchingTests = testsRes.tests.filter(test => {
            const testCoId = (test.company?._id || test.company)?.toString()
            const matchesCompany = testCoId === coId.toString()
            const matchesRole = !test.role || test.role.toLowerCase() === currentRole.toLowerCase()
            return matchesCompany && matchesRole
          })
          setMockTests(matchingTests)
        } else {
          setMockTests([])
        }
      } catch (err) {
        console.error('Failed to load dashboard content:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardContent()
  }, [user, coId, currentRole])

  // Toggle topic completion scoped to target company & role
  const handleToggleTopic = async (topicId) => {
    if (updatingTopicId) return
    setUpdatingTopicId(topicId)
    try {
      const res = await api.curriculum.toggleTopic(topicId, coId, currentRole)
      if (res.success) {
        const nextCompleted = res.completedTopics || []
        setCompletedTopicIds(nextCompleted)

        // Keep roadmap data in sync
        setRoadmapData(prev => {
          if (!prev) return prev
          const allTasks = prev.phases?.flatMap(p => p.tasks) || []
          const uniqueIds = [...new Set(allTasks.map(t => t.taskId))]
          const uniqueDone = [...new Set(allTasks.filter(t => nextCompleted.includes(t.taskId)).map(t => t.taskId))]
          const pct = uniqueIds.length > 0 ? Math.round((uniqueDone.length / uniqueIds.length) * 100) : 0
          return {
            ...prev,
            uniqueCompletedTopics: uniqueDone.length,
            progressPercentage: pct
          }
        })

        // Re-fetch readiness score to maintain 100% database synchronization
        api.readiness.getOverall({ companyId: coId, role: currentRole })
          .then(readinessRes => {
            if (readinessRes.success && readinessRes.readiness) {
              setReadinessData(readinessRes.readiness)
            }
          })
          .catch(() => {})

        showToast(
          res.isCompleted ? 'Topic marked as completed! 🎉' : 'Topic marked as incomplete',
          'success'
        )
      }
    } catch (err) {
      showToast(err.message || 'Failed to update topic status', 'danger')
    } finally {
      setUpdatingTopicId(null)
    }
  }

  // Start mock test exam session
  const handleStartExam = async () => {
    if (!selectedTestForStart) return
    setStarting(true)
    try {
      const res = await api.tests.start(selectedTestForStart._id)
      if (res.success && res.attemptId) {
        showToast('Test session started. Timer active.', 'info')
        navigate(`/mock-exam/${res.attemptId}`)
      }
    } catch (err) {
      showToast(err.message || 'Failed to start assessment', 'danger')
    } finally {
      setStarting(false)
      setSelectedTestForStart(null)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <PageHeader
          eyebrow="STUDENT PREPARATION COMMAND CENTER"
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

  // Calculate reliable database preparation progress
  const totalTopicsCount = roadmapData?.uniqueTotalTopics || topics.length
  const completedCount = roadmapData?.uniqueCompletedTopics !== undefined
    ? roadmapData.uniqueCompletedTopics
    : completedTopicIds.filter(id => topics.some(t => t.id === id)).length

  const progressPercent = totalTopicsCount > 0
    ? Math.round((completedCount / totalTopicsCount) * 100)
    : 0

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="STUDENT PREPARATION COMMAND CENTER"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}.`}
        description="Follow your company-specific preparation journey, study required syllabus milestones, and take mock assessments."
      >
        <Link to="/companies" className="button secondary">
          <Building2 size={15} /> All Companies
        </Link>
        <Link to="/company-prep" className="button secondary">
          <BookOpen size={15} /> Preparation Hub
        </Link>
        <Link to="/roadmap" className="button secondary">
          <Milestone size={15} /> Roadmap
        </Link>
        <Link to="/mock-tests" className="button">
          <FileCheck2 size={15} /> Mock Tests
        </Link>
      </PageHeader>

      {/* Target Company & Role Header Banner */}
      {!coId ? (
        <section className="target-banner" style={{ background: '#f8fafc', border: '1px dashed #93c5fd', marginBottom: '20px' }}>
          <div className="target-company">
            <Target size={36} color="#2563eb" />
            <div>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>GET STARTED</span>
              <h2>No Target Company Selected</h2>
              <p>Choose a company and role to load your required preparation roadmap and mock tests.</p>
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
        <section className="target-banner" style={{ marginBottom: '20px' }}>
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

      {/* Placement Readiness Score Section */}
      {coId && (
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '22px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  PLACEMENT READINESS SCORE
                </span>
                {readinessData?.hasEnoughData && (
                  <span className={`status-pill ${readinessData?.hasMockTestData ? 'good' : 'attention'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {readinessData.statusLabel}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                Where You Stand for {activeCo.name} ({currentRole})
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                Evidence-based readiness calculated strictly from your saved syllabus topics and submitted mock assessments.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/readiness" className="button secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <TrendingUp size={14} /> Detailed Analysis <ChevronRight size={14} />
              </Link>
              <Link to="/roadmap" className="button secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <Milestone size={14} /> Full Roadmap <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Three Separate, Clearly Explained Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Metric 1: Preparation Progress (Syllabus Coverage) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Syllabus Progress
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0 6px' }}>
                  <strong style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                    {progressPercent}%
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    ({completedCount} / {totalTopicsCount} topics)
                  </span>
                </div>
                <ProgressBar
                  value={progressPercent}
                  tone={progressPercent === 100 ? 'green' : 'blue'}
                  showValue={false}
                  height={6}
                />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                Calculated strictly from your saved checklist items in Preparation Hub & Roadmap.
              </p>
            </div>

            {/* Metric 2: Assessment Performance (Mock Tests) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Mock-Test Competency
                </span>
                <div style={{ margin: '8px 0 6px' }}>
                  {readinessData?.metrics?.averageTestScore !== null && readinessData?.metrics?.averageTestScore !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <strong style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                        {readinessData.metrics.averageTestScore}%
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        ({readinessData.metrics.testsCompleted} test{readinessData.metrics.testsCompleted === 1 ? '' : 's'})
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>
                        Assessment Pending
                      </span>
                    </div>
                  )}
                </div>
                {readinessData?.metrics?.averageTestScore !== null && readinessData?.metrics?.averageTestScore !== undefined ? (
                  <ProgressBar
                    value={readinessData.metrics.averageTestScore}
                    tone={readinessData.metrics.averageTestScore >= 70 ? 'green' : (readinessData.metrics.averageTestScore < 50 ? 'orange' : 'blue')}
                    showValue={false}
                    height={6}
                  />
                ) : (
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px' }} />
                )}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                {readinessData?.metrics?.averageTestScore !== null && readinessData?.metrics?.averageTestScore !== undefined
                  ? 'Objective average score with negative marking across submitted tests.'
                  : 'Take a target mock assessment to establish your verified exam benchmark.'}
              </p>
            </div>

            {/* Metric 3: Overall Placement Readiness */}
            <div style={{
              background: readinessData?.hasMockTestData ? '#f0fdf4' : '#eff6ff',
              border: `1px solid ${readinessData?.hasMockTestData ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '10px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: readinessData?.hasMockTestData ? '#166534' : '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  3. Combined Readiness Score
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0 6px' }}>
                  {readinessData?.hasMockTestData ? (
                    <>
                      <strong style={{ fontSize: '26px', fontWeight: 800, color: '#166534' }}>
                        {readinessData.overallScore}
                      </strong>
                      <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>/ 100</span>
                    </>
                  ) : (
                    <>
                      <strong style={{ fontSize: '22px', fontWeight: 800, color: '#1e40af' }}>
                        {progressPercent}%
                      </strong>
                      <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 500 }}>Syllabus Only</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: readinessData?.hasMockTestData ? '#15803d' : '#2563eb' }}>
                  Status: {readinessData?.statusLabel || 'Awaiting Assessment'}
                </div>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '11px', color: readinessData?.hasMockTestData ? '#166534' : '#1e40af', lineHeight: 1.4 }}>
                {readinessData?.formulaExplanation || 'Calculated from 50% Syllabus Topics + 50% Mock-Test Performance.'}
              </p>
            </div>
          </div>

          {/* Round-Wise Readiness (Only shown when verified company rounds exist) */}
          {readinessData?.roundReadiness && readinessData.roundReadiness.length > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Recruitment Round Readiness for {activeCo.name}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {readinessData.roundReadiness.map((rnd, idx) => (
                  <div key={idx} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>
                        Round {rnd.roundNumber}: {rnd.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {rnd.detail}
                      </span>
                    </div>
                    <span className={`status-pill ${rnd.status === 'Completed' ? 'good' : (rnd.status === 'In Progress' ? 'attention' : 'pending')}`} style={{ fontSize: '10px', padding: '2px 6px', flexShrink: 0 }}>
                      {rnd.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparent Calculation Note */}
          <div style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={14} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>
              <b>Transparent Logic:</b> HireVerse readiness scores are never guessed or simulated. They combine verified topic checklists (50%) and actual submitted mock assessment scores (50%). No arbitrary selection predictions or artificial odds.
            </span>
          </div>
        </section>
      )}

      {/* Main Two Columns: Preparation Hub & Mock Tests */}
      <section className="dashboard-grid content-grid-two" style={{ marginBottom: '24px' }}>
        {/* Section 1: Preparation Hub */}
        <article className="section-panel">
          <div className="section-head">
            <div>
              <h2>Preparation Hub</h2>
              <span>Learning resources mapped for {activeCo.name} · {currentRole}</span>
            </div>
            <Link to={coId ? `/company-prep?company=${coId}` : '/company-prep'} className="head-link">
              Open Hub <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ marginTop: '16px' }}>
            {topics.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <BookOpen size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '0 0 6px', fontWeight: 700 }}>
                  No resources available for this target yet.
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
                  Preparation resources for {activeCo.name} ({currentRole}) are not available yet.
                </p>
                <Link to="/companies" className="button secondary" style={{ fontSize: '11px', display: 'inline-flex' }}>
                  Explore Company Directory
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#64748b',
                  padding: '0 2px'
                }}>
                  <span>{topics.length} syllabus topics mapped</span>
                  <span>{completedCount} marked completed</span>
                </div>

                <div style={{ display: 'grid', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {topics.map(topic => {
                    const isCompleted = completedTopicIds.includes(topic.id)
                    const isToggling = updatingTopicId === topic.id

                    return (
                      <div
                        key={topic.id}
                        style={{
                          background: isCompleted ? '#f7fdf9' : '#ffffff',
                          border: isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                          <button
                            type="button"
                            className={`topic-checkbox-btn ${isCompleted ? 'checked' : ''}`}
                            onClick={() => handleToggleTopic(topic.id)}
                            disabled={isToggling}
                            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                            style={{
                              background: 'transparent',
                              border: 0,
                              cursor: 'pointer',
                              padding: 0,
                              color: isCompleted ? '#16a34a' : '#94a3b8',
                              marginTop: '2px',
                              flexShrink: 0
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="check-icon-active" />
                            ) : (
                              <Circle size={18} className="check-icon-empty" />
                            )}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2px' }}>
                              <span className={`pillar-tag ${topic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                {topic.pillar}
                              </span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>
                                <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                                {topic.estimatedHours}
                              </span>
                            </div>

                            <strong style={{
                              fontSize: '12px',
                              color: isCompleted ? '#334155' : '#0f172a',
                              textDecoration: 'none',
                              display: 'block'
                            }}>
                              {topic.title}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setSelectedResourceTopic(topic)}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            flexShrink: 0
                          }}
                        >
                          <BookOpen size={11} /> Study
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: '6px', textAlign: 'center' }}>
                  <Link
                    to={coId ? `/company-prep?company=${coId}` : '/company-prep'}
                    className="button secondary"
                    style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}
                  >
                    View All Topics in Preparation Hub <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Section 2: Mock Tests */}
        <article className="section-panel">
          <div className="section-head">
            <div>
              <h2>Mock Tests</h2>
              <span>Available mock assessments for {activeCo.name} · {currentRole}</span>
            </div>
            <Link to="/mock-tests" className="head-link">
              All Tests <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ marginTop: '16px' }}>
            {mockTests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <FileCheck2 size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '0 0 6px', fontWeight: 700 }}>
                  No target-specific assessments yet.
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Mock assessments specific to {activeCo.name} ({currentRole}) are not available yet. You can still practice with general assessments.
                </p>
                <Link to="/mock-tests" className="button" style={{ fontSize: '11px', display: 'inline-flex' }}>
                  Browse All Mock Tests <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {mockTests.map(test => (
                  <article
                    key={test._id}
                    className="mock-test-card"
                    style={{ borderColor: '#bfdbfe', margin: 0, padding: '14px' }}
                  >
                    <div className="test-card-header" style={{ marginBottom: '8px' }}>
                      <div className="test-badge-row">
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700
                        }}>
                          <Sparkles size={10} /> Target Match
                        </span>
                        <span className={`difficulty-badge ${test.difficulty?.toLowerCase()}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {test.difficulty}
                        </span>
                      </div>
                      {test.bestAttempt && (
                        <span className="best-score-badge" style={{ fontSize: '11px' }}>
                          Best: <b>{test.bestAttempt.percentage}%</b>
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '14px', margin: '0 0 4px', fontWeight: 700, color: '#0f172a' }}>{test.title}</h3>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {test.description?.slice(0, 110)}...
                    </p>

                    <div className="test-specs-row" style={{ fontSize: '11px', marginBottom: '12px' }}>
                      <div>
                        <Clock size={13} />
                        <span>{test.durationMinutes} Mins</span>
                      </div>
                      <div>
                        <FileCheck2 size={13} />
                        <span>{test.questionCount} Questions</span>
                      </div>
                      <div>
                        <Award size={13} />
                        <span>{test.totalMarks} Marks (+{test.marksPerQuestion} / -{test.negativeMarking})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button"
                      onClick={() => setSelectedTestForStart(test)}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Play size={13} /> Start Assessment
                    </button>
                  </article>
                ))}

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <Link to="/mock-tests" className="button secondary" style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                    View All Mock Tests <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* Learning Resources Modal */}
      {selectedResourceTopic && (
        <Modal
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          title={`Study Topic: ${selectedResourceTopic.title}`}
          maxWidth="560px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                {selectedResourceTopic.pillar && (
                  <span className={`pillar-tag ${selectedResourceTopic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                    {selectedResourceTopic.pillar}
                  </span>
                )}
                {selectedResourceTopic.importance && (
                  <span className={`importance-tag ${selectedResourceTopic.importance.toLowerCase()}`}>
                    {selectedResourceTopic.importance} Importance
                  </span>
                )}
                {selectedResourceTopic.estimatedHours && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                    {selectedResourceTopic.estimatedHours}
                  </span>
                )}
                {completedTopicIds.includes(selectedResourceTopic.id || selectedResourceTopic.topicId) ? (
                  <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 700, marginLeft: 'auto' }}>
                    ✓ Completed on Server
                  </span>
                ) : (
                  <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600, marginLeft: 'auto' }}>
                    ○ Incomplete
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {selectedResourceTopic.description}
              </p>
            </div>

            {/* Verified Documentation & Written Guides */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <Globe size={16} />
                <span>Verified Documentation & Written Tutorials</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.popularWebsites && selectedResourceTopic.popularWebsites.length > 0 ? (
                  selectedResourceTopic.popularWebsites.map((web, idx) => (
                    <a
                      key={idx}
                      href={web.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-item-link"
                    >
                      <div className="resource-item-icon web-icon">
                        <Globe size={16} />
                      </div>
                      <div className="resource-item-details">
                        <strong>{web.title}</strong>
                        <span>Source: <b>{web.provider}</b></span>
                      </div>
                      <div className="resource-open-action">
                        <span>Open Guide</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No external documentation mapped for this topic.</p>
                )}
              </div>
            </div>

            {/* Curated YouTube Video Playlists */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <YoutubeIcon size={16} className="yt-icon" />
                <span>Curated Video Playlists & Masterclasses</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.youtubeVideos && selectedResourceTopic.youtubeVideos.length > 0 ? (
                  selectedResourceTopic.youtubeVideos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-item-link"
                    >
                      <div className="resource-item-icon yt-icon">
                        <YoutubeIcon size={16} />
                      </div>
                      <div className="resource-item-details">
                        <strong>{vid.title}</strong>
                        <span>Channel: <b>{vid.channel}</b> · Duration: {vid.duration}</span>
                      </div>
                      <div className="resource-open-action">
                        <span>Watch Video</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No video playlists mapped for this topic.</p>
                )}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '14px',
              marginTop: '14px',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                className={`button ${completedTopicIds.includes(selectedResourceTopic.id || selectedResourceTopic.topicId) ? 'secondary' : 'primary'}`}
                onClick={() => handleToggleTopic(selectedResourceTopic.id || selectedResourceTopic.topicId)}
              >
                {completedTopicIds.includes(selectedResourceTopic.id || selectedResourceTopic.topicId) ? (
                  <>
                    <CheckCircle2 size={15} color="#16a34a" /> Marked Completed (Click to Uncheck)
                  </>
                ) : (
                  <>
                    <Check size={15} /> Mark Topic as Completed
                  </>
                )}
              </button>

              <button
                type="button"
                className="button secondary"
                onClick={() => setSelectedResourceTopic(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Instructions Modal before starting mock assessment */}
      {selectedTestForStart && (
        <Modal
          title={`Start: ${selectedTestForStart.title}`}
          close={() => setSelectedTestForStart(null)}
          maxWidth="580px"
        >
          <div className="test-instructions-box">
            <h3>Examination Rules & Integrity:</h3>
            <ul className="instructions-list">
              <li>
                <CheckCircle2 size={16} /> <b>Server-Timed Session:</b> The test duration is {selectedTestForStart.durationMinutes} minutes. The countdown timer is locked on the server and does not reset if you refresh or navigate away.
              </li>
              <li>
                <CheckCircle2 size={16} /> <b>Marking Scheme:</b> Each correct answer awards +{selectedTestForStart.marksPerQuestion || 4} marks. Each incorrect answer deducts -{selectedTestForStart.negativeMarking || 1} mark. Unanswered questions award 0.
              </li>
              <li>
                <CheckCircle2 size={16} /> <b>Question Palette:</b> You can move freely between questions, mark questions for review, and revise selections at any time before final submission.
              </li>
              <li>
                <CheckCircle2 size={16} /> <b>Objective Server Evaluation:</b> The answer key is safeguarded on the backend. Correct answers and detailed solutions are unlocked immediately after submission.
              </li>
            </ul>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setSelectedTestForStart(null)}
                disabled={starting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                onClick={handleStartExam}
                disabled={starting}
              >
                {starting ? 'Initiating...' : 'Acknowledge & Begin Test'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default DashboardPage
