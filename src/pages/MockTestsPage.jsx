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
  Play
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

  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTestForStart, setSelectedTestForStart] = useState(null)
  const [starting, setStarting] = useState(false)

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
  }, [])

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

  return (
    <div className="mock-tests-page">
      <PageHeader
        eyebrow="CAMPUS READINESS ASSESSMENTS"
        title="Mock Assessments"
        description="Simulate real company screening rounds under strict exam timing, negative marking, and server-side evaluation."
      />

      {loading ? (
        <SkeletonLoader rows={4} height={140} />
      ) : (
        <div className="tests-grid">
          {tests.map(test => (
            <article key={test._id} className="mock-test-card">
              <div className="test-card-header">
                <div className="test-badge-row">
                  {test.company && <CompanyMark company={test.company} />}
                  <span className={`difficulty-badge ${test.difficulty?.toLowerCase()}`}>
                    {test.difficulty}
                  </span>
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
          ))}
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
