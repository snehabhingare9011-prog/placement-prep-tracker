import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Flag
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function MockExamPage() {
  const { attemptId } = useParams()
  const { showToast } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Local answers state: map questionId -> { selectedOption, markedForReview }
  const [answersMap, setAnswersMap] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Save debounce ref
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    async function loadAttempt() {
      setLoading(true)
      try {
        const res = await api.tests.getAttempt(attemptId)
        if (res.success && res.attempt) {
          if (res.attempt.status === 'completed' || res.isExpired) {
            showToast('This assessment has already concluded.', 'info')
            navigate(`/mock-result/${attemptId}`)
            return
          }

          setAttempt(res.attempt)
          setQuestions(res.attempt.test?.questions || [])
          setTimeRemaining(res.timeRemainingSeconds || 0)

          // Build answers map
          const map = {}
          res.attempt.answers?.forEach(a => {
            const qId = a.questionId?._id || a.questionId
            map[qId] = {
              selectedOption: a.selectedOption,
              markedForReview: !!a.markedForReview
            }
          })
          setAnswersMap(map)
        }
      } catch (err) {
        showToast(err.message, 'danger')
        navigate('/mock-tests')
      } finally {
        setLoading(false)
      }
    }
    loadAttempt()
  }, [attemptId])

  // Countdown timer effect
  useEffect(() => {
    if (loading || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, timeRemaining])

  const handleAutoSubmit = async () => {
    showToast('Time has expired! Submitting assessment automatically...', 'warning')
    await executeSubmission()
  }

  // Sync answer to backend
  const syncAnswersToBackend = (updatedMap) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const answersArray = Object.entries(updatedMap).map(([questionId, data]) => ({
          questionId,
          selectedOption: data.selectedOption,
          markedForReview: data.markedForReview
        }))
        await api.tests.saveAnswers(attemptId, answersArray)
      } catch (e) {
        console.warn('Auto-save failed:', e.message)
      }
    }, 1000)
  }

  const handleSelectOption = (optionIndex) => {
    const currentQ = questions[currentIndex]
    if (!currentQ) return

    const updated = {
      ...answersMap,
      [currentQ._id]: {
        selectedOption: optionIndex,
        markedForReview: answersMap[currentQ._id]?.markedForReview || false
      }
    }
    setAnswersMap(updated)
    syncAnswersToBackend(updated)
  }

  const handleClearSelection = () => {
    const currentQ = questions[currentIndex]
    if (!currentQ) return

    const updated = {
      ...answersMap,
      [currentQ._id]: {
        selectedOption: null,
        markedForReview: answersMap[currentQ._id]?.markedForReview || false
      }
    }
    setAnswersMap(updated)
    syncAnswersToBackend(updated)
  }

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex]
    if (!currentQ) return

    const isMarked = answersMap[currentQ._id]?.markedForReview
    const updated = {
      ...answersMap,
      [currentQ._id]: {
        selectedOption: answersMap[currentQ._id]?.selectedOption ?? null,
        markedForReview: !isMarked
      }
    }
    setAnswersMap(updated)
    syncAnswersToBackend(updated)
  }

  const executeSubmission = async () => {
    setSubmitting(true)
    try {
      const answersArray = Object.entries(answersMap).map(([questionId, data]) => ({
        questionId,
        selectedOption: data.selectedOption,
        markedForReview: data.markedForReview
      }))
      const res = await api.tests.submit(attemptId, answersArray)
      if (res.success) {
        showToast('Assessment submitted and evaluated.', 'success')
        navigate(`/mock-result/${attemptId}`)
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setSubmitting(false)
      setConfirmSubmitOpen(false)
    }
  }

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="exam-loading-box">
        <SkeletonLoader rows={6} height={60} />
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const currentAnswer = currentQ ? answersMap[currentQ._id] : null

  // Calculate statistics for navigator
  const answeredCount = Object.values(answersMap).filter(a => a.selectedOption !== null && a.selectedOption !== undefined).length
  const markedCount = Object.values(answersMap).filter(a => a.markedForReview).length

  return (
    <div className="mock-exam-container">
      {/* Exam Header */}
      <header className="exam-topbar">
        <div className="exam-topbar-left">
          <strong>{attempt?.test?.title || 'Mock Assessment'}</strong>
          <span className="exam-status-tag">Live Session</span>
        </div>

        <div className="exam-topbar-timer">
          <Clock size={18} />
          <b className={timeRemaining < 300 ? 'timer-warning' : ''}>
            {formatTimer(timeRemaining)}
          </b>
          <span>remaining</span>
        </div>

        <div className="exam-topbar-actions">
          <button
            type="button"
            className="button danger"
            onClick={() => setConfirmSubmitOpen(true)}
          >
            Submit Assessment
          </button>
        </div>
      </header>

      {/* Main Exam Grid */}
      <section className="exam-layout">
        {/* Question Area */}
        <article className="exam-question-area">
          <div className="exam-question-head">
            <span>
              Question <b>{currentIndex + 1}</b> of {questions.length}
            </span>
            <span className="exam-subject-pill">
              {currentQ?.subject} · {currentQ?.topic}
            </span>
          </div>

          <h2 className="exam-question-statement">{currentQ?.statement}</h2>

          {currentQ?.examples && (
            <div className="exam-example-box">
              <pre>{currentQ.examples}</pre>
            </div>
          )}

          {/* Options */}
          <div className="exam-options-list">
            {currentQ?.options?.map((option, idx) => {
              const isSelected = currentAnswer?.selectedOption === idx
              return (
                <button
                  key={idx}
                  type="button"
                  className={`exam-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="option-index">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option}</span>
                </button>
              )
            })}
          </div>

          {/* Controls Footer */}
          <div className="exam-controls-footer">
            <button
              type="button"
              className="button secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              <ArrowLeft size={15} /> Previous Question
            </button>

            <div className="exam-mid-controls">
              <button
                type="button"
                className={`button text-btn ${currentAnswer?.markedForReview ? 'marked-btn' : ''}`}
                onClick={handleToggleReview}
              >
                <Flag size={15} />
                <span>{currentAnswer?.markedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {currentAnswer?.selectedOption !== null && currentAnswer?.selectedOption !== undefined && (
                <button
                  type="button"
                  className="button text-btn"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </button>
              )}
            </div>

            <button
              type="button"
              className="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              Next Question <ArrowRight size={15} />
            </button>
          </div>
        </article>

        {/* Navigator Sidebar */}
        <aside className="exam-navigator-sidebar">
          <h3>Question Palette</h3>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const ans = answersMap[q._id]
              const isCurrent = idx === currentIndex
              const isAnswered = ans && ans.selectedOption !== null && ans.selectedOption !== undefined
              const isMarked = ans && ans.markedForReview

              let className = 'palette-btn'
              if (isCurrent) className += ' current'
              if (isAnswered) className += ' answered'
              if (isMarked) className += ' marked'

              return (
                <button
                  key={q._id}
                  type="button"
                  className={className}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="palette-legend">
            <div>
              <span className="dot answered" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div>
              <span className="dot marked" />
              <span>Marked for Review ({markedCount})</span>
            </div>
            <div>
              <span className="dot current" />
              <span>Current</span>
            </div>
            <div>
              <span className="dot unanswered" />
              <span>Unanswered ({questions.length - answeredCount})</span>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />

          <button
            type="button"
            className="button danger"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setConfirmSubmitOpen(true)}
          >
            Finish & Submit Test
          </button>
        </aside>
      </section>

      {/* Submit Confirmation Modal */}
      {confirmSubmitOpen && (
        <Modal
          title="Submit Assessment?"
          close={() => setConfirmSubmitOpen(false)}
        >
          <div className="submit-summary-box">
            <p>Are you sure you want to finalize and submit your test?</p>
            <div className="submit-stats-row">
              <div>
                <strong>{answeredCount}</strong>
                <span>Answered</span>
              </div>
              <div>
                <strong>{questions.length - answeredCount}</strong>
                <span>Unanswered</span>
              </div>
              <div>
                <strong>{markedCount}</strong>
                <span>Marked for Review</span>
              </div>
            </div>
            <small style={{ color: 'var(--muted)', display: 'block', marginTop: '12px' }}>
              Your answers will be evaluated on the server immediately. You will not be able to change selections once submitted.
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setConfirmSubmitOpen(false)}
              disabled={submitting}
            >
              Resume Test
            </button>
            <button
              type="button"
              className="button danger"
              onClick={executeSubmission}
              disabled={submitting}
            >
              {submitting ? 'Submitting & Evaluating...' : 'Confirm Submission'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MockExamPage
