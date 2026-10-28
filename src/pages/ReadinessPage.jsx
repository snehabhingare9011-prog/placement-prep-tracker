import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Milestone,
  BookOpen,
  Building2,
  ChevronRight,
  Award,
  HelpCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  Zap,
  Check,
  Layers,
  BarChart2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function ReadinessPage() {
  const { user } = useAuth()
  const [readiness, setReadiness] = useState(null)
  const [companyDetails, setCompanyDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'weak' | 'strong'

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'
  const targetCompanyName = user?.targetCompany?.name || companyDetails?.name || readiness?.targetCompany || 'Target Goal'

  useEffect(() => {
    async function loadReadinessAndCompany() {
      setLoading(true)
      try {
        const [readinessRes, companyRes] = await Promise.all([
          api.readiness.getOverall({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          targetCompanyId ? api.companies.getById(targetCompanyId).catch(() => ({ success: false })) : Promise.resolve({ success: false })
        ])

        if (readinessRes.success && readinessRes.readiness) {
          setReadiness(readinessRes.readiness)
        }

        if (companyRes.success && companyRes.company) {
          setCompanyDetails(companyRes.company)
        } else if (user?.targetCompany?.name) {
          setCompanyDetails(user.targetCompany)
        }
      } catch (err) {
        console.error('Failed to load readiness data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReadinessAndCompany()
  }, [targetCompanyId, targetRole])

  if (loading) {
    return (
      <div className="readiness-loading">
        <PageHeader eyebrow="READINESS & PROGRESS ANALYTICS" title="Evaluating your verified preparation metrics..." />
        <SkeletonLoader rows={6} height={60} />
      </div>
    )
  }

  const activeCo = companyDetails || user?.targetCompany || {
    name: targetCompanyName,
    mark: targetCompanyName.charAt(0) || 'H',
    color: '#2563eb',
    difficulty: 'Intermediate'
  }

  // Safe destructuring of Section A, B, C, D data
  const preparation = readiness?.preparation || {
    completedTopics: readiness?.metrics?.curriculumTopicsCompleted || 0,
    totalTopics: readiness?.metrics?.totalCurriculumTopics || 0,
    percentage: readiness?.metrics?.preparationProgress || 0,
    nextIncompleteTopic: null,
    phasesProgress: []
  }

  const mockPerformance = readiness?.mockPerformance || {
    testsCompleted: readiness?.metrics?.testsCompleted || 0,
    averageScorePercentage: readiness?.metrics?.averageTestScore ?? null,
    totalAttemptedQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalUnanswered: 0,
    negativeMarksLost: 0,
    examAccuracyPercentage: null,
    recentTestHistory: []
  }

  const subjectAnalysis = readiness?.subjectAnalysis || []
  const strongAreas = readiness?.strengths || []
  const weakAreas = readiness?.weakAreas || []
  const nextActions = readiness?.nextActions || []
  const roundReadiness = readiness?.roundReadiness || []

  // Dynamic readiness level badge
  const readinessTier = preparation.percentage >= 75 && (mockPerformance.averageScorePercentage || 0) >= 70
    ? { label: 'Placement Ready', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
    : preparation.percentage >= 40 || (mockPerformance.testsCompleted || 0) >= 2
    ? { label: 'Advancing Tier', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
    : { label: 'Foundation Tier', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="status-pill status-strong" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Strong
          </span>
        )
      case 'Needs Focus':
        return (
          <span className="status-pill status-needs-focus" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Needs Focus
          </span>
        )
      case 'Not Enough Data':
        return (
          <span className="status-pill status-not-enough" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} /> Not Enough Data
          </span>
        )
      case 'Not Attempted':
      default:
        return (
          <span className="status-pill status-untested">
            Not Attempted
          </span>
        )
    }
  }

  return (
    <div className="readiness-page">
      <PageHeader
        eyebrow={`PLACEMENT ANALYTICS · ${targetCompanyName.toUpperCase()} · ${targetRole.toUpperCase()}`}
        title={`Placement Readiness & Performance Analytics`}
        description="Comprehensive evaluation based strictly on your real roadmap checklists and timed negative-marked mock assessments."
      >
        <Link to="/mock-tests" className="button primary">
          <FileCheck2 size={15} /> Take Mock Test
        </Link>
        <Link to="/company-prep" className="button secondary">
          <BookOpen size={15} /> Preparation Hub
        </Link>
        <Link to="/roadmap" className="button secondary">
          <Milestone size={15} /> Full Roadmap
        </Link>
      </PageHeader>

      {/* Target Goal Banner with Stats Strip */}
      <section className="readiness-hero-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <CompanyMark company={activeCo} large />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CURRENT TARGET
              </span>
              <span className="status-pill info" style={{ fontSize: '10px', padding: '1px 6px' }}>
                {activeCo.difficulty || 'Intermediate'} Tier
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: readinessTier.color,
                background: readinessTier.bg,
                border: `1px solid ${readinessTier.border}`,
                padding: '1px 8px',
                borderRadius: '12px'
              }}>
                {readinessTier.label}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              {activeCo.name}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Target Role: <b>{targetRole}</b>
            </p>
          </div>
        </div>

        {/* Executive Stats Strip */}
        <div className="readiness-header-stats">
          <div className="readiness-header-stat-item">
            <span>Roadmap Progress</span>
            <strong>{preparation.completedTopics} / {preparation.totalTopics}</strong>
          </div>
          <Link to="/companies" className="button secondary" style={{ fontSize: '12px', height: 'fit-content' }}>
            <Building2 size={13} /> Change Target
          </Link>
        </div>
      </section>

      {/* DUAL GRID: Section A (Preparation Progress) & Section B (Mock-Test Performance) */}
      <section className="readiness-dual-grid">
        {/* =========================================================================
            SECTION A: My Preparation Progress
            ========================================================================= */}
        <article className="readiness-section-card" style={{ marginBottom: 0 }}>
          <div className="readiness-card-header">
            <div>
              <span className="section-eyebrow" style={{ color: '#2563eb' }}>
                SECTION A · SYLLABUS & ROADMAP
              </span>
              <h2>My Preparation Progress</h2>
            </div>
            <BookOpen size={20} color="#2563eb" />
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
            Verified topic completion based on saved checklist items on your preparation roadmap.
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
            <strong style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a' }}>
              {preparation.percentage}%
            </strong>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
              ({preparation.completedTopics} of {preparation.totalTopics} topics completed)
            </span>
          </div>

          <ProgressBar
            value={preparation.percentage}
            tone={preparation.percentage === 100 ? 'green' : 'blue'}
            showValue={false}
            height={9}
          />

          {/* Phase Progression Chips */}
          {preparation.phasesProgress && preparation.phasesProgress.length > 0 && (
            <div className="readiness-phases-grid">
              {preparation.phasesProgress.map((phase) => (
                <div
                  key={phase.phaseNumber}
                  className={`readiness-phase-chip ${phase.status === 'Completed' ? 'is-completed' : (phase.status === 'Active' ? 'is-active' : '')}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Phase {phase.phaseNumber}</span>
                    {phase.status === 'Completed' && <Check size={11} color="#16a34a" />}
                  </div>
                  <strong style={{ fontSize: '11px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {phase.name.replace(/^Phase\s*\d+:\s*/i, '')}
                  </strong>
                  <span style={{ fontSize: '10px', color: phase.status === 'Completed' ? '#16a34a' : (phase.status === 'Active' ? '#2563eb' : '#94a3b8') }}>
                    {phase.completed}/{phase.total} done ({phase.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Next Incomplete Topic Card */}
          <div className="readiness-next-topic-card">
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>
                NEXT INCOMPLETE TOPIC
              </span>
              {preparation.nextIncompleteTopic ? (
                <>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    {preparation.nextIncompleteTopic.title}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {preparation.nextIncompleteTopic.phaseName} · {preparation.nextIncompleteTopic.estimatedHours}
                  </span>
                </>
              ) : (
                <strong style={{ fontSize: '14px', color: '#16a34a' }}>
                  🎉 All syllabus topics have been marked complete!
                </strong>
              )}
            </div>

            {preparation.nextIncompleteTopic && (
              <Link
                to={
                  preparation.nextIncompleteTopic.hubTopicId && targetCompanyId
                    ? `/company-prep?company=${targetCompanyId}&topic=${preparation.nextIncompleteTopic.hubTopicId}`
                    : `/roadmap`
                }
                className="button primary"
                style={{ fontSize: '11px', padding: '6px 12px', flexShrink: 0 }}
              >
                Study in Hub <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </article>

        {/* =========================================================================
            SECTION B: My Mock-Test Performance & Exam Diagnostics
            ========================================================================= */}
        <article className="readiness-section-card" style={{ marginBottom: 0 }}>
          <div className="readiness-card-header">
            <div>
              <span className="section-eyebrow" style={{ color: '#6366f1' }}>
                SECTION B · EXAM ACCURACY & DIAGNOSTICS
              </span>
              <h2>My Mock-Test Performance</h2>
            </div>
            <FileCheck2 size={20} color="#6366f1" />
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.45 }}>
            Calculated with timed negative marking (+4 correct, -1 incorrect). Abandoned tests are excluded.
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
            {mockPerformance.averageScorePercentage !== null ? (
              <>
                <strong style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a' }}>
                  {mockPerformance.averageScorePercentage}%
                </strong>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                  Average score across {mockPerformance.testsCompleted} test{mockPerformance.testsCompleted === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <strong style={{ fontSize: '24px', fontWeight: 700, color: '#94a3b8' }}>
                No Tests Submitted Yet
              </strong>
            )}
          </div>

          {mockPerformance.averageScorePercentage !== null ? (
            <ProgressBar
              value={mockPerformance.averageScorePercentage}
              tone={mockPerformance.averageScorePercentage >= 70 ? 'green' : (mockPerformance.averageScorePercentage < 50 ? 'orange' : 'blue')}
              showValue={false}
              height={9}
            />
          ) : (
            <div style={{ height: '9px', background: '#e2e8f0', borderRadius: '4px' }} />
          )}

          {/* Exam Diagnostics Metric Cards */}
          <div className="readiness-diagnostics-grid">
            <div className="readiness-diagnostic-card">
              <span>Attempted</span>
              <strong>{mockPerformance.totalAttemptedQuestions} Qs</strong>
            </div>
            <div className="readiness-diagnostic-card">
              <span>Correct</span>
              <strong style={{ color: '#16a34a' }}>{mockPerformance.totalCorrect} Qs</strong>
            </div>
            <div className="readiness-diagnostic-card">
              <span>Incorrect</span>
              <strong style={{ color: mockPerformance.totalIncorrect > 0 ? '#dc2626' : '#64748b' }}>
                {mockPerformance.totalIncorrect} Qs
              </strong>
            </div>
            <div className="readiness-diagnostic-card">
              <span>Penalty</span>
              <strong style={{ color: mockPerformance.negativeMarksLost > 0 ? '#ea580c' : '#64748b' }}>
                -{mockPerformance.negativeMarksLost} marks
              </strong>
            </div>
          </div>

          {/* Submitted Test History List */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              RECENT SUBMITTED TESTS ({mockPerformance.recentTestHistory.length})
            </span>

            {mockPerformance.recentTestHistory.length > 0 ? (
              <div className="readiness-history-list">
                {mockPerformance.recentTestHistory.map((test, idx) => (
                  <div key={test.attemptId || idx} className="readiness-history-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                          {test.testTitle}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(test.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {test.correctCount} correct, {test.incorrectCount} incorrect, {test.unansweredCount} unanswered
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: '14px', color: test.percentage >= 60 ? '#16a34a' : (test.percentage === 0 ? '#dc2626' : '#d97706'), fontWeight: 800 }}>
                        {test.percentage}%
                      </b>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                        {test.score} / {test.maxScore} marks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>
                  Take an assessment to generate your verified mock-test average.
                </p>
                <Link to="/mock-tests" className="button secondary" style={{ fontSize: '11px', margin: '0 auto', display: 'inline-flex' }}>
                  <FileCheck2 size={12} /> Start Mock Test
                </Link>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* =========================================================================
          SECTION C: Strong Areas and Topics to Focus On (Elevated & Tabbed)
          ========================================================================= */}
      <section className="readiness-section-card">
        <div className="readiness-card-header">
          <div>
            <span className="section-eyebrow" style={{ color: '#059669' }}>
              SECTION C · MOCK TEST INSIGHTS
            </span>
            <h2>Strong Areas and Topics to Focus On</h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Strictly derived from questions actually answered in submitted tests
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
          Accuracy is only calculated for questions you actually attempted. Unanswered questions are not counted as incorrect subject knowledge.
        </p>

        {/* Interactive Filter Tabs */}
        <div className="readiness-tab-bar">
          <button
            type="button"
            className={`readiness-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={13} /> All Subjects Matrix
          </button>
          <button
            type="button"
            className={`readiness-tab-btn ${activeTab === 'weak' ? 'active' : ''}`}
            onClick={() => setActiveTab('weak')}
          >
            <AlertTriangle size={13} color="#ea580c" /> Focus & Weak Areas ({weakAreas.length})
          </button>
          <button
            type="button"
            className={`readiness-tab-btn ${activeTab === 'strong' ? 'active' : ''}`}
            onClick={() => setActiveTab('strong')}
          >
            <CheckCircle2 size={13} color="#16a34a" /> Verified Strong Areas ({strongAreas.length})
          </button>
        </div>

        {/* TAB 1: ALL SUBJECTS MATRIX */}
        {activeTab === 'all' && (
          <div>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '14px',
              fontSize: '11px',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Status Criteria:</span>
              <span><b>Strong:</b> ≥ 3 attempted, ≥ 70% accuracy</span>
              <span>•</span>
              <span><b>Needs Focus:</b> ≥ 2 attempted, &lt; 60% accuracy</span>
              <span>•</span>
              <span><b>Not Enough Data:</b> &lt; 3 questions attempted</span>
              <span>•</span>
              <span><b>Not Attempted:</b> 0 questions attempted</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="readiness-subject-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Attempted Questions</th>
                    <th style={{ width: '220px' }}>Exam Accuracy</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Preparation Hub</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectAnalysis.length > 0 ? (
                    subjectAnalysis.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>{item.name}</strong>
                          {item.testedTopics && item.testedTopics.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              {item.testedTopics.map((tt, i) => (
                                <span key={i} className="readiness-subtopic-tag">
                                  {tt.topic} ({tt.correct}/{tt.attempted})
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: item.attempted > 0 ? '#334155' : '#94a3b8' }}>
                            {item.attempted > 0
                              ? `${item.attempted} question${item.attempted === 1 ? '' : 's'} attempted`
                              : '0 questions attempted'}
                          </span>
                        </td>
                        <td>
                          {item.attempted > 0 && item.accuracy !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <ProgressBar
                                value={item.accuracy}
                                tone={item.accuracy >= 70 ? 'green' : (item.accuracy < 60 ? 'orange' : 'blue')}
                                showValue={false}
                                height={6}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '35px', textAlign: 'right' }}>
                                {item.accuracy}%
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Untested
                            </span>
                          )}
                        </td>
                        <td>
                          {getStatusBadge(item.status)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={
                              item.hubTopicId && targetCompanyId
                                ? `/company-prep?company=${targetCompanyId}&topic=${item.hubTopicId}`
                                : (targetCompanyId ? `/company-prep?company=${targetCompanyId}` : '/company-prep')
                            }
                            className="button secondary"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                          >
                            Study <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                        No subject records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED WEAK AREAS */}
        {activeTab === 'weak' && (
          <div>
            {weakAreas.length > 0 ? (
              <div className="readiness-weak-grid">
                {weakAreas.map((weak, idx) => (
                  <div key={idx} className="readiness-insight-box is-weak">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {weak.category}: {weak.subject}
                          </span>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                            {weak.name}
                          </h3>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#c2410c',
                          background: '#ffedd5',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}>
                          {weak.priority || 'Action Needed'}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px', lineHeight: 1.45 }}>
                        {weak.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px' }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span>{weak.note}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Est. Study: <b>{weak.estimatedHours || '2 hrs'}</b>
                      </span>
                      <Link
                        to={
                          weak.hubTopicId && targetCompanyId
                            ? `/company-prep?company=${targetCompanyId}&topic=${weak.hubTopicId}`
                            : (targetCompanyId ? `/company-prep?company=${targetCompanyId}` : '/company-prep')
                        }
                        className="button primary"
                        style={{ fontSize: '11px', padding: '5px 12px' }}
                      >
                        Revise in Hub <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  No Critical Weak Areas Detected!
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  You have not recorded significant mistakes or low-accuracy topics in your submitted assessments.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEDICATED STRONG AREAS */}
        {activeTab === 'strong' && (
          <div>
            {strongAreas.length > 0 ? (
              <div className="readiness-strong-grid">
                {strongAreas.map((strong, idx) => (
                  <div key={idx} className="readiness-insight-box is-strong">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {strong.category}: {strong.subject}
                          </span>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                            {strong.name}
                          </h3>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          flexShrink: 0
                        }}>
                          {strong.badgeText || 'Strong Area'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 8px' }}>
                        <b style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a' }}>{strong.accuracy}%</b>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Accuracy</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#15803d' }}>
                        <Check size={13} color="#16a34a" />
                        <span>{strong.note}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <Link
                        to={
                          strong.hubTopicId && targetCompanyId
                            ? `/company-prep?company=${targetCompanyId}&topic=${strong.hubTopicId}`
                            : (targetCompanyId ? `/company-prep?company=${targetCompanyId}` : '/company-prep')
                        }
                        className="button secondary"
                        style={{ fontSize: '11px', padding: '5px 12px' }}
                      >
                        Review Notes <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <Clock size={32} color="#6366f1" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  No High-Confidence Strong Areas Yet
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
                  Complete more mock assessment questions with &ge; 70% accuracy to establish verified strengths.
                </p>
                <Link to="/mock-tests" className="button primary" style={{ fontSize: '12px', display: 'inline-flex' }}>
                  <FileCheck2 size={13} /> Take Mock Test
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recruitment Round Readiness for Target Company */}
      {roundReadiness && roundReadiness.length > 0 && (
        <section className="readiness-section-card">
          <div className="readiness-card-header">
            <div>
              <span className="section-eyebrow" style={{ color: '#2563eb' }}>
                OFFICIAL RECRUITMENT STAGES
              </span>
              <h2>Recruitment Round Readiness for {targetCompanyName}</h2>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Mapped to official placement round criteria
            </span>
          </div>

          <div className="readiness-rounds-grid">
            {roundReadiness.map((rnd, idx) => (
              <div key={idx} className={`readiness-round-box ${rnd.status === 'Completed' ? 'is-done' : (rnd.status === 'In Progress' ? 'is-progress' : '')}`}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Round {rnd.roundNumber}
                    </span>
                    <span className={`status-pill ${rnd.status === 'Completed' ? 'good' : (rnd.status === 'In Progress' ? 'attention' : 'pending')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {rnd.status}
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    {rnd.name}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    {rnd.roundType}
                  </span>
                  <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                    {rnd.detail}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '6px' }}>
                  {rnd.roundType === 'Online Assessment' ? (
                    <Link to="/mock-tests" className="button secondary" style={{ fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                      <FileCheck2 size={12} /> View Round Tests
                    </Link>
                  ) : (
                    <Link to="/company-prep" className="button secondary" style={{ fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                      <BookOpen size={12} /> Study Round Topics
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION D: What Should I Do Next? (Max 3 Prioritized Actions)
          ========================================================================= */}
      <section className="readiness-section-card">
        <div className="readiness-card-header">
          <div>
            <span className="section-eyebrow" style={{ color: '#ea580c' }}>
              SECTION D · RECOMMENDED NEXT STEPS
            </span>
            <h2>What Should I Do Next?</h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Prioritized by lowest-accuracy tested subjects and next roadmap milestones
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
          Follow these three clear actions to systematically eliminate weak spots and advance your preparation.
        </p>

        <div className="readiness-actions-grid">
          {nextActions.map((action, idx) => (
            <div key={idx} className="readiness-action-box">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="status-pill" style={{
                    background: idx === 0 ? '#ffedd5' : (idx === 1 ? '#eff6ff' : '#f1f5f9'),
                    color: idx === 0 ? '#c2410c' : (idx === 1 ? '#1d4ed8' : '#334155'),
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {action.badge || `Priority ${idx + 1}`}
                  </span>
                  {action.estimatedHours && (
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {action.estimatedHours}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  {action.title}
                </h3>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  {action.description}
                </p>
              </div>

              <div>
                <Link
                  to={action.actionLink || '/roadmap'}
                  className={idx === 0 ? 'button primary' : 'button secondary'}
                  style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}
                >
                  {action.actionText || 'Proceed'} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Methodology & Integrity Footer */}
      <footer style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: '#64748b',
        fontSize: '12px',
        lineHeight: 1.5
      }}>
        <ShieldCheck size={22} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
            Evidence-Based Transparency Guarantee
          </strong>
          HireVerse separates topic syllabus coverage and mock assessment accuracy into honest, independent metrics. We never combine them using arbitrary formulas or fabricate selection probabilities.
        </div>
      </footer>
    </div>
  )
}

export default ReadinessPage
