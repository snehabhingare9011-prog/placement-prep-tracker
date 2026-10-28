import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Building2,
  FileCheck2,
  ArrowRight,
  BookOpen,
  Milestone,
  Target,
  ChevronRight,
  Layers,
  HelpCircle,
  TrendingDown,
  Minus,
  Lightbulb
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [analytics, setAnalytics] = useState(null)
  const [curriculumData, setCurriculumData] = useState(null)
  const [curriculumProgress, setCurriculumProgress] = useState(null)
  const [testHistory, setTestHistory] = useState([])
  const [readinessData, setReadinessData] = useState(null)
  const [roadmap, setRoadmap] = useState(null)

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'
  const companyName = user?.targetCompany?.name || 'Selected Company'

  useEffect(() => {
    async function loadAllAnalytics() {
      setLoading(true)
      try {
        const [analyticsRes, curriculumRes, userProgressRes, testHistoryRes, readinessRes, roadmapRes] = await Promise.all([
          api.readiness.getStudentAnalytics({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          api.curriculum.getByCompany(targetCompanyId, [targetRole]).catch(() => ({ success: false })),
          api.curriculum.getUserProgress({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          api.tests.getHistory().catch(() => ({ success: false, history: [] })),
          api.readiness.getOverall({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          api.roadmaps.get({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false }))
        ])

        if (analyticsRes.success && analyticsRes.analytics) setAnalytics(analyticsRes.analytics)
        if (curriculumRes.success) setCurriculumData(curriculumRes)
        if (userProgressRes.success) setCurriculumProgress(userProgressRes)
        if (testHistoryRes.success && testHistoryRes.history) setTestHistory(testHistoryRes.history)
        if (readinessRes.success && readinessRes.readiness) setReadinessData(readinessRes.readiness)
        if (roadmapRes.success && roadmapRes.roadmap) setRoadmap(roadmapRes.roadmap)
      } catch (err) {
        console.error('Failed to load preparation analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAllAnalytics()
  }, [targetCompanyId, targetRole])

  if (loading) {
    return (
      <div className="analytics-loading">
        <PageHeader eyebrow="PREPARATION ANALYTICS" title="Loading your learning analytics..." />
        <SkeletonLoader rows={6} height={80} />
      </div>
    )
  }

  // --- 1. Topic Completion Metrics ---
  const allCurriculumTopics = curriculumData?.topics || []
  const completedTopicIds = curriculumProgress?.completedTopics || []
  const totalTopics = allCurriculumTopics.length || curriculumProgress?.totalTopics || 0
  const completedTopicsCount = completedTopicIds.length
  const remainingTopicsCount = Math.max(0, totalTopics - completedTopicsCount)
  const topicProgressPct = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0

  // --- 2. Subject-Wise Progress Breakdown ---
  const PILLARS = ['Aptitude', 'DSA', 'Core CS', 'Web & Technical', 'HR & Behavioral']
  const subjectBreakdown = PILLARS.map(pillar => {
    const topicsInPillar = allCurriculumTopics.filter(t => t.pillar === pillar)
    const completedInPillar = topicsInPillar.filter(t => completedTopicIds.includes(t.id)).length
    const totalInPillar = topicsInPillar.length
    const pct = totalInPillar > 0 ? Math.round((completedInPillar / totalInPillar) * 100) : 0
    return {
      pillar,
      completed: completedInPillar,
      total: totalInPillar,
      percentage: pct
    }
  }).filter(s => s.total > 0)

  // --- 3. Roadmap Milestone Progress ---
  const roadmapPhases = roadmap?.phases || []
  const allRoadmapTasks = roadmapPhases.flatMap(p => p.tasks || [])
  const completedTasks = allRoadmapTasks.filter(t => t.completed)
  const roadmapPct = roadmap?.progressPercentage || 0

  // --- 4. Mock Test Performance & History ---
  const testsCount = testHistory.length
  const latestAttempt = testHistory[0] || null
  const previousAttempt = testHistory[1] || null
  const latestScore = latestAttempt?.result?.percentage ?? null
  const previousScore = previousAttempt?.result?.percentage ?? null

  const averageTestScore = testsCount > 0
    ? Math.round(testHistory.reduce((acc, t) => acc + (t.result?.percentage || 0), 0) / testsCount)
    : null

  let trajectoryText = 'No tests taken yet'
  let trajectoryTone = 'neutral'
  let trajectoryDiff = 0

  if (testsCount >= 2 && latestScore !== null && previousScore !== null) {
    trajectoryDiff = latestScore - previousScore
    if (trajectoryDiff > 0) {
      trajectoryText = `Improved by +${trajectoryDiff}% compared to previous test (${previousScore}% → ${latestScore}%)`
      trajectoryTone = 'positive'
    } else if (trajectoryDiff < 0) {
      trajectoryText = `Declined by ${Math.abs(trajectoryDiff)}% compared to previous test (${previousScore}% → ${latestScore}%)`
      trajectoryTone = 'negative'
    } else {
      trajectoryText = `Maintained consistent score of ${latestScore}% across both attempts`
      trajectoryTone = 'neutral'
    }
  } else if (testsCount === 1) {
    trajectoryText = `First benchmark recorded (${latestScore}%). Complete a second assessment to track your score trajectory.`
    trajectoryTone = 'neutral'
  }

  // Section-wise breakdown of latest test
  const latestSections = latestAttempt?.result?.subjectBreakdown || []

  // --- 5. Next Learning Action Recommendations ---
  const nextIncompleteTopic = allCurriculumTopics.find(t => !completedTopicIds.includes(t.id))
  const nextIncompleteMilestone = allRoadmapTasks.find(t => !t.completed)

  const recommendations = []

  if (nextIncompleteTopic) {
    recommendations.push({
      title: `Study Next Topic: ${nextIncompleteTopic.title}`,
      reason: `${nextIncompleteTopic.importance} Importance · ${nextIncompleteTopic.pillar} syllabus module for ${companyName}.`,
      buttonText: 'Open in Preparation Hub',
      link: '/company-prep',
      icon: BookOpen
    })
  }

  if (testsCount === 0) {
    recommendations.push({
      title: 'Take Your First Timed Mock Assessment',
      reason: 'Benchmark your section pacing, negative marking, and score under real exam conditions.',
      buttonText: 'Start Mock Assessment',
      link: '/mock-tests',
      icon: FileCheck2
    })
  } else if (latestScore !== null && latestScore < 70) {
    recommendations.push({
      title: 'Review Incorrect Answers from Latest Test',
      reason: `Your last mock assessment scored ${latestScore}%. Reviewing detailed explanations prevents recurring mistakes.`,
      buttonText: 'Review Test Results',
      link: latestAttempt ? `/mock-result/${latestAttempt._id}` : '/mock-tests',
      icon: Award
    })
  }

  if (nextIncompleteMilestone) {
    recommendations.push({
      title: `Roadmap Milestone: ${nextIncompleteMilestone.title}`,
      reason: `Follow the recommended sequencing for ${companyName} (${nextIncompleteMilestone.estimatedMinutes || 30} mins).`,
      buttonText: 'View Roadmap',
      link: '/roadmap',
      icon: Milestone
    })
  }

  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="PREPARATION PROGRESS & ANALYTICS"
        title="Understand your learning progress and mock test performance."
        description={`Track syllabus topics completed for ${companyName}, roadmap milestones, and timed mock assessment outcomes.`}
      />

      {/* Summary KPI Cards */}
      <section className="progress-summary-grid">
        <article className="metric-card blue">
          <span>CURRICULUM TOPICS</span>
          <b>{completedTopicsCount} / {totalTopics}</b>
          <small>{topicProgressPct}% of syllabus completed</small>
        </article>

        <article className="metric-card green">
          <span>ROADMAP MILESTONES</span>
          <b>{completedTasks.length} / {allRoadmapTasks.length}</b>
          <small>{roadmapPct}% milestones completed</small>
        </article>

        <article className="metric-card orange">
          <span>MOCK ASSESSMENTS</span>
          <b>{testsCount}</b>
          <small>{averageTestScore !== null ? `Average: ${averageTestScore}%` : 'No tests taken'}</small>
        </article>

        <article className="metric-card blue">
          <span>PREPARATION SCORE</span>
          <b>{readinessData?.hasEnoughData ? `${readinessData.overallScore}/100` : 'Pending'}</b>
          <small>{readinessData?.statusLabel || 'Need baseline activity'}</small>
        </article>
      </section>

      {/* 1. Overall Curriculum Topic Completion */}
      <section className="section-panel" style={{ marginTop: '20px' }}>
        <div className="section-head">
          <div>
            <h2>Curriculum Topic Completion</h2>
            <span>Syllabus modules completed for {companyName} ({targetRole})</span>
          </div>
          <Link to="/company-prep" className="head-link">
            Open Preparation Hub <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>TOTAL TOPICS</span>
              <strong style={{ fontSize: '24px', color: '#1e293b' }}>{totalTopics}</strong>
              <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                Mapped for {targetRole}
              </small>
            </div>

            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'block' }}>COMPLETED</span>
              <strong style={{ fontSize: '24px', color: '#16a34a' }}>{completedTopicsCount}</strong>
              <small style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '2px' }}>
                Marked completed on server
              </small>
            </div>

            <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, display: 'block' }}>REMAINING</span>
              <strong style={{ fontSize: '24px', color: '#2563eb' }}>{remainingTopicsCount}</strong>
              <small style={{ fontSize: '11px', color: '#2563eb', display: 'block', marginTop: '2px' }}>
                Pending review & study
              </small>
            </div>

            <div style={{ background: '#faf5ff', padding: '14px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
              <span style={{ fontSize: '11px', color: '#9333ea', fontWeight: 600, display: 'block' }}>COMPLETION RATE</span>
              <strong style={{ fontSize: '24px', color: '#9333ea' }}>{topicProgressPct}%</strong>
              <small style={{ fontSize: '11px', color: '#9333ea', display: 'block', marginTop: '2px' }}>
                Of curriculum mastered
              </small>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Syllabus Completion Progress</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{completedTopicsCount} of {totalTopics} topics</span>
            </div>
            <ProgressBar value={topicProgressPct} tone="blue" showValue={false} height={10} />
          </div>
        </div>
      </section>

      {/* 2. Subject-Wise Progress Breakdown */}
      <section className="section-panel" style={{ marginTop: '20px' }}>
        <div className="section-head">
          <div>
            <h2>Subject-Wise Learning Progress</h2>
            <span>Curriculum topic completion by subject pillar</span>
          </div>
          <Link to="/company-prep" className="head-link">
            Study in Prep Hub <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
          {subjectBreakdown.map(subj => (
            <div
              key={subj.pillar}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                  {subj.pillar}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {subj.completed} of {subj.total} topics completed
                </span>
              </div>

              <div style={{ width: '220px', flex: '0 0 220px' }}>
                <ProgressBar
                  value={subj.percentage}
                  tone={subj.percentage === 100 ? 'green' : 'blue'}
                  showValue={true}
                  height={6}
                />
              </div>

              <div>
                <Link
                  to="/company-prep"
                  className="button secondary"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  Study Topics <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Mock Test Performance & Trajectory */}
      <section className="section-panel" style={{ marginTop: '20px' }}>
        <div className="section-head">
          <div>
            <h2>Mock Assessment Performance</h2>
            <span>Timed assessment results and score trajectory</span>
          </div>
          <Link to="/mock-tests" className="head-link">
            Assessment Catalog <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ marginTop: '16px' }}>
          {testsCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <FileCheck2 size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '0 0 6px' }}>No mock assessments completed yet</h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '520px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                Take your first timed mock test to simulate screening rounds and measure your exam pacing, accuracy, and score.
              </p>
              <Link to="/mock-tests" className="button" style={{ display: 'inline-flex' }}>
                <FileCheck2 size={15} /> Start First Mock Assessment
              </Link>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '18px'
              }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>TESTS SUBMITTED</span>
                  <strong style={{ fontSize: '24px', color: '#0f172a' }}>{testsCount}</strong>
                  <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Server-evaluated assessments
                  </small>
                </div>

                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'block' }}>LATEST TEST SCORE</span>
                  <strong style={{ fontSize: '24px', color: '#16a34a' }}>
                    {latestScore !== null ? `${latestScore}%` : 'N/A'}
                  </strong>
                  <small style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '2px' }}>
                    {latestAttempt ? (latestAttempt.test?.title || 'Mock Test') : ''}
                  </small>
                </div>

                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, display: 'block' }}>AVERAGE SCORE</span>
                  <strong style={{ fontSize: '24px', color: '#2563eb' }}>
                    {averageTestScore !== null ? `${averageTestScore}%` : 'N/A'}
                  </strong>
                  <small style={{ fontSize: '11px', color: '#2563eb', display: 'block', marginTop: '2px' }}>
                    Across all {testsCount} test attempts
                  </small>
                </div>
              </div>

              {/* Trajectory comparison card */}
              <div style={{
                background: trajectoryTone === 'positive' ? '#f0fdf4' : trajectoryTone === 'negative' ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${trajectoryTone === 'positive' ? '#bbf7d0' : trajectoryTone === 'negative' ? '#fecaca' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  color: trajectoryTone === 'positive' ? '#16a34a' : trajectoryTone === 'negative' ? '#dc2626' : '#64748b'
                }}>
                  {trajectoryTone === 'positive' && <TrendingUp size={22} />}
                  {trajectoryTone === 'negative' && <TrendingDown size={22} />}
                  {trajectoryTone === 'neutral' && <Minus size={22} />}
                </div>
                <div>
                  <strong style={{
                    fontSize: '13px',
                    color: trajectoryTone === 'positive' ? '#166534' : trajectoryTone === 'negative' ? '#991b1b' : '#334155',
                    display: 'block'
                  }}>
                    Score Trajectory:
                  </strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    {trajectoryText}
                  </span>
                </div>
              </div>

              {/* Section-wise performance of latest test */}
              {latestSections.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                    Section-Wise Breakdown (from latest test: {latestAttempt?.test?.title || 'Assessment'})
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {latestSections.map(sec => (
                      <div key={sec.subject} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{sec.subject}</span>
                          <span style={{ color: '#64748b' }}>
                            <b>{sec.correctQuestions}</b> of <b>{sec.totalQuestions}</b> correct ({sec.percentage}%)
                          </span>
                        </div>
                        <ProgressBar
                          value={sec.percentage}
                          tone={sec.percentage >= 75 ? 'green' : sec.percentage < 60 ? 'orange' : 'blue'}
                          showValue={false}
                          height={6}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Target Company Readiness Comparison */}
      <section className="section-panel" style={{ marginTop: '20px' }}>
        <div className="section-head">
          <div>
            <h2>Target Company Preparation Comparison</h2>
            <span>Calculated readiness evaluated against each company's skill requirements</span>
          </div>
        </div>

        <div className="company-comparison-list" style={{ marginTop: '14px' }}>
          {analytics?.companyComparison?.map(comp => {
            const isTarget = comp.isCurrentTarget || (targetCompanyId && comp.id?.toString() === targetCompanyId.toString())
            return (
              <div
                key={comp.id}
                className={`comp-row ${isTarget ? 'active-target-comp' : ''}`}
                style={isTarget ? { background: '#f0f7ff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #bfdbfe' } : {}}
              >
                <CompanyMark company={comp} />
                <span>
                  {comp.name}
                  {isTarget && (
                    <small style={{ marginLeft: '6px', color: '#2563eb', fontWeight: 700, fontSize: '11px' }}>
                      (Active Target)
                    </small>
                  )}
                </span>
                <b>{comp.readiness}%</b>
                <ProgressBar
                  value={comp.readiness}
                  tone={comp.readiness >= 75 ? 'green' : 'blue'}
                  showValue={false}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Recommended Next Steps */}
      <section className="section-panel" style={{ marginTop: '20px', borderLeft: '4px solid #2563eb' }}>
        <div className="section-head">
          <div>
            <h2>Recommended Next Learning Steps</h2>
            <span>Actionable suggestions based on your remaining topics, roadmap sequence, and test results</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: '1 1 300px' }}>
                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '6px', flexShrink: 0 }}>
                  <rec.icon size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                    {rec.title}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                    {rec.reason}
                  </p>
                </div>
              </div>

              <div>
                <Link to={rec.link} className="button" style={{ fontSize: '12px' }}>
                  {rec.buttonText} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
