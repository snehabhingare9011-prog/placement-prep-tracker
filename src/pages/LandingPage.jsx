import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  Code2,
  FileCheck2,
  Milestone,
  Target,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import api from '../api/client'

export function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [activeFaq, setActiveFaq] = useState(null)

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies) {
          setCompanies(res.companies.slice(0, 6))
        }
      } catch (e) {
        // Fallback
      }
    }
    loadCompanies()
  }, [])

  const faqs = [
    {
      q: 'How is the Readiness Score calculated?',
      a: 'HireVerse calculates your readiness score using a transparent, deterministic mathematical formula: 35% Question Practice Accuracy + 30% Timed Mock Test Performance + 20% Roadmap Task Milestones + 15% Subject Coverage against your target company requirements. No fabricated numbers, pure objective evaluation.'
    },
    {
      q: 'Can placement officers track student readiness?',
      a: 'Yes! HireVerse includes a dedicated College Placement Portal for placement officers and faculty coordinators to view student readiness, filter candidates by CGPA, branch, or eligibility, publish placement drives, and broadcast campus updates.'
    },
    {
      q: 'Are the mock tests timed like real campus assessments?',
      a: 'Yes. Mock tests are governed by server-side timers and duration rules. Refreshing your browser does not reset the timer, questions do not expose answer keys, and objective scores with negative marking are computed strictly on the backend.'
    },
    {
      q: 'Can I change my target company and role anytime?',
      a: 'Absolutely. You can switch your target company and job role at any time from the top bar. Your roadmap, weak area highlights, and readiness metrics will automatically recalibrate.'
    }
  ]

  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-header">
        <div className="landing-nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">H</span>
            <span>Hire<span>Verse</span></span>
          </Link>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#companies">Companies</a>
            <a href="#readiness">Readiness Formula</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            {user ? (
              <button
                type="button"
                className="button"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link to="/login" className="button secondary">
                  Sign In
                </Link>
                <Link to="/register" className="button">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Company-Wise Placement Preparation & Interview Readiness Platform</span>
          </div>
          <h1>Target the right company. Master the exact patterns.</h1>
          <p>
            Centralize your placement preparation with company-tagged questions, server-timed mock tests, deterministic preparation roadmaps, and verifiable readiness scoring. Built for engineering students and college placement departments.
          </p>
          <div className="hero-actions">
            <Link to={user ? '/dashboard' : '/register'} className="button large-cta">
              {user ? 'Open Your Workspace' : 'Start Preparing Now'} <ArrowRight size={18} />
            </Link>
            <a href="#companies" className="button secondary large-cta">
              Explore Target Companies
            </a>
          </div>

          <div className="hero-stats-row">
            <div>
              <strong>7+</strong>
              <span>Top Tech Tier Blueprints</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Deterministic Server Logic</span>
            </div>
            <div>
              <strong>4-Phase</strong>
              <span>Adaptive Roadmaps</span>
            </div>
            <div>
              <strong>Zero</strong>
              <span>Hallucinated Scores</span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Companies Preview */}
      <section id="companies" className="landing-section">
        <div className="section-title-wrap">
          <p className="eyebrow">COMPANY-SPECIFIC BLUEPRINTS</p>
          <h2>Prepare specifically for the companies you want.</h2>
          <span>Explore recruitment rounds, frequently tested subjects, and role eligibility criteria.</span>
        </div>

        <div className="landing-companies-grid">
          {companies.map(c => (
            <div key={c._id} className="landing-company-card">
              <div className="company-card-top">
                <CompanyMark company={c} large />
                <span className={`difficulty-badge ${c.difficulty.toLowerCase()}`}>
                  {c.difficulty}
                </span>
              </div>
              <h3>{c.name}</h3>
              <p className="company-role-tag">{c.roles[0] || 'Software Engineer'}</p>
              <p className="company-desc-text">{c.description}</p>
              <div className="company-skills-preview">
                {c.requiredSkills.slice(0, 4).map(skill => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className="landing-company-footer">
                <small>{c.recruitmentRounds?.length || 4} Recruitment Rounds</small>
                <Link to={user ? '/companies' : '/login'} className="view-link">
                  View Blueprint <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="landing-section bg-alt">
        <div className="section-title-wrap">
          <p className="eyebrow">THE PREPARATION WORKFLOW</p>
          <h2>A structured, measurable journey to placement success.</h2>
          <span>Stop juggling disconnected practice sites. Everything you need in one unified workspace.</span>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <span className="step-num">01</span>
            <h3>Set Your Target Goal</h3>
            <p>Pick your target company and role. HireVerse loads verified recruitment rounds, required skill matrices, and subject weights.</p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num">02</span>
            <h3>Follow Your 4-Phase Roadmap</h3>
            <p>Work through foundational algorithms, high-frequency data structures, core CS theory, and company interview drills with clear milestones.</p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num">03</span>
            <h3>Practice & Take Timed Tests</h3>
            <p>Solve company-tagged questions and complete timed mock tests evaluated directly on the server with negative marking and weak area diagnostics.</p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num">04</span>
            <h3>Calibrate Transparent Readiness</h3>
            <p>Review your verifiable readiness score calculated from actual question attempts, test scores, and curriculum completion.</p>
          </div>
        </div>
      </section>

      {/* Dual Value: Students & Placement Cells */}
      <section id="features" className="landing-section">
        <div className="section-title-wrap">
          <p className="eyebrow">BUILT FOR CAMPUS ECOSYSTEMS</p>
          <h2>Empowering both students and placement departments.</h2>
        </div>

        <div className="dual-grid">
          <div className="dual-card student-card">
            <div className="dual-badge">
              <Code2 size={20} />
              <span>For Engineering Students</span>
            </div>
            <h3>Structured, Measurable Placement Journey</h3>
            <ul className="dual-list">
              <li><CheckCircle2 size={16} /> Company-specific question bank covering DSA, DBMS, OS, SQL, and Aptitude.</li>
              <li><CheckCircle2 size={16} /> Server-governed mock test simulations with question palettes and timers.</li>
              <li><CheckCircle2 size={16} /> Transparent readiness score with zero fake AI metrics or arbitrary numbers.</li>
              <li><CheckCircle2 size={16} /> Daily preparation streaks and weekly effort visualizations.</li>
              <li><CheckCircle2 size={16} /> Direct campus placement drive application and eligibility tracking.</li>
            </ul>
            <Link to="/register" className="button">
              Create Student Account <ArrowRight size={15} />
            </Link>
          </div>

          <div className="dual-card placement-card">
            <div className="dual-badge">
              <GraduationCap size={20} />
              <span>For Placement Cells & Faculty</span>
            </div>
            <h3>Centralized Student Readiness & Drive Management</h3>
            <ul className="dual-list">
              <li><CheckCircle2 size={16} /> Filter and search students by branch, CGPA, graduation year, and readiness.</li>
              <li><CheckCircle2 size={16} /> Publish campus placement drives with CTC packages, eligibility, and deadlines.</li>
              <li><CheckCircle2 size={16} /> Broadcast placement announcements and mock assessment schedules.</li>
              <li><CheckCircle2 size={16} /> Review student mock test scores and department-wide topic performance.</li>
              <li><CheckCircle2 size={16} /> Role-based access control safeguarding student privacy.</li>
            </ul>
            <Link to="/login" className="button secondary">
              Placement Officer Portal <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Transparent Readiness Formula Section */}
      <section id="readiness" className="landing-section bg-alt">
        <div className="section-title-wrap">
          <p className="eyebrow">TRANSPARENT EVALUATION</p>
          <h2>The Verifiable Readiness Score Formula</h2>
          <span>No mysterious black-box calculations. Every point is backed by your actual recorded activity.</span>
        </div>

        <div className="formula-cards-grid">
          <div className="formula-card">
            <b>35%</b>
            <h3>Question Practice Accuracy</h3>
            <p>Percentage of correctly solved objective problems and recorded practice attempts in the question bank.</p>
          </div>
          <div className="formula-card">
            <b>30%</b>
            <h3>Timed Mock Test Average</h3>
            <p>Score averages achieved on full-length mock tests under real assessment time constraints with negative marking.</p>
          </div>
          <div className="formula-card">
            <b>20%</b>
            <h3>Roadmap Milestone Progress</h3>
            <p>Percentage of curriculum tasks completed across Foundations, Data Structures, Core CS, and Interview Drills.</p>
          </div>
          <div className="formula-card">
            <b>15%</b>
            <h3>Required Subject Coverage</h3>
            <p>Breadth of practice across all frequently tested subjects for your selected target company.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="landing-section">
        <div className="section-title-wrap">
          <p className="eyebrow">FREQUENTLY ASKED QUESTIONS</p>
          <h2>Everything you need to know about HireVerse.</h2>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeFaq === index ? 'open' : ''}`}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div className="faq-question">
                <strong>{faq.q}</strong>
                <ChevronRight size={18} className="faq-chevron" />
              </div>
              {activeFaq === index && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="brand">
              <span className="brand-mark">H</span>
              <span>Hire<span>Verse</span></span>
            </div>
            <p>Company-Wise Placement Preparation & Interview Readiness Platform.</p>
            <small>© {new Date().getFullYear()} HireVerse. Built with MERN Stack.</small>
          </div>

          <div className="footer-links-col">
            <strong>Platform</strong>
            <Link to="/companies">Company Blueprints</Link>
            <Link to="/practice">Question Bank</Link>
            <Link to="/mock-tests">Mock Assessments</Link>
            <Link to="/roadmap">Preparation Roadmaps</Link>
          </div>

          <div className="footer-links-col">
            <strong>Portals</strong>
            <Link to="/login">Student Sign In</Link>
            <Link to="/register">Student Registration</Link>
            <Link to="/placement-portal">Placement Cell</Link>
            <Link to="/admin">Admin Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
