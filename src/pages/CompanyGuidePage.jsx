import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Code2,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Target,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function CompanyGuidePage() {
  const { id } = useParams()
  const { user, setTarget, showToast } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState(null)
  const [roles, setRoles] = useState([])
  const [tests, setTests] = useState([])
  const [drives, setDrives] = useState([])
  const [userProgress, setUserProgress] = useState(null)
  const [activeTab, setActiveTab] = useState('process') // 'process' | 'tests' | 'eligibility'

  useEffect(() => {
    async function loadCompanyDetails() {
      setLoading(true)
      try {
        const res = await api.companies.getById(id)
        if (res.success && res.company) {
          setCompany(res.company)
          setRoles(res.roles || [])
          setQuestions(res.questions || [])
          setTests(res.tests || [])
          setDrives(res.drives || [])
          setUserProgress(res.userProgress)
        }
      } catch (err) {
        showToast(err.message, 'danger')
      } finally {
        setLoading(false)
      }
    }
    loadCompanyDetails()
  }, [id])

  if (loading) {
    return (
      <div className="company-guide-loading">
        <PageHeader eyebrow="COMPANY BLUEPRINT" title="Loading company preparation guide..." />
        <SkeletonLoader rows={6} height={60} />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="company-not-found">
        <h2>Company not found</h2>
        <Link to="/companies" className="button">Back to Company Directory</Link>
      </div>
    )
  }

  const isCurrentTarget = (user?.targetCompany?._id || user?.targetCompany) === company._id
  const currentRole = user?.currentTargetRole || company.roles[0] || 'Software Engineer'

  const handleMakeTarget = async () => {
    await setTarget(company._id, company.roles[0])
  }

  return (
    <div className="company-guide-page">
      {/* Hero */}
      <section className="guide-hero">
        <div className="guide-hero-left">
          <div className="guide-title">
            <CompanyMark company={company} large />
            <div>
              <p>COMPANY PREPARATION BLUEPRINT</p>
              <h1>{company.name} · {company.roles[0]}</h1>
              <span className="industry-text">{company.industry}</span>
            </div>
          </div>
          <p className="guide-desc">{company.description}</p>
        </div>

        <div className="guide-score-card">
          <span>Your Company Readiness</span>
          <b>{userProgress?.hasEnoughData ? `${userProgress.overallScore}%` : 'New'}</b>
          <ProgressBar
            value={userProgress?.overallScore || 0}
            tone="blue"
            showValue={false}
          />
          <small>{userProgress?.statusLabel || 'Complete curriculum topics to calculate readiness'}</small>

          {!isCurrentTarget ? (
            <button
              type="button"
              className="button"
              style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
              onClick={handleMakeTarget}
            >
              Set as Current Target Goal
            </button>
          ) : (
            <span className="targeted-indicator">
              <CheckCircle2 size={15} /> Active Target
            </span>
          )}

          <Link
            to={`/company-prep?company=${company._id}`}
            className="button secondary"
            style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
          >
            <span>Preparation Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="guide-tabs">
        <button
          type="button"
          className={activeTab === 'process' ? 'active' : ''}
          onClick={() => setActiveTab('process')}
        >
          Recruitment Process & Rounds
        </button>
        <button
          type="button"
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          Mock Assessments ({tests.length})
        </button>
        <button
          type="button"
          className={activeTab === 'eligibility' ? 'active' : ''}
          onClick={() => setActiveTab('eligibility')}
        >
          Eligibility & Criteria
        </button>
      </div>

      {/* Tab 1: Recruitment Process */}
      {activeTab === 'process' && (
        <section className="guide-layout">
          <div className="guide-main-col">
            <article className="guide-section">
              <h2>Interview & Selection Rounds</h2>
              <p>Standard campus recruitment rounds verified for {company.name}.</p>

              <ol className="process-timeline">
                {company.recruitmentRounds?.map((round, idx) => (
                  <li key={round._id || idx}>
                    <span>{idx + 1}</span>
                    <div>
                      <b>{round.name}</b>
                      <small>{round.description || `Round ${idx + 1} of the ${company.name} recruitment journey`}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="guide-section">
              <h2>Frequently Tested Subjects</h2>
              <div className="tested-subjects-list">
                {company.frequentlyTestedSubjects?.map(subj => (
                  <div key={subj} className="tested-subject-pill">
                    <strong>{subj}</strong>
                    <span>High Weightage</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="guide-side-col">
            <section className="guide-panel">
              <h3>Required Skills Matrix</h3>
              <div className="skill-cloud">
                {company.requiredSkills?.map(s => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </section>

            <section className="guide-panel">
              <h3>Recommended Next Step</h3>
              <p>Complete a {company.name}-specific mock test to benchmark your baseline readiness.</p>
              <Link to="/mock-tests" className="button" style={{ width: '100%', justifyContent: 'center' }}>
                <FileCheck2 size={16} /> Start Mock Assessment
              </Link>
            </section>
          </aside>
        </section>
      )}

      {/* Tab 2: Mock Tests */}
      {activeTab === 'tests' && (
        <section className="guide-section">
          <h2>Diagnostic Tests Aligned with {company.name}</h2>
          <div className="tagged-tests-grid">
            {tests.length > 0 ? (
              tests.map(t => (
                <div key={t._id} className="test-card-box">
                  <div className="test-card-head">
                    <CompanyMark company={company} />
                    <span className="test-difficulty">{t.difficulty}</span>
                  </div>
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>
                  <div className="test-specs">
                    <span>{t.durationMinutes} Minutes</span>
                    <span>{t.questions?.length || 0} Questions</span>
                    <span>{t.totalMarks || 24} Marks</span>
                  </div>
                  <Link to={`/mock-tests`} className="button" style={{ width: '100%', justifyContent: 'center' }}>
                    <FileCheck2 size={16} /> Take Mock Test
                  </Link>
                </div>
              ))
            ) : (
              <p className="empty-copy">No mock test currently linked to this company.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 4: Eligibility & Campus Drives */}
      {activeTab === 'eligibility' && (
        <section className="guide-section">
          <h2>Eligibility Criteria & Campus Drives</h2>
          <div className="eligibility-box">
            <div className="eligibility-item">
              <span>Minimum CGPA Required</span>
              <strong>{company.eligibilityCriteria?.minCgpa || 7.0} / 10.0</strong>
            </div>
            <div className="eligibility-item">
              <span>Eligible Branches</span>
              <strong>{company.eligibilityCriteria?.allowedBranches?.join(', ') || 'All Engineering Branches'}</strong>
            </div>
            <div className="eligibility-item">
              <span>Graduation Batches</span>
              <strong>{company.eligibilityCriteria?.graduationYears?.join(', ') || '2026, 2027'}</strong>
            </div>
          </div>

          <div className="guide-prep-cta-box" style={{ marginTop: '28px', padding: '24px', background: '#f5f9ff', border: '1px solid #cce3ff', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px', color: '#0f2742' }}>Structured Learning Curriculum & Resources</h3>
            <p style={{ margin: '0 0 16px', color: '#556980', fontSize: '13px' }}>
              We have compiled all required preparation topics for {company.name} across Aptitude, DSA, Core CS, Web, and HR rounds with direct links to W3Schools, GeeksforGeeks, and top YouTube playlists.
            </p>
            <Link
              to={`/company-prep?company=${company._id}`}
              className="button primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Open {company.name} Preparation Hub</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default CompanyGuidePage
