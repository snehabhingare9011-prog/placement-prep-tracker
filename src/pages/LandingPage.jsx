import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Target,
  Milestone,
  FileCheck2,
  Layers,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Lock,
  Compass,
  Check,
  TrendingUp,
  UserCheck,
  LayoutDashboard,
  Zap,
  HelpCircle,
  FileText,
  Code2,
  Server,
  Database,
  Cpu,
  Activity,
  Terminal
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import '../saas-landing.css'

export function LandingPage() {
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()

  const [activeFaq, setActiveFaq] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [legalModal, setLegalModal] = useState(null) // 'privacy' | 'terms' | null
  const [previewTab, setPreviewTab] = useState('architecture') // 'architecture' | 'workspace'

  const isAuthenticated = Boolean(user && token)

  const dashboardRoute = user?.role === 'admin'
    ? '/admin'
    : (user?.role === 'placement_officer' || user?.role === 'faculty')
      ? '/placement-portal'
      : (!user?.targetCompany ? '/onboarding' : '/dashboard')

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Smooth scroll handler
  const scrollToSection = (e, id) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      const navOffset = 76
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const faqs = [
    {
      q: 'What is HireVerse?',
      a: 'HireVerse is a comprehensive placement preparation and interview readiness platform built for engineering students and college placement departments. It centralizes structured learning topics, milestone roadmaps, server-timed mock assessments, and verifiable progress metrics into one unified workspace.'
    },
    {
      q: 'Who can use HireVerse?',
      a: 'HireVerse is designed for engineering students preparing for on-campus and off-campus technical placements. Additionally, college placement officers and faculty coordinators use the platform to monitor cohort readiness, review benchmark test results, and manage campus placement drives.'
    },
    {
      q: 'How do I get started?',
      a: 'Getting started takes less than a minute. Click "Get Started" to create your free student account, enter your college, branch, and graduation year, and immediately access your personalized preparation dashboard.'
    },
    {
      q: 'Can I track my preparation progress?',
      a: 'Yes. HireVerse automatically records all your question attempts, timed test results, milestone completions, and topic accuracies. These are combined into an objective readiness score that reflects your genuine preparation progress.'
    },
    {
      q: 'How do I access my dashboard?',
      a: 'Once signed in, click "Go to Dashboard" in the navigation bar or anywhere across the homepage. You can also sign in directly using the "Sign In" button with your existing account credentials.'
    },
    {
      q: 'Is my progress saved?',
      a: 'Yes. All your activity—including completed topics, notes, bookmarks, mock assessment scores, and roadmap milestone completions—is securely stored in the cloud database so you can seamlessly continue across sessions.'
    }
  ]

  return (
    <div className="saas-landing">
      {/* 2. Professional Navbar */}
      <header className="saas-navbar">
        <div className="saas-nav-container">
          {/* Brand Logo */}
          <Link to="/" className="saas-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="saas-brand-icon">
              <span>H</span>
            </div>
            <div className="saas-brand-text">
              <strong>Hire<span>Verse</span></strong>
              <small>Placement Platform</small>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="saas-nav-menu" aria-label="Main Navigation">
            <a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Home
            </a>
            <a href="#platform" onClick={(e) => scrollToSection(e, 'platform')}>
              Platform
            </a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
              How It Works
            </a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>
              About
            </a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="saas-nav-actions">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="saas-btn saas-btn-primary"
                    onClick={() => navigate(dashboardRoute)}
                  >
                    <LayoutDashboard size={15} />
                    <span>Go to Dashboard</span>
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="saas-btn saas-btn-secondary">
                      Sign In
                    </Link>
                    <Link to="/register" className="saas-btn saas-btn-primary">
                      <span>Get Started</span>
                      <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              className="saas-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="saas-mobile-menu">
            <nav className="saas-mobile-links">
              <a href="#hero" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Home
              </a>
              <a href="#platform" onClick={(e) => scrollToSection(e, 'platform')}>
                Platform
              </a>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
                How It Works
              </a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>
                About
              </a>
              <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>
                FAQ
              </a>
            </nav>

            <div className="saas-mobile-actions">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="saas-btn saas-btn-primary saas-btn-block"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate(dashboardRoute)
                  }}
                >
                  <LayoutDashboard size={15} />
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="saas-btn saas-btn-secondary saas-btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="saas-btn saas-btn-primary saas-btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 3. Premium Hero Section */}
        <section id="hero" className="saas-hero-section">
          <div className="saas-container">
            <div className="saas-hero-content">
              {/* Badge */}
              <div className="saas-pill">
                <Sparkles size={14} className="saas-pill-sparkle" />
                <span>Engineered for Engineering Campus Placements</span>
              </div>

              {/* Main Heading */}
              <h1 className="saas-hero-title">
                Your Placement Journey Starts Here.
              </h1>

              {/* Supporting Description */}
              <p className="saas-hero-subtitle">
                A smarter way to organize your preparation, study structured learning topics, and track your progress toward placement readiness.
              </p>

              {/* Action Buttons */}
              <div className="saas-hero-actions">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="saas-btn saas-btn-primary saas-btn-lg"
                      onClick={() => navigate(dashboardRoute)}
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight size={16} />
                    </button>
                    <a
                      href="#platform"
                      className="saas-btn saas-btn-outline saas-btn-lg"
                      onClick={(e) => scrollToSection(e, 'platform')}
                    >
                      <span>Explore Platform</span>
                    </a>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="saas-btn saas-btn-primary saas-btn-lg">
                      <span>Get Started</span>
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href="#platform"
                      className="saas-btn saas-btn-outline saas-btn-lg"
                      onClick={(e) => scrollToSection(e, 'platform')}
                    >
                      <span>Explore Platform</span>
                    </a>
                  </>
                )}
              </div>

              {/* Key Trust Signals */}
              <div className="saas-hero-proof">
                <div className="saas-proof-item">
                  <CheckCircle2 size={15} />
                  <span>Structured 4-Phase Roadmaps</span>
                </div>
                <div className="saas-proof-item">
                  <CheckCircle2 size={15} />
                  <span>Server-Timed Assessments</span>
                </div>
                <div className="saas-proof-item">
                  <CheckCircle2 size={15} />
                  <span>Deterministic Readiness Scoring</span>
                </div>
                <div className="saas-proof-item">
                  <CheckCircle2 size={15} />
                  <span>College Placement Cell Portal</span>
                </div>
              </div>
            </div>

            {/* Full-Stack Architecture & Platform Engine Showcase */}
            <div className="saas-hero-visual">
              <div className="saas-mockup-frame">
                {/* Window Bar with Interactive Tab Switcher */}
                <div className="saas-mockup-header">
                  <div className="saas-mockup-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>

                  {/* Interactive Architecture / Workspace Tab Switcher */}
                  <div className="saas-mockup-tabs">
                    <button
                      type="button"
                      className={`saas-mockup-tab-btn ${previewTab === 'architecture' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('architecture')}
                    >
                      <Code2 size={13} />
                      <span>Code & System Architecture</span>
                    </button>
                    <button
                      type="button"
                      className={`saas-mockup-tab-btn ${previewTab === 'workspace' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('workspace')}
                    >
                      <LayoutDashboard size={13} />
                      <span>Live Placement Workspace</span>
                    </button>
                  </div>

                  <div className="saas-mockup-tag">
                    <span className="pulse-indicator" />
                    <span>REST API v1 · Port 5000</span>
                  </div>
                </div>

                {/* TAB 1: CODE & SYSTEM ARCHITECTURE SHOWCASE */}
                {previewTab === 'architecture' && (
                  <div className="saas-arch-container">
                    <div className="saas-arch-head">
                      <div>
                        <span className="saas-arch-eyebrow">FULL-STACK CODEBASE ARCHITECTURE</span>
                        <h3>Modular Engineering Structure & Data Flow</h3>
                      </div>
                      <div className="saas-arch-badges">
                        <span className="saas-code-badge"><Terminal size={11} /> Node.js / Express</span>
                        <span className="saas-code-badge"><Database size={11} /> MongoDB Atlas</span>
                        <span className="saas-code-badge"><Cpu size={11} /> Deterministic Scoring</span>
                      </div>
                    </div>

                    <div className="saas-arch-grid">
                      {/* Layer 1: Client Application Layer */}
                      <div className="saas-arch-card">
                        <div className="saas-arch-card-top">
                          <div className="saas-arch-icon client">
                            <Layers size={18} />
                          </div>
                          <span className="saas-arch-layer-tag client">Frontend · /src</span>
                        </div>
                        <h4>React 18 & Vite SPA Architecture</h4>
                        <p>Modular client with React Router v6, Context API session state, and responsive glassmorphism UI components.</p>
                        <div className="saas-arch-chips">
                          <code>App.jsx</code>
                          <code>ReadinessPage.jsx</code>
                          <code>CompanyGuidePage.jsx</code>
                        </div>
                      </div>

                      {/* Layer 2: API Gateway & Security */}
                      <div className="saas-arch-card">
                        <div className="saas-arch-card-top">
                          <div className="saas-arch-icon server">
                            <Server size={18} />
                          </div>
                          <span className="saas-arch-layer-tag server">Backend · /server/src</span>
                        </div>
                        <h4>Node.js & Express RESTful Engine</h4>
                        <p>Protected endpoints with JWT session authentication, bcrypt password hashing, and role-based access control.</p>
                        <div className="saas-arch-chips">
                          <code>/api/v1/auth</code>
                          <code>/api/v1/readiness</code>
                          <code>/api/v1/mock-tests</code>
                        </div>
                      </div>

                      {/* Layer 3: Assessment & Anti-Cheat */}
                      <div className="saas-arch-card">
                        <div className="saas-arch-card-top">
                          <div className="saas-arch-icon engine">
                            <FileCheck2 size={18} />
                          </div>
                          <span className="saas-arch-layer-tag engine">Assessment Engine</span>
                        </div>
                        <h4>Server Timers & Negative Marking</h4>
                        <p>Server-side countdown timer enforcement, automatic expiry, timed negative marking (+4 / -1), and anti-cheat tracking.</p>
                        <div className="saas-arch-chips">
                          <code>mockTestService.js</code>
                          <code>testEvaluator.js</code>
                          <code>+4 / -1 Marking</code>
                        </div>
                      </div>

                      {/* Layer 4: Deterministic Readiness Pipeline */}
                      <div className="saas-arch-card">
                        <div className="saas-arch-card-top">
                          <div className="saas-arch-icon database">
                            <BarChart3 size={18} />
                          </div>
                          <span className="saas-arch-layer-tag database">Analytics Engine</span>
                        </div>
                        <h4>Deterministic Readiness Scoring</h4>
                        <p>Unified task deduplication, separation of syllabus progress and exam accuracy, and Atlas cloud synchronization.</p>
                        <div className="saas-arch-chips">
                          <code>readinessService.js</code>
                          <code>User.js</code>
                          <code>Company.js</code>
                        </div>
                      </div>
                    </div>

                    {/* Architecture Telemetry Footer */}
                    <div className="saas-arch-telemetry">
                      <div className="saas-telemetry-item">
                        <span>DATA PIPELINE</span>
                        <strong>100% Deterministic Evidence</strong>
                      </div>
                      <div className="saas-telemetry-item">
                        <span>DATABASE CLUSTER</span>
                        <strong>MongoDB Atlas Cloud</strong>
                      </div>
                      <div className="saas-telemetry-item">
                        <span>ASSESSMENT EVALUATION</span>
                        <strong>Server-Side (+4 / -1 Negative Marking)</strong>
                      </div>
                      <div className="saas-telemetry-item">
                        <span>TEST SUITE STATUS</span>
                        <strong>15 / 15 Passed (Automated TAP)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LIVE PLACEMENT WORKSPACE (Accurate HireVerse Student Experience) */}
                {previewTab === 'workspace' && (
                  <div className="saas-mockup-body">
                    {/* Top Row: Preparation Progress & Mock Diagnostics */}
                    <div className="saas-preview-top-row">
                      {/* Section A: Preparation Progress */}
                      <div className="saas-preview-card">
                        <div className="saas-preview-card-head">
                          <span className="saas-meta-label">SECTION A · MY PREPARATION PROGRESS</span>
                          <span className="saas-status-badge success">44% Syllabus Done</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>44%</strong>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>(4 of 9 topics completed)</span>
                        </div>
                        <div className="saas-progress-track" style={{ height: '7px', marginBottom: '14px' }}>
                          <div className="saas-progress-fill" style={{ width: '44%' }} />
                        </div>
                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                            NEXT INCOMPLETE TOPIC
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                            Quantitative Aptitude: Time, Work & Percentages
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Phase 1 · Programming Foundations · 4 hrs</span>
                        </div>
                      </div>

                      {/* Section B: Mock Performance */}
                      <div className="saas-preview-card">
                        <div className="saas-preview-card-head">
                          <span className="saas-meta-label">SECTION B · MY MOCK-TEST PERFORMANCE</span>
                          <span className="saas-meta-tag">1 Test Submitted</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>79%</strong>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Average score with negative marking</span>
                        </div>
                        <div className="saas-stats-metrics-grid" style={{ marginBottom: '10px' }}>
                          <div className="saas-stat-box">
                            <strong>12 Qs</strong>
                            <span>Attempted</span>
                          </div>
                          <div className="saas-stat-box">
                            <strong style={{ color: '#16a34a' }}>10 Qs</strong>
                            <span>Correct</span>
                          </div>
                          <div className="saas-stat-box">
                            <strong style={{ color: '#dc2626' }}>2 Qs</strong>
                            <span>Incorrect</span>
                          </div>
                          <div className="saas-stat-box">
                            <strong style={{ color: '#ea580c' }}>-1 mark</strong>
                            <span>Penalty</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Exam Accuracy Across Attempts:</span>
                          <strong style={{ fontSize: '12px', color: '#16a34a' }}>83%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Section C & Section D */}
                    <div className="saas-preview-bottom-row">
                      {/* Section C: Evidenced Focus Area */}
                      <div className="saas-preview-card">
                        <div className="saas-preview-card-head">
                          <span className="saas-meta-label">SECTION C · EVIDENCED TOPIC INSIGHTS</span>
                          <span className="saas-status-badge warning" style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>1 Focus Area</span>
                        </div>
                        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Graph Algorithms: BFS, DFS & Shortest Path</strong>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>0% Accuracy</span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.4 }}>
                            1 wrong answer out of 1 attempted (-1 mark penalty incurred).
                          </p>
                          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Revise in Preparation Hub &rarr;</span>
                        </div>
                      </div>

                      {/* Section D: Prioritized Next Action */}
                      <div className="saas-preview-card">
                        <div className="saas-preview-card-head">
                          <span className="saas-meta-label">SECTION D · RECOMMENDED NEXT STEPS</span>
                          <span className="saas-phase-label">Priority 1</span>
                        </div>
                        <div style={{ borderLeft: '3px solid #2563eb', paddingLeft: '10px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                            Complete: Quantitative Aptitude
                          </strong>
                          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.4 }}>
                            Next incomplete milestone in Phase 1 roadmap. Advance your syllabus coverage.
                          </p>
                          <span className="saas-task-badge in-progress">Roadmap Milestone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Platform Features Section */}
        <section id="platform" className="saas-section saas-features-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-eyebrow">PLATFORM CAPABILITIES</span>
              <h2 className="saas-section-title">Everything you need for structured readiness.</h2>
              <p className="saas-section-description">
                Replace disconnected practice sites and fragmented resources with a focused, verifiable preparation ecosystem.
              </p>
            </div>

            <div className="saas-features-grid">
              {/* Feature 1 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-wrap">
                  <Layers size={22} />
                </div>
                <div className="saas-feature-tag">Milestone-Driven</div>
                <h3>Structured Preparation</h3>
                <p>
                  Work through clear 4-phase preparation roadmaps that systematically cover algorithmic patterns, core CS fundamentals, and technical interview problem solving.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-wrap">
                  <FileCheck2 size={22} />
                </div>
                <div className="saas-feature-tag">Server-Governed</div>
                <h3>Curriculum & Mock Assessments</h3>
                <p>
                  Master structured topics organized by company and role, and take full-length mock tests governed by strict timers and negative marking constraints.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-wrap">
                  <BarChart3 size={22} />
                </div>
                <div className="saas-feature-tag">Real-Time Diagnostics</div>
                <h3>Performance Tracking</h3>
                <p>
                  Review deep diagnostic analytics detailing your problem-solving accuracy, subject score breakdowns, pacing metrics, and specific weak topics requiring reinforcement.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-wrap">
                  <Target size={22} />
                </div>
                <div className="saas-feature-tag">Deterministic Score</div>
                <h3>Personalized Progress</h3>
                <p>
                  Experience a transparent readiness scoring engine that dynamically updates with every topic completion and mock test, showing your exact distance to placement readiness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="saas-section saas-workflow-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-eyebrow">HOW IT WORKS</span>
              <h2 className="saas-section-title">Three steps to placement readiness.</h2>
              <p className="saas-section-description">
                A simple, systematic workflow designed to turn consistent engineering effort into measurable campus hiring results.
              </p>
            </div>

            <div className="saas-workflow-grid">
              {/* Step 1 */}
              <div className="saas-workflow-card">
                <div className="saas-workflow-badge">
                  <span className="step-number">01</span>
                  <div className="step-icon"><UserCheck size={18} /></div>
                </div>
                <h3>Create Your Account</h3>
                <p>
                  Register in under 60 seconds with your engineering degree, branch, and graduation year to initialize your structured preparation profile.
                </p>
              </div>

              {/* Step 2 */}
              <div className="saas-workflow-card">
                <div className="saas-workflow-badge">
                  <span className="step-number">02</span>
                  <div className="step-icon"><Compass size={18} /></div>
                </div>
                <h3>Access Your Workspace</h3>
                <p>
                  Unlock your structured preparation roadmap, topic-wise learning guides, and server-timed mock assessments inside your dedicated student dashboard.
                </p>
              </div>

              {/* Step 3 */}
              <div className="saas-workflow-card">
                <div className="saas-workflow-badge">
                  <span className="step-number">03</span>
                  <div className="step-icon"><TrendingUp size={18} /></div>
                </div>
                <h3>Study, Test & Improve</h3>
                <p>
                  Master structured topics, complete timed assessment simulations, analyze weak area diagnostics, and build verifiable readiness for campus drives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. About HireVerse Section */}
        <section id="about" className="saas-section saas-about-section">
          <div className="saas-container">
            <div className="saas-about-grid">
              {/* Left Column: Purpose & Narrative */}
              <div className="saas-about-narrative">
                <span className="saas-section-eyebrow">ABOUT HIREVERSE</span>
                <h2 className="saas-about-heading">
                  Engineered to bring clarity, structure, and measurement to campus placements.
                </h2>
                <div className="saas-about-paragraphs">
                  <p>
                    For engineering students, preparing for campus recruitment often feels fragmented. Students bounce between scattered problem sets, theoretical notes, and conflicting advice without a reliable gauge of whether they are genuinely ready for technical rounds.
                  </p>
                  <p>
                    HireVerse was built to eliminate this confusion. By organizing the preparation journey into structured roadmaps, objective question verification, server-timed mock assessments, and transparent readiness metrics, we give students a focused, measurable path toward their career goals.
                  </p>
                  <p>
                    Every score and benchmark in HireVerse is deterministic and backed by recorded student activity—giving both students and college placement departments verified confidence in placement readiness.
                  </p>
                </div>

                <div className="saas-about-cta">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="saas-btn saas-btn-primary"
                      onClick={() => navigate(dashboardRoute)}
                    >
                      <span>Open Your Workspace</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <Link to="/register" className="saas-btn saas-btn-primary">
                      <span>Get Started with HireVerse</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Column: Key Principles */}
              <div className="saas-about-principles">
                <div className="saas-principle-card">
                  <div className="saas-principle-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4>Purpose-Built for Engineering</h4>
                    <p>Designed around real campus hiring formats, online assessment constraints, and core technical interview standards.</p>
                  </div>
                </div>

                <div className="saas-principle-card">
                  <div className="saas-principle-icon">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h4>Zero Fabricated Metrics</h4>
                    <p>Transparent mathematical evaluation based strictly on actual curriculum completion, roadmap milestones, and completed mock exams.</p>
                  </div>
                </div>

                <div className="saas-principle-card">
                  <div className="saas-principle-icon">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h4>Unified Preparation Experience</h4>
                    <p>Centralizes roadmap tracking, problem solving, full-length mock exams, and diagnostics into one cohesive platform.</p>
                  </div>
                </div>

                <div className="saas-principle-card">
                  <div className="saas-principle-icon">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4>Placement Cell Synergy</h4>
                    <p>Supports campus placement officers and faculty mentors with cohort readiness tracking, eligibility filters, and drive announcements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ Section */}
        <section id="faq" className="saas-section saas-faq-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-eyebrow">COMMON QUESTIONS</span>
              <h2 className="saas-section-title">Frequently Asked Questions</h2>
              <p className="saas-section-description">
                Find clear answers about HireVerse, how preparation tracking works, and how to access your workspace.
              </p>
            </div>

            <div className="saas-faq-accordion" role="region" aria-label="Frequently Asked Questions">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index
                return (
                  <div
                    key={faq.q}
                    className={`saas-faq-card ${isOpen ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      className="saas-faq-trigger"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <span className="saas-faq-q-text">{faq.q}</span>
                      <div className="saas-faq-icon">
                        <ChevronDown size={18} className={`chevron-arrow ${isOpen ? 'rotate' : ''}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div id={`faq-answer-${index}`} className="saas-faq-content" role="region">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 8. Final Call-to-Action Section */}
        <section className="saas-section saas-cta-section">
          <div className="saas-container">
            <div className="saas-cta-card">
              <div className="saas-cta-badge">
                <Sparkles size={14} />
                <span>Placement Readiness Platform</span>
              </div>
              <h2 className="saas-cta-heading">Ready to Take the Next Step?</h2>
              <p className="saas-cta-description">
                Build consistency, measure your progress, and move forward with confidence.
              </p>
              <div className="saas-cta-actions">
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="saas-btn saas-btn-white saas-btn-lg"
                    onClick={() => navigate(dashboardRoute)}
                  >
                    <LayoutDashboard size={16} />
                    <span>Go to Dashboard</span>
                  </button>
                ) : (
                  <>
                    <Link to="/register" className="saas-btn saas-btn-white saas-btn-lg">
                      <span>Get Started</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="saas-btn saas-btn-translucent saas-btn-lg">
                      <span>Sign In to Existing Account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Professional Footer */}
      <footer className="saas-footer">
        <div className="saas-container">
          <div className="saas-footer-main">
            {/* Brand Col */}
            <div className="saas-footer-brand-col">
              <Link to="/" className="saas-brand saas-brand-footer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="saas-brand-icon">
                  <span>H</span>
                </div>
                <div className="saas-brand-text">
                  <strong>Hire<span>Verse</span></strong>
                  <small>Placement Platform</small>
                </div>
              </Link>
              <p className="saas-footer-desc">
                Company-Wise Placement Preparation & Interview Readiness Platform. Structured preparation roadmaps, server-timed mock tests, and verifiable readiness scoring.
              </p>
              <div className="saas-footer-badge">
                <CheckCircle2 size={13} />
                <span>Built for Engineering Students & Placement Cells</span>
              </div>
            </div>

            {/* Links Col 1: Platform Navigation */}
            <div className="saas-footer-links-col">
              <h4>Platform</h4>
              <ul>
                <li><a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                <li><a href="#platform" onClick={(e) => scrollToSection(e, 'platform')}>Platform Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a></li>
                <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About HireVerse</a></li>
                <li><a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a></li>
              </ul>
            </div>

            {/* Links Col 2: Workspace Portals */}
            <div className="saas-footer-links-col">
              <h4>Workspace Portals</h4>
              <ul>
                {isAuthenticated ? (
                  <li><Link to={dashboardRoute}>Student Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link to="/login">Student Sign In</Link></li>
                    <li><Link to="/register">Student Registration</Link></li>
                  </>
                )}
                <li><Link to="/placement-portal">Placement Officer Portal</Link></li>
                <li><Link to="/admin">Admin Workspace</Link></li>
              </ul>
            </div>

            {/* Links Col 3: Resources & Trust */}
            <div className="saas-footer-links-col">
              <h4>System & Policies</h4>
              <ul>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => setLegalModal('privacy')}>
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => setLegalModal('terms')}>
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => setLegalModal('security')}>
                    Data & Evaluation Security
                  </button>
                </li>
                <li>
                  <span className="saas-footer-status">
                    <span className="status-dot-green" /> Database: MongoDB Atlas
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="saas-footer-bottom">
            <p>© {new Date().getFullYear()} HireVerse. All rights reserved.</p>
            <div className="saas-footer-bottom-links">
              <span>MERN Stack Platform</span>
              <em>·</em>
              <span>Deterministic Readiness Engine</span>
              <em>·</em>
              <span>Verified Campus Hiring Solutions</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Informational Modal for Legal Links (No 404s) */}
      {legalModal && (
        <div className="saas-modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="saas-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="saas-modal-head">
              <h3>
                {legalModal === 'privacy' && 'Privacy Policy'}
                {legalModal === 'terms' && 'Terms of Service'}
                {legalModal === 'security' && 'Data & Evaluation Security'}
              </h3>
              <button
                type="button"
                className="saas-modal-close"
                onClick={() => setLegalModal(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="saas-modal-body">
              {legalModal === 'privacy' && (
                <>
                  <p><strong>Your Privacy is Guaranteed:</strong> HireVerse respects student confidentiality. We store academic profile data (branch, graduation year, CGPA) strictly for placement preparation, mock assessment benchmarks, and campus placement drive eligibility.</p>
                  <p>Passwords are hashed using bcrypt before database storage, and authentication tokens use industry-standard JSON Web Tokens (JWT). Student records are accessible only to authorized college placement administrators and the individual student.</p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p><strong>Platform Usage Standards:</strong> HireVerse is provided for engineering students, faculty mentors, and college placement coordinators. All mock assessment questions, roadmap milestones, and readiness scoring logic are intended for educational and recruitment preparation purposes.</p>
                  <p>Students agree to uphold academic honesty during timed mock assessments and campus drive applications.</p>
                </>
              )}
              {legalModal === 'security' && (
                <>
                  <p><strong>Server-Governed Evaluation:</strong> HireVerse executes all mock test grading and score calculations server-side with deterministic algorithms and strict timers to prevent client-side answer tampering.</p>
                  <p>All database transactions are securely managed via MongoDB Atlas cloud clusters with encrypted connections and role-based access control.</p>
                </>
              )}
            </div>
            <div className="saas-modal-foot">
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                onClick={() => setLegalModal(null)}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
