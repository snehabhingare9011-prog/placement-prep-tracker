import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Milestone,
  BookOpen,
  Building2,
  Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function ReadinessPage() {
  const { user } = useAuth()
  const [readiness, setReadiness] = useState(null)
  const [companyDetails, setCompanyDetails] = useState(null)
  const [availableTestCount, setAvailableTestCount] = useState(null)
  const [availableCompanyTests, setAvailableCompanyTests] = useState([])
  const [loading, setLoading] = useState(true)

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'
  const targetCompanyName = user?.targetCompany?.name || companyDetails?.name || readiness?.targetCompany || 'Target Goal'

  useEffect(() => {
    async function loadReadinessAndCompany() {
      setLoading(true)
      try {
        const [readinessRes, companyRes, testsRes] = await Promise.all([
          api.readiness.getOverall({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          targetCompanyId ? api.companies.getById(targetCompanyId).catch(() => ({ success: false })) : Promise.resolve({ success: false }),
          api.tests.getAll().catch(() => ({ success: false }))
        ])

        if (readinessRes.success && readinessRes.readiness) {
          setReadiness(readinessRes.readiness)
        }

        if (companyRes.success && companyRes.company) {
          setCompanyDetails(companyRes.company)
        } else if (user?.targetCompany?.name) {
          setCompanyDetails(user.targetCompany)
        }

        if (testsRes.success && Array.isArray(testsRes.tests)) {
          let companyTests = testsRes.tests.filter(test => {
            if (!targetCompanyId) return false
            const testCompId = (test.company?._id || test.company)?.toString()
            return testCompId === targetCompanyId.toString() && test.isPublished !== false
          })
          if (companyTests.length === 0 && targetCompanyId) {
            companyTests = testsRes.tests.filter(test => !test.company && test.isPublished !== false)
          }
          setAvailableTestCount(companyTests.length)
          setAvailableCompanyTests(companyTests)
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
    availableAssessments: readiness?.metrics?.availableAssessments || 0,
    submittedAttempts: readiness?.metrics?.submittedAttempts || readiness?.metrics?.testsCompleted || 0,
    uniqueAssessmentsCompleted: readiness?.metrics?.uniqueAssessmentsCompleted || 0,
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

  const availableAssessments = (mockPerformance.availableAssessments !== undefined && mockPerformance.availableAssessments !== null && mockPerformance.availableAssessments > 0)
    ? mockPerformance.availableAssessments
    : (availableTestCount !== null && availableTestCount > 0 ? availableTestCount : (mockPerformance.availableAssessments ?? readiness?.metrics?.availableAssessments ?? 0))
  const submittedAttempts = mockPerformance.submittedAttempts ?? mockPerformance.testsCompleted ?? readiness?.metrics?.submittedAttempts ?? 0
  const uniqueAssessmentsCompleted = mockPerformance.uniqueAssessmentsCompleted ?? readiness?.metrics?.uniqueAssessmentsCompleted ?? 0

  // Section B Assessment List (strictly 1 row per eligible assessment, latest attempt only)
  const assessmentsList = (mockPerformance.assessmentsList && mockPerformance.assessmentsList.length > 0)
    ? mockPerformance.assessmentsList
    : availableCompanyTests.map(test => {
        const testIdStr = test._id.toString()
        const recentMatch = (mockPerformance.recentTestHistory || []).find(h => {
          const hId = (h.test?._id || h.test || h.testId)?.toString()
          return hId === testIdStr || (h.testTitle && test.title && h.testTitle.trim().toLowerCase() === test.title.trim().toLowerCase())
        })
        if (recentMatch) {
          const correct = recentMatch.correctCount ?? 0
          const incorrect = recentMatch.incorrectCount ?? 0
          const attempted = correct + incorrect
          const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null
          return {
            testId: test._id,
            title: test.title,
            status: 'Completed',
            attempted: true,
            correctCount: correct,
            incorrectCount: incorrect,
            unansweredCount: recentMatch.unansweredCount ?? 0,
            accuracy,
            submittedAt: recentMatch.submittedAt
          }
        }
        return {
          testId: test._id,
          title: test.title,
          status: 'Not Attempted',
          attempted: false,
          correctCount: 0,
          incorrectCount: 0,
          unansweredCount: 0,
          accuracy: null
        }
      })

  // Overall Accuracy across latest eligible attempts (unanswered questions excluded)
  const overallAccuracy = mockPerformance.overallAccuracy !== undefined
    ? mockPerformance.overallAccuracy
    : (() => {
        let totalCorrect = 0
        let totalAttempted = 0
        assessmentsList.forEach(a => {
          if (a.attempted && a.accuracy !== null) {
            totalCorrect += (a.correctCount || 0)
            totalAttempted += ((a.correctCount || 0) + (a.incorrectCount || 0))
          }
        })
        return totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : null
      })()

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
          <div className="readiness-header-stat-item highlight-score">
            <span>Readiness Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: '#2563eb', fontSize: '18px' }}>
                {readiness?.overallScore !== null && readiness?.overallScore !== undefined ? `${readiness.overallScore}%` : `${preparation.percentage}%`}
              </strong>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: (readiness?.overallScore ?? preparation.percentage) >= 70 ? '#dcfce7' : ((readiness?.overallScore ?? preparation.percentage) >= 50 ? '#eff6ff' : '#fef3c7'),
                color: (readiness?.overallScore ?? preparation.percentage) >= 70 ? '#15803d' : ((readiness?.overallScore ?? preparation.percentage) >= 50 ? '#1d4ed8' : '#b45309')
              }}>
                {readiness?.statusLabel || ((readiness?.overallScore ?? preparation.percentage) >= 70 ? 'Ready' : ((readiness?.overallScore ?? preparation.percentage) >= 50 ? 'Good' : 'Progress'))}
              </span>
            </div>
          </div>
          <div className="readiness-header-stat-item">
            <span>Roadmap Progress</span>
            <strong>{preparation.completedTopics} / {preparation.totalTopics}</strong>
          </div>
          <div className="readiness-header-stat-item">
            <span>Mock Assessments</span>
            <strong>
              {uniqueAssessmentsCompleted} / {availableAssessments}
              <small style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginLeft: '4px' }}>
                ({submittedAttempts} attempt{submittedAttempts === 1 ? '' : 's'})
              </small>
            </strong>
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
        <article className="readiness-section-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="readiness-card-header">
            <div>
              <span className="section-eyebrow" style={{ color: '#2563eb' }}>
                SECTION A · SYLLABUS & ROADMAP
              </span>
              <h2>My Preparation Progress</h2>
            </div>
            <BookOpen size={20} color="#2563eb" />
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.45 }}>
            Verified topic completion based on saved checklist items on your preparation roadmap.
          </p>

          {/* Donut Chart and Topic Summary Box */}
          <div className="readiness-syllabus-summary-card">
            <div className="readiness-progress-circle-wrap">
              <svg width="124" height="124" viewBox="0 0 124 124" style={{ overflow: 'visible' }}>
                <circle
                  cx="62"
                  cy="62"
                  r="51"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                />
                <circle
                  cx="62"
                  cy="62"
                  r="51"
                  fill="transparent"
                  stroke={preparation.percentage === 100 ? '#16a34a' : '#2563eb'}
                  strokeWidth="10"
                  strokeDasharray="320.44"
                  strokeDashoffset={320.44 - (320.44 * Math.min(100, Math.max(0, preparation.percentage || 0))) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 62 62)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
                <text
                  x="62"
                  y="55"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="25"
                  fontWeight="800"
                  fill="#0f172a"
                  letterSpacing="-0.5"
                >
                  {preparation.percentage}%
                </text>
                <text
                  x="62"
                  y="74"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#64748b"
                  letterSpacing="0.8"
                >
                  DONE
                </text>
              </svg>
            </div>

            <div className="readiness-progress-summary-info">
              <span className="readiness-progress-eyebrow">
                Syllabus Topic Completion
              </span>
              <strong className="readiness-progress-count">
                {preparation.completedTopics} of {preparation.totalTopics} Topics
              </strong>
              <p className="readiness-progress-desc">
                {preparation.completedTopics === preparation.totalTopics && preparation.totalTopics > 0
                  ? 'All syllabus topics have been completed across all sequential preparation rounds.'
                  : `${preparation.totalTopics - preparation.completedTopics} topic${(preparation.totalTopics - preparation.completedTopics) === 1 ? '' : 's'} remaining on your customized roadmap.`}
              </p>
            </div>
          </div>

          {/* Phase Progression Cards */}
          {preparation.phasesProgress && preparation.phasesProgress.length > 0 && (
            <div className="readiness-phases-grid">
              {preparation.phasesProgress.map((phase) => {
                const isCompleted = phase.status === 'Completed'
                const isActive = phase.status === 'Active'
                const roundTitle = phase.name.replace(/^Phase\s*\d+:\s*/i, '')

                return (
                  <div
                    key={phase.phaseNumber}
                    className={`readiness-phase-chip ${isCompleted ? 'is-completed' : (isActive ? 'is-active' : 'is-upcoming')}`}
                  >
                    <div className="readiness-phase-top">
                      <span className="readiness-phase-label">Phase {phase.phaseNumber}</span>
                      {isCompleted && (
                        <Check size={13} strokeWidth={2.5} color="#16a34a" />
                      )}
                    </div>
                    <div className="readiness-phase-title" title={roundTitle}>
                      {roundTitle}
                    </div>
                    <div className="readiness-phase-stats">
                      <span>{phase.completed}/{phase.total} done ({phase.percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
            <Link
              to="/roadmap"
              className="button secondary"
              style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}
            >
              <Milestone size={14} /> Update Progress on Full Roadmap <ArrowRight size={13} />
            </Link>
          </div>
        </article>

        {/* =========================================================================
            SECTION B: My Mock-Test Performance
            ========================================================================= */}
        <article className="readiness-section-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="readiness-card-header">
            <div>
              <span className="section-eyebrow" style={{ color: '#2563eb' }}>
                SECTION B · MOCK-TEST PERFORMANCE
              </span>
              <h2>My Mock-Test Performance</h2>
            </div>
            <FileCheck2 size={20} color="#2563eb" />
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
            Assessment accuracy calculated from your latest eligible attempt for each mock test. Unanswered questions are excluded from accuracy.
          </p>

          {/* Overall Accuracy Card with Circular Blue Donut Progress Indicator */}
          <div className="overall-accuracy-card">
            <div style={{ width: '104px', height: '104px', flexShrink: 0, position: 'relative', display: 'grid', placeItems: 'center' }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ overflow: 'visible' }}>
                <circle
                  cx="52"
                  cy="52"
                  r="42"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="8.5"
                />
                <circle
                  cx="52"
                  cy="52"
                  r="42"
                  fill="transparent"
                  stroke={overallAccuracy === 100 ? '#16a34a' : '#2563eb'}
                  strokeWidth="8.5"
                  strokeDasharray="263.89"
                  strokeDashoffset={overallAccuracy !== null ? 263.89 - (263.89 * Math.min(100, Math.max(0, overallAccuracy))) / 100 : 263.89}
                  strokeLinecap="round"
                  transform="rotate(-90 52 52)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
                <text
                  x="52"
                  y="48"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="21"
                  fontWeight="800"
                  fill="#0f172a"
                >
                  {overallAccuracy !== null ? `${overallAccuracy}%` : 'N/A'}
                </text>
                <text
                  x="52"
                  y="65"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#64748b"
                  letterSpacing="0.4"
                >
                  ACCURACY
                </text>
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '3px' }}>
                OVERALL ACCURACY
              </span>
              <strong style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', display: 'block', marginBottom: '3px' }}>
                {overallAccuracy !== null ? `${overallAccuracy}%` : 'N/A'}
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                {overallAccuracy !== null ? 'Across latest attempts' : 'No tests attempted yet'}
              </p>
            </div>
          </div>

          {/* Secondary Stats Strip: Assessments Completed & Total Attempts */}
          <div className="mock-perf-substats-strip">
            <div className="mock-perf-substat-box">
              <span className="mock-perf-summary-label">Assessments Completed</span>
              <strong className="mock-perf-summary-val" style={{ fontSize: '18px' }}>
                {uniqueAssessmentsCompleted} of {availableAssessments}
              </strong>
              <span className="mock-perf-summary-sub">
                Distinct mock tests
              </span>
            </div>

            <div className="mock-perf-substat-box">
              <span className="mock-perf-summary-label">Total Attempts</span>
              <strong className="mock-perf-summary-val" style={{ fontSize: '18px' }}>
                {submittedAttempts}
              </strong>
              <span className="mock-perf-summary-sub">
                {submittedAttempts > uniqueAssessmentsCompleted ? `Includes ${submittedAttempts - uniqueAssessmentsCompleted} retake(s)` : 'Submitted attempts'}
              </span>
            </div>
          </div>

          {/* Assessment List (Every eligible assessment stacked vertically) */}
          <div className="mock-perf-assessments-list">
            {assessmentsList.length > 0 ? (
              assessmentsList.map((test, idx) => (
                <div
                  key={test.testId || idx}
                  className={`mock-perf-assessment-row ${test.status === 'Completed' ? 'is-completed' : 'is-unattempted'}`}
                >
                  <div className="assessment-row-left">
                    <span className={`assessment-index-pill ${test.status === 'Completed' ? '' : 'unattempted'}`}>
                      {idx + 1}
                    </span>
                    <div className="assessment-row-info">
                      <h4 className="assessment-row-title">{test.title}</h4>
                      <div className="assessment-row-meta">
                        {test.status === 'Completed' ? (
                          <>
                            <span><b>{test.correctCount}</b> correct, <b>{test.incorrectCount}</b> incorrect</span>
                            {test.unansweredCount > 0 && <span>· {test.unansweredCount} unanswered</span>}
                            {test.submittedAt && (
                              <span>· {new Date(test.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            )}
                          </>
                        ) : (
                          <span>Not Attempted · Ready for practice</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="assessment-row-right">
                    {test.status === 'Completed' ? (
                      <div className="assessment-accuracy-block">
                        <strong className={`assessment-accuracy-val ${test.accuracy >= 70 ? 'strong' : (test.accuracy < 50 ? 'needs-work' : 'moderate')}`}>
                          {test.accuracy !== null ? `${test.accuracy}%` : 'N/A'}
                        </strong>
                        <span className="assessment-status-badge completed">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      </div>
                    ) : (
                      <div className="assessment-accuracy-block">
                        <span className="assessment-status-badge unattempted">
                          Not Attempted
                        </span>
                        <Link to="/mock-tests" className="assessment-take-btn">
                          Take Test <ArrowRight size={11} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                No eligible mock assessments currently available for {activeCo.name}.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default ReadinessPage
