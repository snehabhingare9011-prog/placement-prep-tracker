import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  ShieldCheck,
  Milestone,
  BookOpen,
  Layers,
  Award
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function ReadinessPage() {
  const { user } = useAuth()
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(true)

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'
  const targetCompanyName = user?.targetCompany?.name || readiness?.targetCompany || 'Target Goal'

  useEffect(() => {
    async function loadReadiness() {
      setLoading(true)
      try {
        const res = await api.readiness.getOverall({ companyId: targetCompanyId, role: targetRole })
        if (res.success && res.readiness) {
          setReadiness(res.readiness)
        }
      } catch (err) {
        console.error('Failed to load readiness data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReadiness()
  }, [targetCompanyId, targetRole])

  if (loading) {
    return (
      <div className="readiness-loading">
        <PageHeader eyebrow="READINESS ANALYSIS" title="Evaluating verifiable preparation score..." />
        <SkeletonLoader rows={6} height={60} />
      </div>
    )
  }

  const hasData = readiness?.hasEnoughData
  const score = hasData ? readiness.overallScore : null
  const metrics = readiness?.metrics || {}

  return (
    <div className="readiness-page">
      <PageHeader
        eyebrow={`PREPARATION READINESS · ${targetCompanyName.toUpperCase()} · ${targetRole.toUpperCase()}`}
        title={`Know exactly where you stand for ${targetCompanyName}.`}
        description="Your transparent preparation score is calculated from curriculum topics completed (40%), mock assessment results (40%), and roadmap milestones (20%)."
      >
        <Link to="/company-prep" className="button secondary">
          <BookOpen size={15} /> Preparation Hub
        </Link>
        <Link to="/mock-tests" className="button">
          <FileCheck2 size={15} /> Take Mock Test
        </Link>
      </PageHeader>

      {/* When Insufficient Data: Guided Calibration Checklist */}
      {!hasData ? (
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
              <Target size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Complete some learning topics and take a mock test to start tracking your preparation.
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                To calculate an accurate readiness score for {targetCompanyName}, HireVerse requires baseline learning and assessment activity.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}>
            {/* Requirement 1: Preparation Hub Topics */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>1. Curriculum Topics</strong>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: (metrics.curriculumTopicsCompleted || 0) >= 2 ? '#16a34a' : '#d97706'
                }}>
                  {metrics.curriculumTopicsCompleted || 0} / 2 Completed
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
                Study foundational topics in the Preparation Hub and mark them complete as you master concepts.
              </p>
              <Link to="/company-prep" className="button secondary" style={{ fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                <BookOpen size={13} /> Open Preparation Hub
              </Link>
            </div>

            {/* Requirement 2: Mock Assessment */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>2. Mock Assessment</strong>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: (metrics.testsCompleted || 0) >= 1 ? '#16a34a' : '#d97706'
                }}>
                  {metrics.testsCompleted || 0} / 1 Completed
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
                Complete a timed screening test to benchmark exam speed, negative marking, and section scores.
              </p>
              <Link to="/mock-tests" className="button secondary" style={{ fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                <FileCheck2 size={13} /> Take First Mock Test
              </Link>
            </div>

            {/* Requirement 3: Roadmap Milestones */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>3. Roadmap Milestones</strong>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: (metrics.roadmapCompletion || 0) >= 10 ? '#16a34a' : '#d97706'
                }}>
                  {metrics.roadmapCompletion || 0}% Progress
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
                Follow your staged 4-phase preparation milestones for {targetCompanyName}.
              </p>
              <Link to="/roadmap" className="button secondary" style={{ fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                <Milestone size={13} /> View Roadmap
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main Score & Component Breakdown Grid */}
      <section className="readiness-page-grid">
        <article className="readiness-main">
          <div className="readiness-number">
            <span>PREPARATION READINESS</span>
            {hasData ? (
              <>
                <b>{score}<small>/ 100</small></b>
                <p>{readiness?.statusLabel || 'On track for campus selection'}</p>
              </>
            ) : (
              <>
                <b style={{ fontSize: '28px', color: '#94a3b8' }}>Pending</b>
                <p style={{ color: '#64748b' }}>Complete baseline activities above</p>
              </>
            )}
          </div>

          <div className="readiness-detail">
            <h3>Subject Syllabus Breakdown</h3>
            {readiness?.skillsBreakdown?.map(skill => (
              <ProgressBar
                key={skill.name}
                label={`${skill.name} (${skill.attempted || 0} questions/topics covered)`}
                value={skill.score}
                tone={skill.status === 'strong' ? 'green' : skill.status === 'needs work' ? 'orange' : 'blue'}
              />
            ))}
          </div>
        </article>

        {/* Calculation Details */}
        <aside className="readiness-note">
          <h2>Transparent Calculation Logic</h2>
          <p>
            {readiness?.formulaExplanation || 'Preparation Score = (40% Curriculum Topics) + (40% Mock Test Average) + (20% Roadmap Milestones)'}
          </p>

          <div className="readiness-metrics-card">
            <div>
              <span>Curriculum Topics (40%)</span>
              <b>{metrics.curriculumTopicsCompleted || 0} / {metrics.totalCurriculumTopics || 0}</b>
            </div>
            <div>
              <span>Mock Test Average (40%)</span>
              <b>{metrics.averageTestScore || 0}%</b>
            </div>
            <div>
              <span>Roadmap Milestones (20%)</span>
              <b>{metrics.roadmapCompletion || 0}%</b>
            </div>
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#475569', lineHeight: 1.45 }}>
            <strong>Component Meanings:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '16px', display: 'grid', gap: '4px' }}>
              <li><b>Curriculum Topics (40%):</b> Proportion of syllabus topics marked completed.</li>
              <li><b>Mock Tests (40%):</b> Average percentage scored on timed screening assessments.</li>
              <li><b>Roadmap Milestones (20%):</b> Staged curriculum milestones finished in order.</li>
            </ul>
          </div>

          <Link to="/company-prep" className="button secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
            <BookOpen size={15} /> Study in Preparation Hub
          </Link>
        </aside>
      </section>

      {/* Strengths & Weak Areas Grid */}
      <section className="strengths-grid">
        {/* Strong Areas */}
        <article className="strengths-panel">
          <h2>Verified Strong Areas</h2>
          {readiness?.strengths && readiness.strengths.length > 0 ? (
            readiness.strengths.map(s => (
              <div key={s.name} className="skill-state">
                <b className="strong">{s.score}%</b>
                <div>
                  <strong>{s.name}</strong>
                  <span>{s.note}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-copy">Study topics and complete mock assessments to establish high-confidence strong areas.</p>
          )}
        </article>

        {/* Needs Improvement */}
        <article className="strengths-panel">
          <h2>Identified Focus Areas</h2>
          {readiness?.weakAreas && readiness.weakAreas.length > 0 ? (
            readiness.weakAreas.map(w => (
              <div key={w.name} className="skill-state">
                <b className="attention">{w.score}%</b>
                <div>
                  <strong>{w.name}</strong>
                  <span>{w.note}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-copy">No severe bottlenecks identified.</p>
          )}
        </article>

        {/* Recommended Actions */}
        <article className="action-list">
          <h2>Recommended Next Actions</h2>
          <ol>
            {readiness?.recommendedActions?.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  )
}

export default ReadinessPage
