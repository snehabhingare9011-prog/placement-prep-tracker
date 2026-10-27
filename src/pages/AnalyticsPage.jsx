import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Code2,
  Building2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const res = await api.readiness.getStudentAnalytics()
        if (res.success && res.analytics) {
          setAnalytics(res.analytics)
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="analytics-loading">
        <PageHeader eyebrow="PREPARATION ANALYTICS" title="Loading activity trends..." />
        <SkeletonLoader rows={5} height={80} />
      </div>
    )
  }

  const weekly = analytics?.weeklyActivity || [
    { day: 'Mon', value: 40 },
    { day: 'Tue', value: 65 },
    { day: 'Wed', value: 30 },
    { day: 'Thu', value: 85 },
    { day: 'Fri', value: 50 },
    { day: 'Sat', value: 75 },
    { day: 'Sun', value: 20 }
  ]

  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="PREPARATION ANALYTICS"
        title="Insights that improve your next session."
        description="Track effort, study consistency, accuracy trends, and target company comparisons."
      />

      {/* Summary Metrics Row */}
      <section className="progress-summary-grid">
        <article className="metric-card blue">
          <span>QUESTIONS SOLVED</span>
          <b>{analytics?.totalQuestionsSolved || 0}</b>
          <small>Total verified solves</small>
        </article>
        <article className="metric-card green">
          <span>QUESTION ACCURACY</span>
          <b>{analytics?.accuracyPercentage || 0}%</b>
          <small>Across all attempts</small>
        </article>
        <article className="metric-card orange">
          <span>MOCK ASSESSMENTS</span>
          <b>{analytics?.testsCompleted || 0}</b>
          <small>Completed on server</small>
        </article>
        <article className="metric-card blue">
          <span>ACTIVE STREAK</span>
          <b>{analytics?.currentStreak || 0} Days</b>
          <small>Continuous activity</small>
        </article>
      </section>

      {/* Study Activity Chart & Topic Performance */}
      <section className="analytics-grid">
        {/* Weekly Bar Chart */}
        <article className="section-panel study-chart">
          <div className="section-head">
            <div>
              <h2>7-Day Study Effort Activity</h2>
              <span>Calculated from your logged question practice and test submissions</span>
            </div>
            <b>{analytics?.currentStreak || 0}d streak</b>
          </div>

          <div className="activity-chart">
            {weekly.map(item => (
              <div key={item.day}>
                <span style={{ height: `${Math.max(12, item.value)}%` }} />
                <small>{item.day}</small>
              </div>
            ))}
          </div>

          <div className="chart-legend">
            <span><i /> Logged Practice Activities</span>
            <b>Daily Target: Consistent 1+ Sessions</b>
          </div>
        </article>

        {/* Company Readiness Comparison */}
        <article className="section-panel comparison-analysis">
          <div className="section-head">
            <div>
              <h2>Target Company Readiness Comparison</h2>
              <span>Evaluated against each company's skill matrix</span>
            </div>
          </div>

          <div className="company-comparison-list">
            {analytics?.companyComparison?.map(comp => (
              <div key={comp.id} className="comp-row">
                <CompanyMark company={comp} />
                <span>{comp.name}</span>
                <b>{comp.readiness}%</b>
                <ProgressBar
                  value={comp.readiness}
                  tone={comp.readiness >= 75 ? 'green' : 'blue'}
                  showValue={false}
                />
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Topic-Wise Performance & Recent Activity Log */}
      <section className="analytics-grid lower-analytics">
        {/* Topic Wise Accuracy */}
        <article className="section-panel topic-analysis">
          <div className="section-head">
            <div>
              <h2>Topic-Wise Accuracy</h2>
              <span>Accuracy percentage from recent recorded attempts</span>
            </div>
          </div>

          <div className="topic-bars">
            {analytics?.topicPerformance?.length > 0 ? (
              analytics.topicPerformance.map(t => (
                <ProgressBar
                  key={t.name}
                  label={`${t.name} (${t.attempts} attempts)`}
                  value={t.accuracy}
                  tone={t.accuracy >= 75 ? 'green' : t.accuracy < 60 ? 'orange' : 'blue'}
                />
              ))
            ) : (
              <p className="empty-copy">No topic attempts recorded yet.</p>
            )}
          </div>
        </article>

        {/* Activity Log */}
        <article className="section-panel activity-log">
          <div className="section-head">
            <div>
              <h2>Recent Verified Activity Log</h2>
              <span>Persistent audit trail of your preparation</span>
            </div>
          </div>

          <div className="activity-table">
            {analytics?.recentActivities?.length > 0 ? (
              analytics.recentActivities.map((act, idx) => (
                <div key={act._id || idx} className="log-row">
                  <div className="log-dot">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <b>{act.title}</b>
                    <span>{act.subject} · {new Date(act.createdAt).toLocaleDateString()}</span>
                  </div>
                  <em>{act.activityType.replace('_', ' ')}</em>
                </div>
              ))
            ) : (
              <p className="empty-copy">No recent activities logged.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default AnalyticsPage
