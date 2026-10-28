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
  Target,
  Globe,
  Video as YoutubeIcon,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'
import { mapQuestionToHubTopicId } from '../utils/topicMapping'

export function MockResultPage() {
  const { attemptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(null)
  const [result, setResult] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const [curriculumTopics, setCurriculumTopics] = useState([])
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)

  useEffect(() => {
    async function loadResultAndCurriculum() {
      setLoading(true)
      try {
        const [res, topicsRes] = await Promise.all([
          api.tests.getResults(attemptId),
          api.curriculum.getAllTopics().catch(() => ({ success: false, topics: [] }))
        ])

        if (res.success && res.attempt) {
          setAttempt(res.attempt)
          setResult(res.result || res.attempt.result)
        }
        if (topicsRes.success && topicsRes.topics) {
          setCurriculumTopics(topicsRes.topics)
        }
      } catch (err) {
        console.error('Failed to load test results:', err)
      } finally {
        setLoading(false)
      }
    }
    loadResultAndCurriculum()
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

  // Map weak topics to verified curriculum resources
  const weakTopicRecommendations = (result.weakTopics || []).map(topicName => {
    const hubId = mapQuestionToHubTopicId(topicName)
    const matchedResource = hubId ? curriculumTopics.find(t => t.id === hubId) : null
    return {
      weakName: topicName,
      matchedResource
    }
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

          <p style={{ margin: '14px 0 0', fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            Note: This score evaluates test performance only. Roadmap topic completion remains tracked separately.
          </p>
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
            <div className="weak-topics-box" style={{ marginTop: '16px' }}>
              <strong>Identified Weak Topics from Assessment:</strong>
              <div className="weak-topic-tags" style={{ marginTop: '8px' }}>
                {result.weakTopics.map(topic => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Evidence-Based Recommended Next Actions */}
        <article className="result-next-card">
          <h2>Recommended Actions</h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
            Address lower-scoring areas before attempting another timed assessment:
          </p>

          {weakTopicRecommendations.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
              {weakTopicRecommendations.map((item, idx) => {
                if (item.matchedResource) {
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                          Revise: {item.weakName}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                          {item.matchedResource.title}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="button primary"
                        onClick={() => setSelectedResourceTopic(item.matchedResource)}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        <BookOpen size={12} /> Study Topic
                      </button>
                    </div>
                  )
                }

                return (
                  <div
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}
                  >
                    <b>{item.weakName}</b>: Resource not available yet.
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              Great performance! No critical topic weaknesses were detected in this assessment.
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/company-prep" className="button secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>
              <BookOpen size={14} /> Open Preparation Hub
            </Link>
            <Link to="/roadmap" className="button secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>
              View Roadmap
            </Link>
          </div>
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

      {/* Resource Modal */}
      {selectedResourceTopic && (
        <Modal
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          title={`Study Topic: ${selectedResourceTopic.title}`}
          maxWidth="560px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className={`pillar-tag ${(selectedResourceTopic.pillar || '').toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {selectedResourceTopic.pillar}
                </span>
                {selectedResourceTopic.importance && (
                  <span className={`importance-tag ${selectedResourceTopic.importance.toLowerCase()}`}>
                    {selectedResourceTopic.importance} Importance
                  </span>
                )}
                {selectedResourceTopic.estimatedHours && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                    {selectedResourceTopic.estimatedHours}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {selectedResourceTopic.description}
              </p>
            </div>

            {/* Verified Documentation */}
            <div className="resource-section" style={{ marginTop: '16px' }}>
              <h4 className="resource-section-heading">
                <Globe size={16} />
                <span>Verified Documentation & Written Tutorials</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.popularWebsites && selectedResourceTopic.popularWebsites.length > 0 ? (
                  selectedResourceTopic.popularWebsites.map((web, idx) => (
                    <a
                      key={idx}
                      href={web.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-item-link"
                    >
                      <div className="resource-item-icon web-icon">
                        <Globe size={16} />
                      </div>
                      <div className="resource-item-details">
                        <strong>{web.title}</strong>
                        <span>Source: <b>{web.provider}</b></span>
                      </div>
                      <div className="resource-open-action">
                        <span>Open Guide</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No external documentation mapped for this topic.</p>
                )}
              </div>
            </div>

            {/* Curated YouTube Video Playlists */}
            <div className="resource-section" style={{ marginTop: '16px' }}>
              <h4 className="resource-section-heading">
                <YoutubeIcon size={16} className="yt-icon" />
                <span>Curated Video Playlists & Masterclasses</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.youtubeVideos && selectedResourceTopic.youtubeVideos.length > 0 ? (
                  selectedResourceTopic.youtubeVideos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-item-link"
                    >
                      <div className="resource-item-icon yt-icon">
                        <YoutubeIcon size={16} />
                      </div>
                      <div className="resource-item-details">
                        <strong>{vid.title}</strong>
                        <span>Channel: <b>{vid.channel}</b> · Duration: {vid.duration}</span>
                      </div>
                      <div className="resource-open-action">
                        <span>Watch Video</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No video playlists mapped for this topic.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '14px' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setSelectedResourceTopic(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MockResultPage
