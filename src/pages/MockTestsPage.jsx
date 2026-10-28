import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileCheck2,
  Clock,
  Award,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Play,
  Sparkles,
  Building2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function MockTestsPage() {
  const { user, showToast } = useAuth()
  const navigate = useNavigate()

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetCompanyName = user?.targetCompany?.name || 'Target Company'
  const targetRole = user?.currentTargetRole || 'Software Engineer'

  const [activeTab, setActiveTab] = useState(targetCompanyId ? 'target' : 'all')
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTestForStart, setSelectedTestForStart] = useState(null)
  const [starting, setStarting] = useState(false)

  // Sync tab if user target changes
  useEffect(() => {
    if (targetCompanyId) {
      setActiveTab('target')
    }
  }, [targetCompanyId, targetRole])

  useEffect(() => {
    async function fetchTests() {
      setLoading(true)
      try {
        const res = await api.tests.getAll()
        if (res.success && res.tests) {
          setTests(res.tests)
        }
      } catch (err) {
        console.error('Failed to load mock tests:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [targetCompanyId, targetRole])

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
      showToast(err.message, 'danger')
    } finally {
      setStarting(false)
      setSelectedTestForStart(null)
    }
  }

  const companyTests = tests.filter(test => {
    if (!targetCompanyId) return false
    const testCompId = (test.company?._id || test.company)?.toString()
    return testCompId === targetCompanyId.toString() && test.isPublished !== false
  })

  // General mock tests available to all students
  const generalTests = tests.filter(test => !test.company && test.isPublished !== false)

  let displayedTests = tests
  let fallbackMessage = null

  if (activeTab === 'target' && targetCompanyId) {
    if (companyTests.length > 0) {
      displayedTests = companyTests
    } else if (generalTests.length > 0) {
      displayedTests = generalTests
      fallbackMessage = `Showing general campus mock assessments because specific tests for ${targetCompanyName} are not yet published.`
    } else {
      displayedTests = []
    }
  }

  const activeTargetCount = companyTests.length > 0 ? companyTests.length : generalTests.length

  return (
    <div className="mock-tests-page">
      <PageHeader
        eyebrow="CAMPUS READINESS ASSESSMENTS"
        title="Mock Assessments"
        description="Simulate real company screening rounds under strict exam timing, negative marking, and server-side evaluation."
      />

      {/* View Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px'
      }}>
        {targetCompanyId && (
          <button
            type="button"
            onClick={() => setActiveTab('target')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'target' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: activeTab === 'target' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'target' ? '#1d4ed8' : '#64748b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} /> Target Assessments ({targetCompanyName}) · {activeTargetCount}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'all' ? '1px solid #2563eb' : '1px solid #e2e8f0',
            background: activeTab === 'all' ? '#eff6ff' : '#ffffff',
            color: activeTab === 'all' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          All Mock Tests · {tests.length}
        </button>
      </div>

      {fallbackMessage && activeTab === 'target' && displayedTests.length > 0 && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={14} color="#2563eb" />
          <span>{fallbackMessage}</span>
        </div>
      )}

      {loading ? (
        <SkeletonLoader rows={4} height={140} />
      ) : displayedTests.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            No mock assessments found.
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
            No mock assessments are currently published for this target. You can browse all available mock tests or change your target.
          </p>
          <button
            type="button"
            className="button"
            onClick={() => setActiveTab('all')}
          >
            Browse All Mock Tests
          </button>
        </div>
      ) : (
        <div className="tests-grid">
          {displayedTests.map(test => {
            const isTargetMatch = targetCompanyId &&
              (test.company?._id || test.company)?.toString() === targetCompanyId.toString()
            return (
              <article key={test._id} className="mock-test-card" style={isTargetMatch ? { borderColor: '#93c5fd' } : {}}>
                <div className="test-card-header">
                  <div className="test-badge-row">
                    {test.company && <CompanyMark company={test.company} />}
                    {isTargetMatch && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        <Sparkles size={11} /> Target Match
                      </span>
                    )}
                    <span className="category-tag">{test.category}</span>
                  </div>
                  {test.bestAttempt && (
                    <span className="best-score-badge">
                      Best: <b>{test.bestAttempt.percentage}%</b>
                    </span>
                  )}
                </div>

                <h2>{test.title}</h2>
                <p className="test-description-text">{test.description}</p>

                <div className="test-specs-row">
                  <div>
                    <Clock size={15} />
                    <span>{test.durationMinutes} Minutes</span>
                  </div>
                  <div>
                    <FileCheck2 size={15} />
                    <span>{test.questionCount} Questions</span>
                  </div>
                  <div>
                    <Award size={15} />
                    <span>{test.totalMarks} Marks (+{test.marksPerQuestion} / -{test.negativeMarking})</span>
                  </div>
                </div>

                <div className="test-card-footer">
                  <button
                    type="button"
                    className="button"
                    onClick={() => setSelectedTestForStart(test)}
                  >
                    <Play size={15} /> Start Assessment
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Instructions Modal before starting */}
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

export default MockTestsPage
