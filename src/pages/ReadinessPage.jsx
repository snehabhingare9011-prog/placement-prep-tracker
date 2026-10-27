import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Code2,
  FileCheck2,
  ShieldCheck
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

  useEffect(() => {
    async function loadReadiness() {
      setLoading(true)
      try {
        const res = await api.readiness.getOverall()
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
  }, [])

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

  return (
    <div className="readiness-page">
      <PageHeader
        eyebrow="PREPARATION READINESS"
        title="Know exactly where you stand."
        description="Your transparent readiness score combines practice accuracy, mock assessments, roadmap completion, and company subject coverage."
      >
        <Link to="/roadmap" className="button">
          Follow Recommended Plan <ArrowRight size={14} />
        </Link>
      </PageHeader>

      {/* Main Score & Skills Grid */}
      <section className="readiness-page-grid">
        <article className="readiness-main">
          <div className="readiness-number">
            <span>OVERALL READINESS</span>
            {hasData ? (
              <>
                <b>{score}<small>/ 100</small></b>
                <p>{readiness?.statusLabel || 'On track for campus selection'}</p>
              </>
            ) : (
              <>
                <b style={{ fontSize: '28px', color: 'var(--muted)' }}>Pending</b>
                <p>Not enough activity yet to compute a verifiable score.</p>
              </>
            )}
          </div>

          <div className="readiness-detail">
            <h3>Subject-Wise Performance</h3>
            {readiness?.skillsBreakdown?.map(skill => (
              <ProgressBar
                key={skill.name}
                label={`${skill.name} (${skill.attempted || 0} attempts)`}
                value={skill.score}
                tone={skill.status === 'strong' ? 'green' : skill.status === 'needs work' ? 'orange' : 'blue'}
              />
            ))}
          </div>
        </article>

        {/* Side Note / Formula */}
        <aside className="readiness-note">
          <h2>Transparent Scoring Logic</h2>
          <p>
            {readiness?.formulaExplanation || 'Readiness = 35% Practice Accuracy + 30% Mock Test Average + 20% Roadmap Progress + 15% Subject Coverage.'}
          </p>
          <div className="readiness-metrics-card">
            <div>
              <span>Practice Questions Attempted</span>
              <b>{readiness?.metrics?.practiceCount || 0}</b>
            </div>
            <div>
              <span>Practice Accuracy</span>
              <b>{readiness?.metrics?.practiceAccuracy || 0}%</b>
            </div>
            <div>
              <span>Mock Tests Completed</span>
              <b>{readiness?.metrics?.testsCompleted || 0}</b>
            </div>
            <div>
              <span>Curriculum Progress</span>
              <b>{readiness?.metrics?.roadmapCompletion || 0}%</b>
            </div>
          </div>

          <Link to="/practice" className="button secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
            <Code2 size={15} /> Practice Weak Areas
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
            <p className="empty-copy">Keep practicing to establish high-confidence strong topics.</p>
          )}
        </article>

        {/* Needs Improvement */}
        <article className="strengths-panel">
          <h2>Identified Bottlenecks</h2>
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
