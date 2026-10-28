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
  AlertCircle,
  Check,
  X
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

  const questions = attempt.test?.questions || []

  // Create a map of student answers
  const answerMap = new Map()
  attempt.answers?.forEach(a => {
    const qId = a.questionId?._id || a.questionId
    answerMap.set(qId.toString(), a.selectedOption)
  })

  const correctCount = result.correctCount || 0
  const incorrectCount = result.incorrectCount || 0
  const unansweredCount = result.unansweredCount || 0
  const attemptedCount = correctCount + incorrectCount

  // Accuracy calculation: correct answers / attempted questions * 100
  // Exclude unanswered questions. If 0 attempted, N/A.
  const hasAttempted = attemptedCount > 0
  const accuracyPct = hasAttempted ? Math.round((correctCount / attemptedCount) * 100) : null
  const accuracyDisplay = hasAttempted ? `${accuracyPct}%` : 'N/A'

  // Topic Performance: Compute assessed subjects/topics with question counts and accuracy
  const assessedTopics = (result.subjectBreakdown || []).map(sb => {
    let attempted = 0
    let correct = sb.correctQuestions || 0
    let total = sb.totalQuestions || 0

    if (questions.length > 0) {
      const subjQuestions = questions.filter(q => q.subject === sb.subject)
      if (subjQuestions.length > 0) {
        total = subjQuestions.length
        attempted = subjQuestions.filter(q => {
          const ans = answerMap.get(q._id?.toString() || q._id)
          return ans !== undefined && ans !== null
        }).length
      }
    } else {
      attempted = total
    }

    const topicHasAttempted = attempted > 0
    const topicAccuracy = topicHasAttempted ? Math.round((correct / attempted) * 100) : null
    const isStrong = topicHasAttempted && topicAccuracy >= 70
    const isNeedsWork = (topicHasAttempted && topicAccuracy < 60) || (!topicHasAttempted && (result.weakTopics || []).some(w => questions.some(q => q.subject === sb.subject && (q.topic === w || q.subject === w))))

    return {
      name: sb.subject,
      total,
      attempted,
      correct,
      topicAccuracy,
      isStrong,
      isNeedsWork
    }
  })

  let topicPerformanceList = assessedTopics
  if (topicPerformanceList.length === 0 && questions.length > 0) {
    const grouped = {}
    questions.forEach(q => {
      const s = q.subject || 'General'
      if (!grouped[s]) grouped[s] = { total: 0, attempted: 0, correct: 0 }
      grouped[s].total += 1
      const ans = answerMap.get(q._id?.toString() || q._id)
      if (ans !== undefined && ans !== null) {
        grouped[s].attempted += 1
        if (String(ans) === String(q.correctAnswer)) {
          grouped[s].correct += 1
        }
      }
    })
    topicPerformanceList = Object.entries(grouped).map(([name, data]) => {
      const hasAtt = data.attempted > 0
      const acc = hasAtt ? Math.round((data.correct / data.attempted) * 100) : null
      return {
        name,
        total: data.total,
        attempted: data.attempted,
        correct: data.correct,
        topicAccuracy: acc,
        isStrong: hasAtt && acc >= 70,
        isNeedsWork: (hasAtt && acc < 60) || (!hasAtt && (result.weakTopics || []).includes(name))
      }
    })
  }

  // Recommendations: at most 2 relevant study recommendations based on actual weak topics
  const weakTopicRecommendations = (result.weakTopics || []).map(topicName => {
    const hubId = mapQuestionToHubTopicId(topicName)
    const matchedResource = hubId ? curriculumTopics.find(t => t.id === hubId) : null
    return {
      weakName: topicName,
      matchedResource,
      action: matchedResource?.description
        ? `Review ${matchedResource.title} and practice core problem patterns.`
        : `Review foundational concepts and solve practice questions for ${topicName}.`
    }
  })

  // Prioritize actionable recommendations that have matched curriculum resources
  const sortedRecommendations = [...weakTopicRecommendations].sort((a, b) => {
    if (a.matchedResource && !b.matchedResource) return -1
    if (!a.matchedResource && b.matchedResource) return 1
    return 0
  })

  const priorityRecommendations = sortedRecommendations.slice(0, 2)

  function openStudyTopic(rec) {
    if (rec.matchedResource) {
      setSelectedResourceTopic(rec.matchedResource)
    } else {
      setSelectedResourceTopic({
        id: `topic-${encodeURIComponent(rec.weakName)}`,
        title: rec.weakName,
        pillar: 'Technical',
        importance: 'High',
        estimatedHours: '2-3 hrs',
        description: `Targeted revision guide for ${rec.weakName}. Focus on core concepts, recurring problem patterns, and interview question explanations.`,
        popularWebsites: [
          { name: 'Interview Preparation & Guides', url: `https://www.google.com/search?q=${encodeURIComponent(rec.weakName + ' interview questions')}` }
        ],
        youtubeVideos: [
          { title: `${rec.weakName} Overview & Key Concepts`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.weakName + ' tutorial interview')}` }
        ]
      })
    }
  }

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

      {/* Section 1 — Assessment Summary */}
      <section className="assessment-summary-section">
        <div className="summary-metrics-row">
          {/* Metric 1: Accuracy (Primary performance metric) */}
          <div className="metric-summary-card accuracy-card">
            <div className="metric-header">
              <span className="metric-label">Accuracy</span>
              <Target size={16} className="metric-icon" />
            </div>
            <div className="metric-value-wrap">
              <span className="metric-value">{accuracyDisplay}</span>
            </div>
            <span className="metric-hint">
              {hasAttempted ? 'Across attempted questions' : 'No questions attempted'}
            </span>
          </div>

          {/* Metric 2: Correct Answers */}
          <div className="metric-summary-card correct-card">
            <div className="metric-header">
              <span className="metric-label">Correct</span>
              <CheckCircle2 size={16} className="metric-icon text-green" />
            </div>
            <div className="metric-value-wrap">
              <span className="metric-value">{correctCount}</span>
            </div>
            <span className="metric-hint">Answered accurately</span>
          </div>

          {/* Metric 3: Incorrect Answers */}
          <div className="metric-summary-card incorrect-card">
            <div className="metric-header">
              <span className="metric-label">Incorrect</span>
              <XCircle size={16} className="metric-icon text-red" />
            </div>
            <div className="metric-value-wrap">
              <span className="metric-value">{incorrectCount}</span>
            </div>
            <span className="metric-hint">Needs revision</span>
          </div>

          {/* Metric 4: Unanswered Questions */}
          <div className="metric-summary-card unanswered-card">
            <div className="metric-header">
              <span className="metric-label">Unanswered</span>
              <HelpCircle size={16} className="metric-icon text-muted" />
            </div>
            <div className="metric-value-wrap">
              <span className="metric-value">{unansweredCount}</span>
            </div>
            <span className="metric-hint">Left unattempted</span>
          </div>
        </div>
      </section>

      {/* Section 2 — Performance Insights and Next Steps */}
      <section className="assessment-insights-section">
        <div className="insights-two-column-grid">
          {/* Area A: Topic Performance */}
          <div className="insight-area-card topic-performance-area">
            <div className="area-header">
              <h3>Topic Performance</h3>
              <span className="area-badge">{topicPerformanceList.length} Assessed</span>
            </div>

            <div className="topics-performance-list">
              {topicPerformanceList.map(topic => {
                const hasAttemptedTopic = topic.attempted > 0
                return (
                  <div key={topic.name} className="topic-perf-item">
                    <div className="topic-perf-top">
                      <div className="topic-perf-identity">
                        <strong className="topic-perf-title">{topic.name}</strong>
                        <span className="topic-perf-counts">
                          {topic.correct} of {topic.attempted} attempted
                          {topic.total > topic.attempted ? ` (${topic.total} total)` : ''}
                        </span>
                      </div>

                      <div className="topic-perf-status">
                        <span className="topic-perf-accuracy">
                          {hasAttemptedTopic ? `${topic.topicAccuracy}%` : 'N/A'}
                        </span>
                        {hasAttemptedTopic ? (
                          topic.isStrong ? (
                            <span className="topic-tag-strong">Strong</span>
                          ) : topic.isNeedsWork ? (
                            <span className="topic-tag-weak">Needs Work</span>
                          ) : (
                            <span className="topic-tag-mid">Fair</span>
                          )
                        ) : (
                          <span className="topic-tag-neutral">Unattempted</span>
                        )}
                      </div>
                    </div>

                    <div className="topic-perf-progress-track">
                      <div
                        className={`topic-perf-progress-fill ${
                          !hasAttemptedTopic
                            ? 'neutral'
                            : topic.isStrong
                            ? 'strong'
                            : topic.isNeedsWork
                            ? 'weak'
                            : 'mid'
                        }`}
                        style={{ width: `${hasAttemptedTopic ? topic.topicAccuracy : 0}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Area B: Recommended Next Steps */}
          <div className="insight-area-card next-steps-area">
            <div className="area-header">
              <h3>Recommended Next Steps</h3>
              <span className="area-subtitle">Priority focus areas based on your test answers</span>
            </div>

            {priorityRecommendations.length > 0 ? (
              <div className="recommendations-flow">
                {/* At most 2 priority recommendations */}
                <div className="priority-recommendations-list">
                  {priorityRecommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-step-card">
                      <div className="recommendation-step-main">
                        <div className="recommendation-step-head">
                          <span className="recommendation-step-badge">Revise</span>
                          <strong className="recommendation-step-title">{rec.weakName}</strong>
                        </div>
                        <p className="recommendation-step-action">{rec.action}</p>
                      </div>

                      <button
                        type="button"
                        className="button primary study-topic-btn"
                        onClick={() => openStudyTopic(rec)}
                      >
                        <BookOpen size={13} />
                        <span>Study Topic</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-weaknesses-state">
                <CheckCircle2 size={24} className="text-green" />
                <div>
                  <strong>Great performance!</strong>
                  <p>No critical weak topics were identified in this assessment.</p>
                </div>
              </div>
            )}

            {/* Small secondary actions at the bottom */}
            <div className="next-steps-footer-actions">
              <Link to="/company-prep" className="button secondary small-action-btn">
                <BookOpen size={13} />
                <span>Open Preparation Hub</span>
              </Link>
              <Link to="/roadmap" className="button secondary small-action-btn">
                <Target size={13} />
                <span>View Roadmap</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Question Review & Solutions Section */}
      {showReview && (
        <section className="test-review-section" id="review-solutions">
          <div className="review-section-header">
            <h2>Question Review & Solutions</h2>
            <p className="review-subtext">
              Review your submitted answers, verify the correct solutions, and understand the technical explanations.
            </p>
          </div>

          <div className="review-questions-list">
            {questions.map((q, idx) => {
              const studentChoice = answerMap.get(q._id.toString())
              const wasAnswered = studentChoice !== undefined && studentChoice !== null
              const isCorrect = wasAnswered && String(studentChoice) === String(q.correctAnswer)
              const statusClass = !wasAnswered ? 'unanswered' : isCorrect ? 'correct' : 'incorrect'

              return (
                <article key={q._id} className={`review-question-card ${statusClass}`}>
                  {/* Question Header */}
                  <div className="review-q-head">
                    <div className="review-q-meta">
                      <span className="review-q-number">Question {idx + 1}</span>
                      <span className="review-q-divider">·</span>
                      <span className="review-q-topic">
                        {q.subject}{q.topic ? ` (${q.topic})` : ''}
                      </span>
                    </div>

                    <div className="review-q-status">
                      {isCorrect ? (
                        <span className="review-result-badge badge-correct">
                          <Check size={12} strokeWidth={2.8} /> Correct
                        </span>
                      ) : wasAnswered ? (
                        <span className="review-result-badge badge-incorrect">
                          <X size={12} strokeWidth={2.8} /> Incorrect
                        </span>
                      ) : (
                        <span className="review-result-badge badge-unanswered">
                          Unanswered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Title & Text */}
                  <h3 className="review-question-title">{q.title}</h3>
                  <p className="review-question-statement">{q.statement}</p>

                  {/* Answer Options Grid */}
                  <div className="review-options-grid">
                    {q.options?.map((opt, optIdx) => {
                      const isStudentSelected = wasAnswered && Number(studentChoice) === optIdx
                      const isOfficialCorrect = Number(q.correctAnswer) === optIdx

                      let optionStateClass = 'option-neutral'
                      if (isOfficialCorrect) {
                        optionStateClass = 'option-correct'
                      } else if (isStudentSelected) {
                        optionStateClass = 'option-incorrect'
                      }

                      return (
                        <div key={optIdx} className={`review-option-tile ${optionStateClass}`}>
                          <span className="option-letter-badge">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="option-text">{opt}</span>

                          {isOfficialCorrect && (
                            <span className="option-state-pill correct-pill">
                              <Check size={12} strokeWidth={2.8} /> Correct Answer
                            </span>
                          )}
                          {!isOfficialCorrect && isStudentSelected && (
                            <span className="option-state-pill wrong-pill">
                              <X size={12} strokeWidth={2.8} /> Your Answer
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Solution Explanation Panel */}
                  {q.explanation && (
                    <div className="review-explanation-box">
                      <div className="explanation-header">
                        <HelpCircle size={14} className="explanation-icon" />
                        <strong>Why is this correct?</strong>
                      </div>
                      <p className="explanation-text">{q.explanation}</p>
                    </div>
                  )}
                </article>
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
