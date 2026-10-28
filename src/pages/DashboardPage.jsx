import { useState, useEffect } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  FileCheck2,
  Target,
  ArrowRight,
  CheckCircle2,
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
  const [assessmentFallbackNote, setAssessmentFallbackNote] = useState(null)
  const [roadmapData, setRoadmapData] = useState(null)
  const [readinessData, setReadinessData] = useState(null)
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [selectedTestForStart, setSelectedTestForStart] = useState(null)
  const [starting, setStarting] = useState(false)

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
          const companyTests = testsRes.tests.filter(test => {
            const testCoId = (test.company?._id || test.company)?.toString()
            return testCoId === coId.toString() && test.isPublished !== false
          })
          const generalTests = testsRes.tests.filter(test => !test.company && test.isPublished !== false)

          if (companyTests.length > 0) {
            setMockTests(companyTests)
            setAssessmentFallbackNote(null)
          } else if (generalTests.length > 0) {
            setMockTests(generalTests)
            setAssessmentFallbackNote(`Showing general placement practice assessments.`)
          } else {
            setMockTests([])
            setAssessmentFallbackNote(null)
          }
        } else {
          setMockTests([])
          setAssessmentFallbackNote(null)
        }
      } catch (err) {
        console.error('Failed to load dashboard content:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardContent()
  }, [user, coId, currentRole])

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
      {coId && (() => {
        const mockAccuracy = readinessData?.mockPerformance?.overallAccuracy !== undefined && readinessData?.mockPerformance?.overallAccuracy !== null
          ? readinessData.mockPerformance.overallAccuracy
          : (readinessData?.metrics?.overallAccuracy !== undefined && readinessData?.metrics?.overallAccuracy !== null
              ? readinessData.metrics.overallAccuracy
              : (readinessData?.mockPerformance?.examAccuracyPercentage !== undefined && readinessData?.mockPerformance?.examAccuracyPercentage !== null
                  ? readinessData.mockPerformance.examAccuracyPercentage
                  : readinessData?.metrics?.averageTestScore))

        const hasMockData = mockAccuracy !== null && mockAccuracy !== undefined
        const subAttempts = readinessData?.metrics?.submittedAttempts ?? readinessData?.metrics?.testsCompleted ?? 0
        const unqCompleted = readinessData?.metrics?.uniqueAssessmentsCompleted ?? 0
        const availTests = readinessData?.metrics?.availableAssessments ?? mockTests.length

        const overallScore = readinessData?.overallScore !== null && readinessData?.overallScore !== undefined
          ? readinessData.overallScore
          : (hasMockData ? Math.round((progressPercent * 0.5) + (mockAccuracy * 0.5)) : progressPercent)
        const isReady = overallScore >= 75
        const isGood = overallScore >= 50
        const statusLabel = readinessData?.statusLabel || (isReady ? 'Placement Ready' : (isGood ? 'Good Foundation' : 'In Progress'))
        const statusBadgeClass = isReady ? 'status-ready' : (isGood ? 'status-good' : 'status-progress')
        const gaugeTone = isReady ? '#16a34a' : (isGood ? '#2563eb' : '#f59e0b')
        const circum = 175.93
        const strokeDashoffset = circum - (circum * Math.min(100, Math.max(0, overallScore))) / 100

        return (
          <section className="dashboard-readiness-section">
            {/* Section Header */}
            <div className="dashboard-readiness-header">
              <div className="dashboard-readiness-title-area">
                <div className="dashboard-readiness-icon-badge">
                  <Target size={22} />
                </div>
                <div>
                  <span className="dashboard-readiness-eyebrow">
                    <Sparkles size={12} /> PLACEMENT READINESS SCORE
                  </span>
                  <h2 className="dashboard-readiness-title">
                    Where You Stand for {activeCo.name}
                    <span className="dashboard-readiness-role-pill">{currentRole}</span>
                  </h2>
                  <p className="dashboard-readiness-subcopy">
                    Evidence-based readiness calculated strictly from your saved syllabus topics and submitted mock assessments.
                  </p>
                </div>
              </div>

              <div className="dashboard-readiness-actions">
                <Link to="/readiness" className="button secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  <TrendingUp size={14} /> Detailed Analysis <ChevronRight size={14} />
                </Link>
                <Link to="/roadmap" className="button secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  <Milestone size={14} /> Full Roadmap <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3-Column Highlights Grid */}
            <div className="dashboard-readiness-grid">
              {/* Highlight 1: Overall Verified Score */}
              <div className="readiness-score-hero-card">
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Overall Placement Readiness
                  </span>

                  <div className="readiness-score-circular-wrap">
                    <div className="readiness-score-gauge">
                      <svg viewBox="0 0 72 72">
                        <circle
                          cx="36"
                          cy="36"
                          r="28"
                          fill="transparent"
                          stroke="#e2e8f0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="36"
                          cy="36"
                          r="28"
                          fill="transparent"
                          stroke={gaugeTone}
                          strokeWidth="6"
                          strokeDasharray={circum}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                        <text
                          x="36"
                          y="33"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="16"
                          fontWeight="800"
                          fill="#0f172a"
                          transform="rotate(90 36 36)"
                        >
                          {overallScore}%
                        </text>
                        <text
                          x="36"
                          y="47"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="7.5"
                          fontWeight="700"
                          fill="#64748b"
                          letterSpacing="0.5"
                          transform="rotate(90 36 36)"
                        >
                          SCORE
                        </text>
                      </svg>
                    </div>

                    <div className="readiness-score-gauge-details">
                      <span className={`readiness-score-badge ${statusBadgeClass}`}>
                        <Award size={12} /> {statusLabel}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.35 }}>
                        {hasMockData ? 'Combined syllabus & exam performance' : 'Roadmap checklist verified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="readiness-score-card-footer">
                  {hasMockData ? (
                    <span>Formula: 50% Topics Completed + 50% Mock Accuracy</span>
                  ) : (
                    <span>Take a mock assessment to unlock full combined readiness score</span>
                  )}
                </div>
              </div>

              {/* Pillar 1: Syllabus Progress */}
              <div className="readiness-pillar-metric-card">
                <div>
                  <div className="readiness-pillar-card-head">
                    <span className="pillar-label">
                      <BookOpen size={13} color="#2563eb" /> 1. Syllabus Roadmap
                    </span>
                    <div className="pillar-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <CheckCircle2 size={15} />
                    </div>
                  </div>

                  <div className="readiness-pillar-stat-row">
                    <span className="readiness-pillar-stat-val">{progressPercent}%</span>
                    <span className="readiness-pillar-stat-sub">({completedCount} / {totalTopicsCount} topics)</span>
                  </div>

                  <ProgressBar
                    value={progressPercent}
                    tone={progressPercent === 100 ? 'green' : 'blue'}
                    showValue={false}
                    height={7}
                  />

                  <p style={{ margin: '10px 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.45 }}>
                    Verified completed topics from your target roadmap checklist.
                  </p>
                </div>

                <div className="readiness-pillar-action-row">
                  <span style={{ color: '#64748b' }}>Curriculum coverage</span>
                  <Link
                    to={coId ? `/company-prep?company=${coId}` : '/company-prep'}
                    className="readiness-pillar-action-link"
                  >
                    Study in Hub <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Mock-Test Competency */}
              <div className="readiness-pillar-metric-card">
                <div>
                  <div className="readiness-pillar-card-head">
                    <span className="pillar-label">
                      <FileCheck2 size={13} color="#7c3aed" /> 2. Mock Assessments
                    </span>
                    <div className="pillar-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      <TrendingUp size={15} />
                    </div>
                  </div>

                  <div className="readiness-pillar-stat-row">
                    {hasMockData ? (
                      <>
                        <span className="readiness-pillar-stat-val">{mockAccuracy}%</span>
                        <span className="readiness-pillar-stat-sub">
                          ({subAttempts} attempt{subAttempts === 1 ? '' : 's'} · {unqCompleted}/{availTests} unique)
                        </span>
                      </>
                    ) : (
                      <span className="readiness-pillar-stat-val" style={{ fontSize: '18px', color: '#94a3b8' }}>
                        Assessment Pending
                      </span>
                    )}
                  </div>

                  {hasMockData ? (
                    <ProgressBar
                      value={mockAccuracy}
                      tone={mockAccuracy >= 70 ? 'green' : (mockAccuracy < 50 ? 'orange' : 'blue')}
                      showValue={false}
                      height={7}
                    />
                  ) : (
                    <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '4px' }} />
                  )}

                  <p style={{ margin: '10px 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.45 }}>
                    {hasMockData
                      ? 'Overall accuracy across latest completed mock assessment attempts.'
                      : `Take a target assessment (${availTests} available) to establish your exam benchmark.`}
                  </p>
                </div>

                <div className="readiness-pillar-action-row">
                  <span style={{ color: '#64748b' }}>{availTests} test{availTests === 1 ? '' : 's'} available</span>
                  <Link to="/mock-tests" className="readiness-pillar-action-link">
                    Take Mock Test <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )
      })()}

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
                          <div
                            className={`topic-checkbox-indicator ${isCompleted ? 'checked' : ''}`}
                            title={isCompleted ? 'Completed on Roadmap' : 'Topic Guide'}
                            style={{
                              color: isCompleted ? '#16a34a' : '#94a3b8',
                              marginTop: '2px',
                              flexShrink: 0,
                              cursor: 'default',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="check-icon-active" />
                            ) : (
                              <BookOpen size={16} className="topic-neutral-icon" style={{ color: '#94a3b8' }} />
                            )}
                          </div>

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
              <span>{assessmentFallbackNote || `Available mock assessments for ${activeCo.name}`}</span>
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
                  No mock assessments found.
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  No published mock assessments are currently available. You can browse all mock tests or change your target.
                </p>
                <Link to="/mock-tests" className="button" style={{ fontSize: '11px', display: 'inline-flex' }}>
                  Browse All Mock Tests <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {mockTests.slice(0, 1).map(test => {
                  const testCoId = (test.company?._id || test.company)?.toString()
                  const isExactTargetMatch = testCoId === coId?.toString() && (!test.role || test.role.toLowerCase() === currentRole.toLowerCase())
                  return (
                    <article
                      key={test._id}
                      className="mock-test-card"
                      style={{
                        borderColor: isExactTargetMatch ? '#bfdbfe' : '#e2e8f0',
                        margin: 0,
                        padding: '16px 18px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                      }}
                    >
                      <div className="test-card-header" style={{ marginBottom: '10px' }}>
                        <div className="test-badge-row" style={{ gap: '6px' }}>
                          {isExactTargetMatch ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              <Sparkles size={11} /> Target Match
                            </span>
                          ) : test.company ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {test.role || activeCo.name}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              General Practice
                            </span>
                          )}
                        </div>
                        {test.bestAttempt && (
                          <span className="best-score-badge" style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#ecfdf5',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            Best: <b>{test.bestAttempt.percentage}%</b>
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '15px', margin: '0 0 6px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                        {test.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
                        {test.description?.slice(0, 130)}...
                      </p>

                      <div className="test-specs-row" style={{
                        fontSize: '11.5px',
                        marginBottom: '14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#2563eb" />
                          <span><b>{test.durationMinutes}</b> Mins</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileCheck2 size={14} color="#2563eb" />
                          <span><b>{test.questionCount}</b> Questions</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Award size={14} color="#2563eb" />
                          <span><b>{test.totalMarks}</b> Marks <small style={{ color: '#64748b' }}>(+{test.marksPerQuestion} / -{test.negativeMarking})</small></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="button"
                        onClick={() => setSelectedTestForStart(test)}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          padding: '9px 14px',
                          borderRadius: '7px',
                          background: '#2563eb',
                          border: '1px solid #2563eb',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                        }}
                      >
                        <Play size={13} /> Start Assessment
                      </button>
                    </article>
                  )
                })}

                <div style={{ textAlign: 'center', marginTop: '2px' }}>
                  <Link
                    to="/mock-tests"
                    className="button secondary"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      width: '100%',
                      justifyContent: 'center',
                      padding: '8px 14px',
                      borderRadius: '7px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#1e40af'
                    }}
                  >
                    View All Mock Assessments {mockTests.length > 1 ? `(${mockTests.length})` : ''} <ArrowRight size={13} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {completedTopicIds.includes(selectedResourceTopic.id || selectedResourceTopic.topicId) ? (
                  <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    <CheckCircle2 size={16} /> Completed on Roadmap
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    Status: Incomplete · <Link to="/roadmap" style={{ color: '#2563eb', fontWeight: 600 }}>Mark on Roadmap</Link>
                  </span>
                )}
              </div>

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
