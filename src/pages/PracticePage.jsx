import { useState, useEffect } from 'react'
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Code2,
  Search,
  Filter,
  ArrowRight,
  Check,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function PracticePage() {
  const { user, showToast } = useAuth()

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All subjects')
  const [difficulty, setDifficulty] = useState('All difficulties')

  // Attempt state
  const [selectedOption, setSelectedOption] = useState(null)
  const [approachNotes, setApproachNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attemptResult, setAttemptResult] = useState(null)

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true)
      try {
        const res = await api.questions.getAll({
          subject: subject !== 'All subjects' ? subject : undefined,
          difficulty: difficulty !== 'All difficulties' ? difficulty : undefined,
          search: search || undefined
        })
        if (res.success && res.questions) {
          setQuestions(res.questions)
          if (res.questions.length > 0 && !selectedId) {
            setSelectedId(res.questions[0]._id)
          }
        }
      } catch (err) {
        console.error('Failed to load questions:', err)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [subject, difficulty, search])

  // Load question detail when selectedId changes
  useEffect(() => {
    if (!selectedId) return
    async function loadDetail() {
      try {
        const res = await api.questions.getById(selectedId)
        if (res.success && res.question) {
          setSelectedQuestion(res.question)
          setAttemptResult(res.previousAttempt || null)
          setSelectedOption(res.previousAttempt?.submittedAnswer ?? null)
          setApproachNotes(res.previousAttempt?.notes || '')
        }
      } catch (err) {
        console.error('Failed to load question details:', err)
      }
    }
    loadDetail()
  }, [selectedId])

  const handleToggleBookmark = async (qId, isSaved) => {
    try {
      if (isSaved) {
        await api.questions.unsave(qId)
        showToast('Bookmark removed', 'info')
      } else {
        await api.questions.save(qId)
        showToast('Question saved to bookmarks', 'success')
      }
      setQuestions(prev =>
        prev.map(q => (q._id === qId ? { ...q, isSaved: !isSaved } : q))
      )
      if (selectedQuestion?._id === qId) {
        setSelectedQuestion(prev => ({ ...prev, isSaved: !isSaved }))
      }
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleSubmitAttempt = async () => {
    if (!selectedQuestion) return
    if (selectedQuestion.questionType === 'multiple-choice' && selectedOption === null) {
      showToast('Please select an option before submitting.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.questions.recordAttempt(selectedQuestion._id, {
        answer: selectedOption,
        notes: approachNotes,
        timeTakenSeconds: 120
      })

      if (res.success) {
        showToast(res.message, res.isCorrect ? 'success' : 'warning')
        setAttemptResult({
          isCorrect: res.isCorrect,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation,
          submittedAnswer: selectedOption,
          notes: approachNotes
        })

        // Update list status
        setQuestions(prev =>
          prev.map(q =>
            q._id === selectedQuestion._id
              ? { ...q, attemptStatus: res.isCorrect ? 'solved' : 'attempted' }
              : q
          )
        )
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const subjectsList = ['All subjects', 'DSA', 'Core CS', 'DBMS', 'Operating Systems', 'SQL', 'OOP', 'Aptitude', 'HR']

  return (
    <div className="practice-page">
      <PageHeader
        eyebrow="QUESTION BANK & PRACTICE"
        title="Practice with purpose."
        description="Company-tagged interview questions, algorithmic challenges, and deterministic server-evaluated practice."
      />

      <section className="practice-layout">
        {/* Left Filter & List Sidebar */}
        <aside className="practice-filter">
          <h3>Filter Questions</h3>

          <label className="field-label">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic or statement..."
            />
          </label>

          <label className="field-label">
            Subject
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjectsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="All difficulties">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>

          <div className="filter-count">
            <b>{questions.length}</b> questions match filters
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />

          <div className="mini-questions-list">
            {questions.map(q => {
              const isSelected = q._id === selectedId
              const isSolved = q.attemptStatus === 'solved'
              const isAttempted = q.attemptStatus === 'attempted'

              return (
                <button
                  key={q._id}
                  type="button"
                  className={`mini-question ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedId(q._id)}
                >
                  <span className={`diff-tag ${q.difficulty.toLowerCase()}`}>
                    {q.difficulty[0]}
                  </span>
                  <div>
                    <b>{q.title}</b>
                    <small>{q.subject} · {q.topic}</small>
                  </div>
                  {isSolved && <Check size={14} className="solved-icon" />}
                  {isAttempted && !isSolved && <span className="attempted-dot" />}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Center: Main Question Workspace */}
        {selectedQuestion ? (
          <article className="question-surface">
            <div className="question-head">
              <div>
                <span className={`difficulty ${selectedQuestion.difficulty.toLowerCase()}`}>
                  {selectedQuestion.difficulty}
                </span>
                <span className="topic-tag">{selectedQuestion.subject} · {selectedQuestion.topic}</span>
                {attemptResult?.isCorrect && (
                  <span className="status-badge solved">
                    <CheckCircle2 size={13} /> Solved
                  </span>
                )}
              </div>

              <div className="question-actions">
                <button
                  type="button"
                  className={`bookmark-btn ${selectedQuestion.isSaved ? 'active' : ''}`}
                  onClick={() => handleToggleBookmark(selectedQuestion._id, selectedQuestion.isSaved)}
                  title="Bookmark question for review"
                >
                  <Bookmark size={16} />
                  <span>{selectedQuestion.isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>
            </div>

            <h1>{selectedQuestion.title}</h1>

            <div className="question-meta">
              {selectedQuestion.companies?.[0] && (
                <span>
                  <CompanyMark company={selectedQuestion.companies[0]} />
                  {selectedQuestion.companies[0].name}
                </span>
              )}
              <span>
                <Clock size={14} /> Est. {selectedQuestion.estimatedTimeMinutes || 15} min
              </span>
              <span>Type: {selectedQuestion.questionType.replace('-', ' ')}</span>
            </div>

            <div className="question-statement-box">
              <p>{selectedQuestion.statement}</p>
            </div>

            {selectedQuestion.examples && (
              <section className="example-box">
                <span>Examples / Test Cases</span>
                <pre>{selectedQuestion.examples}</pre>
              </section>
            )}

            {selectedQuestion.constraints && (
              <section className="constraints-box">
                <small>Constraints: {selectedQuestion.constraints}</small>
              </section>
            )}

            {/* Answer Input depending on type */}
            {selectedQuestion.questionType === 'multiple-choice' && (
              <section className="mcq-options-container">
                <h3>Select your answer:</h3>
                <div className="mcq-options-grid">
                  {selectedQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx
                    const isRevealedCorrect = attemptResult && Number(attemptResult.correctAnswer) === idx
                    const isRevealedWrong = attemptResult && !attemptResult.isCorrect && selectedOption === idx

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`mcq-option-btn ${isSelected ? 'selected' : ''} ${isRevealedCorrect ? 'correct' : ''} ${isRevealedWrong ? 'incorrect' : ''}`}
                        onClick={() => setSelectedOption(idx)}
                      >
                        <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                        <span className="opt-text">{opt}</span>
                        {isRevealedCorrect && <Check size={16} className="opt-icon" />}
                        {isRevealedWrong && <AlertCircle size={16} className="opt-icon" />}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Approach notes textarea */}
            <section className="answer-workspace">
              <label className="field-label">
                <b>Your Solution Approach & Notes:</b>
                <textarea
                  value={approachNotes}
                  onChange={(e) => setApproachNotes(e.target.value)}
                  placeholder="Record your algorithm complexity analysis, pseudocode, or interview explanation..."
                />
              </label>

              <div className="workspace-actions">
                <button
                  type="button"
                  className="button"
                  onClick={handleSubmitAttempt}
                  disabled={submitting}
                >
                  {submitting ? 'Evaluating on Server...' : 'Submit & Check Answer'}
                </button>
              </div>
            </section>

            {/* Explanation card revealed upon attempt */}
            {attemptResult && (
              <section className={`solution-card ${attemptResult.isCorrect ? 'correct' : 'revision'}`}>
                <div className="solution-head">
                  <strong>{attemptResult.isCorrect ? '✓ Solution Verified Correct' : '⚠ Solution Review Required'}</strong>
                </div>
                <p className="explanation-text">{attemptResult.explanation}</p>
              </section>
            )}
          </article>
        ) : (
          <EmptyState
            icon={Code2}
            title="Select a question to practice"
            text="Choose an item from the left sidebar to start solving."
          />
        )}
      </section>
    </div>
  )
}

export default PracticePage
