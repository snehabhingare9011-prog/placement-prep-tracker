import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Target
} from 'lucide-react'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function MockResultPage() {
  const { attemptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(null)
  const [result, setResult] = useState(null)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    async function loadResult() {
      setLoading(true)
      try {
        const res = await api.tests.getResults(attemptId)
        if (res.success && res.attempt) {
          setAttempt(res.attempt)
          setResult(res.result || res.attempt.result)
        }
      } catch (err) {
        console.error('Failed to load test results:', err)
      } finally {
        setLoading(false)
      }
    }
    loadResult()
  }, [attemptId])

  if (loading) {
    return (
      <div className="result-loading">
        <PageHeader eyebrow="ASSESSMENT RESULT" title="Loading test evaluation..." />
        <SkeletonLoader rows={5} height={80} />
      </div>
    )
  }

  if (!attempt || !result) {
    return (
      <div className="empty-state">
        <h2>Assessment result unavailable</h2>
        <Link to="/mock-tests" className="button">Back to Assessments</Link>
      </div>
    )
  }

  const scorePct = result.percentage || 0
  const isPassed = scorePct >= 70
  const questions = attempt.test?.questions || []

  // Create a map of student answers
  const answerMap = new Map()
  attempt.answers?.forEach(a => {
    const qId = a.questionId?._id || a.questionId
    answerMap.set(qId.toString(), a.selectedOption)
  })

  return (
    <div className="mock-result-page">
      <PageHeader
        eyebrow="ASSESSMENT OUTCOME"
        title={attempt.test?.title || 'Mock Test Outcome'}
        description={`Evaluated server-side on ${new Date(attempt.submittedAt || Date.now()).toLocaleDateString()} · Time taken: ${Math.round((result.timeTakenSeconds || 0) / 60)} min`}
      >
        <Link to="/mock-tests" className="button secondary">
          <RotateCcw size={15} /> All Mock Tests
        </Link>
        <button
          type="button"
          className="button"
          onClick={() => setShowReview(!showReview)}
        >
          <BookOpen size={15} /> {showReview ? 'Hide Solutions' : 'Review Questions & Explanations'}
        </button>
      </PageHeader>

      {/* Main Result Scorecards */}
      <section className="result-layout">
        {/* Score Card */}
        <article className="result-score-card">
          <span>FINAL SCORE</span>
          <b>{result.score} <small>/ {result.maxScore || 24}</small></b>
          <div className="result-pct-display">
            <strong>{scorePct}%</strong>
            <span className={`status-pill ${isPassed ? 'good' : 'attention'}`}>
              {isPassed ? 'Ready for Campus Drive' : 'Needs Topic Revision'}
            </span>
          </div>

          <div className="result-breakdown-counts">
            <div>
              <CheckCircle2 size={16} className="text-green" />
              <span><b>{result.correctCount}</b> Correct</span>
            </div>
            <div>
              <XCircle size={16} className="text-red" />
              <span><b>{result.incorrectCount}</b> Incorrect</span>
            </div>
            <div>
              <HelpCircle size={16} className="text-muted" />
              <span><b>{result.unansweredCount}</b> Unanswered</span>
            </div>
          </div>
        </article>

        {/* Subject-Wise Breakdown */}
        <article className="result-breakdown-card">
          <h2>Subject-Wise Performance</h2>
          <div className="subject-bars-list">
            {result.subjectBreakdown?.map(sb => (
              <ProgressBar
                key={sb.subject}
                label={`${sb.subject} (${sb.correctQuestions}/${sb.totalQuestions})`}
                value={sb.percentage}
                tone={sb.percentage >= 75 ? 'green' : sb.percentage < 60 ? 'orange' : 'blue'}
              />
            ))}
          </div>

          {result.weakTopics?.length > 0 && (
            <div className="weak-topics-box">
              <strong>Identified Weak Topics:</strong>
              <div className="weak-topic-tags">
                {result.weakTopics.map(topic => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Recommended Actions */}
        <article className="result-next-card">
          <h2>Recommended Actions</h2>
          <ol className="result-next-list">
            {result.weakTopics?.length > 0 ? (
              <li>Practice targeted problems in <b>{result.weakTopics[0]}</b> before taking another test.</li>
            ) : (
              <li>Maintain your accuracy by practicing 3 daily high-frequency questions.</li>
            )}
            <li>Check your updated <b>Readiness Score</b> on the readiness tab.</li>
            <li>Review the question explanations below to internalize optimal time complexities.</li>
          </ol>

          <Link to="/practice" className="button secondary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
            <Target size={15} /> Practice Weak Topics
          </Link>
        </article>
      </section>

      {/* Post-Test Question Review Section */}
      {showReview && (
        <section className="test-review-section">
          <h2>Comprehensive Question Review & Solutions</h2>
          <p className="review-subtext">
            Analyze your submitted selections alongside the server-verified correct answers and algorithmic explanations.
          </p>

          <div className="review-questions-list">
            {questions.map((q, idx) => {
              const studentChoice = answerMap.get(q._id.toString())
              const isCorrect = studentChoice !== undefined && studentChoice !== null && String(studentChoice) === String(q.correctAnswer)
              const wasAnswered = studentChoice !== undefined && studentChoice !== null

              return (
                <div key={q._id} className={`review-question-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-q-head">
                    <span>Question {idx + 1} · {q.subject} ({q.topic})</span>
                    <span className={`review-status-tag ${isCorrect ? 'tag-correct' : 'tag-wrong'}`}>
                      {isCorrect ? '✓ Correct (+4)' : wasAnswered ? '✗ Incorrect (-1)' : '○ Unanswered (0)'}
                    </span>
                  </div>

                  <h3>{q.title}</h3>
                  <p className="q-statement">{q.statement}</p>

                  {/* Options with clear markings */}
                  <div className="review-options-grid">
                    {q.options?.map((opt, optIdx) => {
                      const isStudentSelected = studentChoice === optIdx
                      const isOfficialCorrect = Number(q.correctAnswer) === optIdx

                      let optClass = 'review-opt-box'
                      if (isOfficialCorrect) optClass += ' official-correct'
                      if (isStudentSelected && !isOfficialCorrect) optClass += ' student-wrong'

                      return (
                        <div key={optIdx} className={optClass}>
                          <b>{String.fromCharCode(65 + optIdx)}</b>
                          <span>{opt}</span>
                          {isOfficialCorrect && <span className="opt-tag correct">Correct Key</span>}
                          {isStudentSelected && !isOfficialCorrect && <span className="opt-tag wrong">Your Answer</span>}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div className="review-explanation-box">
                      <strong>Solution Explanation:</strong>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default MockResultPage
