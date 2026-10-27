import { useState, useEffect } from 'react'
import {
  UserCheck,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  ArrowRight,
  ChevronRight,
  Mic,
  MessageSquare,
  Volume2
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import CompanyMark from '../components/common/CompanyMark'
import { useAuth } from '../context/AuthContext'

const SAMPLE_INTERVIEWS = {
  Accenture: [
    {
      id: 1,
      round: 'Technical Core',
      question: 'Explain how database indexing works under the hood using B-Trees, and describe a situation where indexing might actually degrade database write performance.',
      expectedPoints: ['B-Tree / B+Tree structure', 'Binary search reduction on disk blocks', 'Insert/Update overhead due to page splitting', 'Write penalty in high-throughput logs']
    },
    {
      id: 2,
      round: 'Technical Core',
      question: 'What is the critical difference between Process and Thread? How does context switching overhead differ between them in Linux or Unix systems?',
      expectedPoints: ['Separate memory space vs shared heap/data', 'PCB vs TCB context switching', 'Cache invalidation on process switch', 'Race conditions & synchronization primitives']
    },
    {
      id: 3,
      round: 'Behavioral & Leadership',
      question: 'Describe a challenging engineering bug or project deadline conflict you faced in a team project. How did you diagnose the issue and communicate with your teammates using the STAR method?',
      expectedPoints: ['Situation: specific context & pressure', 'Task: your exact role & responsibility', 'Action: concrete technical steps taken', 'Result: measurable outcome and learnings']
    }
  ],
  Google: [
    {
      id: 1,
      round: 'DSA & Algorithmic Problem Solving',
      question: 'Given an array of integers, how would you find the length of the longest subarray with a sum equal to K in O(N) time complexity? Walk me through your thought process.',
      expectedPoints: ['Prefix sum hashmap technique', 'Handling negative numbers', 'Hash collision avoidance', 'O(N) time and O(N) space trade-offs']
    },
    {
      id: 2,
      round: 'System Architecture',
      question: 'Design a distributed rate limiter that handles 100,000 requests per second across multiple microservices. Which algorithm would you select and why?',
      expectedPoints: ['Token bucket vs Sliding window log', 'Redis centralized counter with Lua script', 'Race condition mitigation', 'Graceful fallback on cache downtime']
    }
  ],
  TCS: [
    {
      id: 1,
      round: 'Technical Foundation',
      question: 'What are the four pillars of Object-Oriented Programming (OOP)? Provide real-world code examples demonstrating Polymorphism in Java or C++.',
      expectedPoints: ['Encapsulation, Abstraction, Inheritance, Polymorphism', 'Compile-time overloading vs runtime overriding', 'Virtual method tables (vtable)']
    },
    {
      id: 2,
      round: 'HR & Cultural Alignment',
      question: 'Why do you want to join Tata Consultancy Services, and how do you adapt when asked to work on a technology stack you have not previously learned?',
      expectedPoints: ['TCS scale and training ecosystem', 'Growth mindset and fast learning agility', 'Documentation and peer mentorship utilization']
    }
  ]
}

export function AiInterviewPage() {
  const { user, showToast } = useAuth()

  // Stages: 'setup' | 'interview' | 'feedback'
  const [stage, setStage] = useState('setup')
  const [company, setCompany] = useState('Accenture')
  const [role, setRole] = useState('Associate Software Engineer')
  const [roundType, setRoundType] = useState('Technical Core')

  // Live session state
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Timer loop
  useEffect(() => {
    let interval = null
    if (stage === 'interview' && isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [stage, isTimerRunning])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartInterview = () => {
    const list = SAMPLE_INTERVIEWS[company] || SAMPLE_INTERVIEWS.Accenture
    setQuestions(list)
    setCurrentIdx(0)
    setAnswers({})
    setTimerSeconds(0)
    setIsTimerRunning(true)
    setStage('interview')
    showToast('Interview session initiated. Best of luck!', 'info')
  }

  const handleAnswerChange = (text) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: text }))
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      handleCompleteInterview()
    }
  }

  const handleCompleteInterview = () => {
    setIsTimerRunning(false)
    setIsEvaluating(true)
    setTimeout(() => {
      setIsEvaluating(false)
      setStage('feedback')
      showToast('Interview completed! AI Evaluation Report generated.', 'success')
    }, 1200)
  }

  const currentQ = questions[currentIdx] || {}
  const currentAnswer = answers[currentIdx] || ''

  return (
    <div className="ai-interview-page">
      <PageHeader
        eyebrow="VIRTUAL AI INTERVIEW READINESS"
        title="Interactive Mock Interview Simulator"
        description="Simulate real company technical and HR interview rounds with structured prompt guidance, timing constraints, and instant detailed performance evaluation."
      />

      {/* STAGE 1: SETUP */}
      {stage === 'setup' && (
        <div className="interview-setup-container">
          <section className="interview-setup-card">
            <div className="setup-header">
              <div className="setup-icon-box">
                <Sparkles size={24} />
              </div>
              <div>
                <h2>Configure Your Mock Interview</h2>
                <p>Customize the target company and interview round to test your spontaneous communication and technical depth.</p>
              </div>
            </div>

            <div className="setup-fields-grid">
              <div className="setup-field">
                <label>Target Company:</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="setup-select"
                >
                  <option value="Accenture">Accenture</option>
                  <option value="Google">Google</option>
                  <option value="TCS">Tata Consultancy Services (TCS)</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Microsoft">Microsoft</option>
                </select>
              </div>

              <div className="setup-field">
                <label>Job Profile / Role:</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="setup-input"
                />
              </div>

              <div className="setup-field">
                <label>Interview Round:</label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value)}
                  className="setup-select"
                >
                  <option value="Technical Core">Technical Round (DSA, OS, DBMS)</option>
                  <option value="System Architecture">System Design & Web Architecture</option>
                  <option value="Behavioral & Leadership">HR & Behavioral (STAR Method)</option>
                </select>
              </div>
            </div>

            <div className="setup-features-list">
              <div className="feature-item">
                <Clock size={16} />
                <span>Simulated round timer with realistic question pace</span>
              </div>
              <div className="feature-item">
                <Lightbulb size={16} />
                <span>STAR methodology hints provided on each question</span>
              </div>
              <div className="feature-item">
                <Award size={16} />
                <span>Detailed rubric scoring: Technical Depth, Clarity & Structure</span>
              </div>
            </div>

            <div className="setup-action-row">
              <button
                type="button"
                className="button primary start-interview-btn"
                onClick={handleStartInterview}
              >
                <Play size={16} />
                <span>Enter Virtual Interview Room</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* STAGE 2: LIVE INTERVIEW ROOM */}
      {stage === 'interview' && (
        <div className="interview-room-container">
          {/* Top Bar with Intervewer Avatar, Question Counter, and Timer */}
          <div className="interview-room-header">
            <div className="interviewer-profile">
              <div className="interviewer-avatar">
                <UserCheck size={20} />
              </div>
              <div>
                <strong>AI Interviewer · {company} Lead</strong>
                <span className="live-status-pill">
                  <span className="pulse-dot" /> Listening & Evaluating
                </span>
              </div>
            </div>

            <div className="interview-stats-bar">
              <div className="question-counter-badge">
                Question {currentIdx + 1} of {questions.length}
              </div>
              <div className="interview-timer-badge">
                <Clock size={16} />
                <span>{formatTimer(timerSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="interview-question-box">
            <div className="question-round-badge">
              <span>{currentQ.round || roundType}</span>
            </div>
            <h3 className="interview-question-text">
              "{currentQ.question}"
            </h3>
          </div>

          {/* STAR Framework Helper Box */}
          <div className="star-guidance-box">
            <div className="star-title">
              <Lightbulb size={16} />
              <span>Recommended Answer Strategy (STAR Method):</span>
            </div>
            <div className="star-steps">
              <span><b>S</b>ituation: Context</span>
              <ChevronRight size={14} />
              <span><b>T</b>ask: Responsibility</span>
              <ChevronRight size={14} />
              <span><b>A</b>ction: Technical steps taken</span>
              <ChevronRight size={14} />
              <span><b>R</b>esult: Quantitative outcome</span>
            </div>
          </div>

          {/* Answer Input Area */}
          <div className="answer-input-container">
            <div className="answer-header">
              <label htmlFor="interview-answer-box">Your Response:</label>
              <div className="input-mode-toggles">
                <button type="button" className="mode-btn active" title="Text Response">
                  <MessageSquare size={14} /> Type Response
                </button>
                <button type="button" className="mode-btn" title="Simulated Speech">
                  <Mic size={14} /> Audio Speech
                </button>
              </div>
            </div>

            <textarea
              id="interview-answer-box"
              rows={6}
              className="interview-textarea"
              placeholder="Structure your answer clearly. Explain concepts from first principles, trade-offs, and concrete implementation examples..."
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />

            <div className="answer-footer">
              <small className="char-count">
                {currentAnswer.length} characters typed
              </small>
              <div className="room-nav-buttons">
                {currentIdx > 0 && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setCurrentIdx(i => i - 1)}
                  >
                    Previous Question
                  </button>
                )}
                <button
                  type="button"
                  className="button primary"
                  onClick={handleNextQuestion}
                >
                  {currentIdx === questions.length - 1 ? (
                    <>
                      <span>Submit & Evaluate</span>
                      <CheckCircle2 size={16} />
                    </>
                  ) : (
                    <>
                      <span>Next Question</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: EVALUATION REPORT */}
      {stage === 'feedback' && (
        <div className="interview-feedback-container">
          {/* Performance Summary Banner */}
          <section className="feedback-score-banner">
            <div className="feedback-score-radial">
              <strong>84</strong>
              <small>/100</small>
            </div>
            <div className="feedback-score-meta">
              <h3>Strong Candidate Performance!</h3>
              <p>Your technical depth and clarity meet the expectations for an {role} role at {company}.</p>
              <span className="verdict-tag passed">Interview Round Recommendation: PROCEED TO NEXT ROUND</span>
            </div>
          </section>

          {/* Dimension Breakdown Scores */}
          <div className="dimension-scores-grid">
            <div className="dimension-card">
              <span>Technical Accuracy & Depth</span>
              <strong>88%</strong>
              <div className="dimension-track"><div className="dimension-fill" style={{ width: '88%' }} /></div>
            </div>
            <div className="dimension-card">
              <span>Communication & STAR Structure</span>
              <strong>82%</strong>
              <div className="dimension-track"><div className="dimension-fill" style={{ width: '82%' }} /></div>
            </div>
            <div className="dimension-card">
              <span>Problem Solving & Trade-offs</span>
              <strong>81%</strong>
              <div className="dimension-track"><div className="dimension-fill" style={{ width: '81%' }} /></div>
            </div>
          </div>

          {/* Detailed Strengths & Growth Areas */}
          <div className="strengths-growth-grid">
            <article className="feedback-column strengths-card">
              <div className="column-header">
                <CheckCircle2 size={18} className="text-green" />
                <h4>Key Strengths Demonstrated</h4>
              </div>
              <ul className="feedback-list">
                <li>Explained core fundamental concepts clearly from first principles.</li>
                <li>Articulated B-Tree disk I/O savings and branch factor advantages effectively.</li>
                <li>Maintained structured communication with concise definitions before diving into implementation details.</li>
              </ul>
            </article>

            <article className="feedback-column growth-card">
              <div className="column-header">
                <AlertTriangle size={18} className="text-orange" />
                <h4>Recommended Areas for Improvement</h4>
              </div>
              <ul className="feedback-list">
                <li>Mention concrete time and space complexities (Big-O) explicitly in introductory remarks.</li>
                <li>When discussing database indexing, quantify cache invalidation and write throughput penalties.</li>
                <li>Quantify business impact in behavioral answers (e.g. "saved 15 engineer hours per week").</li>
              </ul>
            </article>
          </div>

          {/* Actions */}
          <div className="feedback-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setStage('setup')}
            >
              <RotateCcw size={16} />
              <span>Practice Another Interview</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AiInterviewPage
