import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Target,
  Milestone,
  FileCheck2,
  Layers,
  ChevronDown,
  BookOpen,
  Building2,
  Clock,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Check,
  Compass,
  FileText,
  Video,
  Award
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PublicNavbar from '../components/layout/PublicNavbar'
import '../saas-landing.css'

export function LandingPage() {
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeFaq, setActiveFaq] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [legalModal, setLegalModal] = useState(null) // 'privacy' | 'terms' | 'security' | null

  // Active section and fixed navbar scroll state
  const [activeSection, setActiveSection] = useState('hero')
  const [isScrolled, setIsScrolled] = useState(false)
  const isClickScrollingRef = useRef(false)
  const clickTimerRef = useRef(null)

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

  // Smooth scroll handler with fixed navbar offset & reduced motion support
  const scrollToSection = (e, id) => {
    if (e) e.preventDefault()
    setMobileMenuOpen(false)
    setActiveSection(id)

    // Lock automatic scroll spy momentarily during smooth scroll transition
    isClickScrollingRef.current = true
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false
    }, 800)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = prefersReducedMotion ? 'auto' : 'smooth'

    if (id === 'hero') {
      window.scrollTo({
        top: 0,
        behavior
      })
      if (window.history.pushState) {
        window.history.pushState(null, '', '#hero')
      }
      return
    }

    const element = document.getElementById(id)
    if (element) {
      const navOffset = 74
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navOffset

      window.scrollTo({
        top: offsetPosition,
        behavior
      })

      if (window.history.pushState) {
        window.history.pushState(null, '', `#${id}`)
      }
    }
  }

  // Active section tracking & scroll elevation state
  useEffect(() => {
    const sectionIds = ['hero', 'features', 'overview', 'workflow', 'faq']

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      setIsScrolled(scrollY > 10)

      if (isClickScrollingRef.current) return

      // Boundary 1: Top of page (Hero/Home)
      if (scrollY < 80) {
        setActiveSection('hero')
        return
      }

      // Boundary 2: Bottom of page (FAQ / final content)
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      if (scrollY + windowHeight >= documentHeight - 80) {
        setActiveSection('faq')
        return
      }

      // Intermediate sections: check which section intersects 110px from top
      const detectionLine = 110
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i]
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= detectionLine && rect.bottom > detectionLine) {
            setActiveSection(id)
            return
          }
        }
      }
    }

    let rafId = null
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Check initial position on mount
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [])

  // Handle deep-link section hash or navigation state
  useEffect(() => {
    const target = location.state?.scrollTo || location.hash.replace('#', '')
    if (target) {
      const sectionIds = ['hero', 'features', 'overview', 'workflow', 'faq']
      const targetId = (target === 'platform' || target === 'about')
        ? 'overview'
        : (target === 'how-it-works' ? 'workflow' : target)

      if (sectionIds.includes(targetId)) {
        const timer = setTimeout(() => {
          scrollToSection(null, targetId)
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [location.hash, location.state])

  const faqs = [
    {
      q: 'What is HireVerse?',
      a: 'HireVerse is a comprehensive placement and interview preparation platform designed for college students, graduates, freshers, and tech job seekers. It brings together company-specific topic syllabi, structured milestone roadmaps, server-timed mock assessments, and progress tracking in one unified workspace.'
    },
    {
      q: 'How does company-specific preparation work?',
      a: 'When you select your target company and job role, HireVerse filters relevant syllabus topics, core CS fundamentals, and assessment formats tailored to typical recruitment patterns for that organization.'
    },
    {
      q: 'What are the mock assessments based on?',
      a: 'Mock tests feature representative questions across Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks, and Aptitude. Assessments are timed with optional negative marking to simulate real recruitment rounds.'
    },
    {
      q: 'How does roadmap progress tracking work?',
      a: 'As you study syllabus topics in the Preparation Hub, you can mark them as completed. Your roadmap milestones and overall syllabus completion metrics update automatically in real time.'
    },
    {
      q: 'Who can access the Placement Officer and Admin Portals?',
      a: 'College placement coordinators and faculty can access the Placement Portal to monitor cohort readiness and organize campus drives. System administrators manage company data, question banks, and user accounts through the Admin Workspace.'
    },
    {
      q: 'Is my preparation progress saved across devices?',
      a: 'Yes. All completed syllabus items, test scores, milestone checkpoints, and target company selections are stored securely in the database and synchronized whenever you sign in.'
    }
  ]

  return (
    <div className="saas-landing">
      {/* 1. Persistent Public Navbar */}
      <PublicNavbar
        activeSection={activeSection}
        onScrollToSection={scrollToSection}
      />

      <main className="saas-main-content">
        {/* 2. Hero Section (Two-Column Layout) */}
        <section id="hero" className="saas-hero-section">
          <div className="saas-container">
            <div className="saas-hero-grid">
              {/* Left Column: Compelling Content */}
              <div className="saas-hero-copy">
                {/* Eyebrow Label */}
                <div className="saas-hero-eyebrow">
                  <span className="saas-hero-eyebrow-dot" />
                  <span>YOUR CAREER. YOUR PREPARATION. YOUR NEXT STEP.</span>
                </div>

                {/* Main Headline */}
                <h1 className="saas-hero-title">
                  Turn Your Placement Goals Into a <span className="highlight">Clear Plan.</span>
                </h1>

                {/* Supporting Content */}
                <p className="saas-hero-subtitle">
                  Prepare for your target company with structured learning resources, a guided syllabus roadmap, and mock assessments that help you understand your progress.
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
                        <LayoutDashboard size={16} />
                        <span>Go to Dashboard</span>
                      </button>
                      <a
                        href="#features"
                        className="saas-btn saas-btn-outline saas-btn-lg"
                        onClick={(e) => scrollToSection(e, 'features')}
                      >
                        <span>Explore the Platform</span>
                      </a>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="saas-btn saas-btn-primary saas-btn-lg">
                        <span>Register</span>
                        <ArrowRight size={16} />
                      </Link>
                      <a
                        href="#features"
                        className="saas-btn saas-btn-outline saas-btn-lg"
                        onClick={(e) => scrollToSection(e, 'features')}
                      >
                        <span>Explore the Platform</span>
                      </a>
                    </>
                  )}
                </div>

                {/* Subtle Supporting Line */}
                <div className="saas-hero-support-line">
                  <span>Company-focused learning</span>
                  <em>·</em>
                  <span>Structured preparation</span>
                  <em>·</em>
                  <span>Progress tracking</span>
                </div>
              </div>

              {/* Right Column: Layered Product Showcase */}
              <div className="saas-hero-visual">
                {/* Minimal Decorative Geometry */}
                <div className="mockup-deco-shape mockup-deco-shape-1" />
                <div className="mockup-deco-shape mockup-deco-shape-2" />

                {/* Main Preview Panel (Application-Style) */}
                <div className="saas-product-mockup">
                  {/* Window Bar */}
                  <div className="mockup-header">
                    <div className="mockup-window-controls">
                      <span className="mockup-dot mockup-dot-red" />
                      <span className="mockup-dot mockup-dot-yellow" />
                      <span className="mockup-dot mockup-dot-green" />
                    </div>
                    <div className="mockup-titlebar">
                      <span>HireVerse</span>
                      <span className="mockup-titlebar-tag">Preparation Hub</span>
                    </div>
                    <div className="mockup-header-action">
                      <ShieldCheck size={13} />
                      <span>Verified Syllabus</span>
                    </div>
                  </div>

                  {/* Window Body */}
                  <div className="mockup-body">
                    {/* Placement Target Card */}
                    <div className="mockup-target-card">
                      <div className="mockup-target-info">
                        <div className="mockup-company-avatar">
                          <span>A</span>
                        </div>
                        <div className="mockup-target-titles">
                          <strong>Accenture · Full Stack Developer</strong>
                          <span>3 Rounds · Technical Interview & Assessment</span>
                        </div>
                      </div>
                      <span className="mockup-target-badge">Target Selected</span>
                    </div>

                    {/* Split Metrics: Syllabus Progress & Mock Assessment */}
                    <div className="mockup-metrics-row">
                      {/* Syllabus Progress */}
                      <div className="mockup-metric-card">
                        <div className="mockup-metric-head">
                          <span className="mockup-metric-label">Syllabus Progress</span>
                          <span className="mockup-metric-pill">24 / 35 Topics</span>
                        </div>
                        <div className="mockup-metric-value">68%</div>
                        <div className="mockup-progress-track">
                          <div className="mockup-progress-fill" style={{ width: '68%' }} />
                        </div>
                        <div className="mockup-metric-sub">11 remaining topics</div>
                      </div>

                      {/* Mock Assessment Performance */}
                      <div className="mockup-metric-card accent">
                        <div className="mockup-metric-head">
                          <span className="mockup-metric-label">Latest Assessment</span>
                          <span className="mockup-metric-pill">Submitted</span>
                        </div>
                        <div className="mockup-metric-value">82%</div>
                        <div className="mockup-metric-sub">Technical Mock #1 · 42m duration</div>
                        <div className="mockup-metric-sub" style={{ color: 'var(--hv-blue)', fontWeight: 600, marginTop: '6px' }}>
                          Negative marking simulated
                        </div>
                      </div>
                    </div>

                    {/* Compact Roadmap Preview */}
                    <div className="mockup-roadmap-preview">
                      <div className="mockup-roadmap-header">
                        <span>Guided Roadmap Milestones</span>
                        <span style={{ fontSize: '11px', color: 'var(--hv-blue)', fontWeight: 600 }}>Phase 2 of 4</span>
                      </div>
                      <div className="mockup-roadmap-items">
                        <div className="mockup-roadmap-item completed">
                          <div className="mockup-item-left">
                            <CheckCircle2 size={15} color="var(--hv-green)" />
                            <span>Phase 1 — Core Programming & DSA</span>
                          </div>
                          <span className="mockup-item-status done">
                            <Check size={12} /> Completed
                          </span>
                        </div>

                        <div className="mockup-roadmap-item active">
                          <div className="mockup-item-left">
                            <Sparkles size={15} color="var(--hv-blue)" />
                            <span>Phase 2 — Core CS: DBMS & Operating Systems</span>
                          </div>
                          <span className="mockup-item-status progress">In Progress</span>
                        </div>

                        <div className="mockup-roadmap-item">
                          <div className="mockup-item-left">
                            <Clock size={15} color="var(--hv-slate)" />
                            <span>Phase 3 — System Architecture & Web Frameworks</span>
                          </div>
                          <span className="mockup-item-status next">Upcoming</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Floating Elements */}
                <div className="mockup-floating-badge">
                  <div className="mockup-floating-icon">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="mockup-floating-text">
                    <strong>Next Milestone: DBMS & SQL</strong>
                    <span>4 topics remaining in Phase 2</span>
                  </div>
                </div>

                <div className="mockup-floating-pill">
                  <span className="mockup-pill-dot" />
                  <span>Readiness Index: 74% On Track</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. High-Quality Value Strip */}
        <section className="saas-value-strip" aria-label="Key Capabilities">
          <div className="saas-container">
            <div className="saas-value-grid">
              <div className="saas-value-item">
                <div className="saas-value-icon">
                  <Target size={18} />
                </div>
                <div className="saas-value-label">Company-Specific Preparation</div>
              </div>

              <div className="saas-value-item">
                <div className="saas-value-icon">
                  <BookOpen size={18} />
                </div>
                <div className="saas-value-label">Curated Learning Resources</div>
              </div>

              <div className="saas-value-item">
                <div className="saas-value-icon">
                  <Milestone size={18} />
                </div>
                <div className="saas-value-label">Guided Syllabus Roadmap</div>
              </div>

              <div className="saas-value-item">
                <div className="saas-value-icon">
                  <FileCheck2 size={18} />
                </div>
                <div className="saas-value-label">Mock Assessment Practice</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Premium Features Section */}
        <section id="features" className="saas-section saas-features-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-eyebrow">BUILT FOR YOUR PLACEMENT JOURNEY</span>
              <h2 className="saas-section-title">Everything You Need. One Focused Preparation Space.</h2>
              <p className="saas-section-description">
                Bring your learning resources, preparation plan, and practice assessments together in one organized experience.
              </p>
            </div>

            <div className="saas-features-grid">
              {/* Feature 1 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-container">
                  <Building2 size={22} />
                </div>
                <div className="saas-feature-number">01 / TARGET</div>
                <h3>Company-Focused Preparation</h3>
                <p>
                  Choose your target company and role to focus your preparation around relevant syllabus topics.
                </p>
              </div>

              {/* Feature 2 (Featured card) */}
              <div className="saas-feature-card is-featured">
                <div className="saas-feature-icon-container">
                  <BookOpen size={22} />
                </div>
                <div className="saas-feature-number">02 / CURRICULUM</div>
                <h3>Preparation Hub</h3>
                <p>
                  Access mapped learning resources and organize your study around the topics you need to cover.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-container">
                  <Milestone size={22} />
                </div>
                <div className="saas-feature-number">03 / STAGES</div>
                <h3>Guided Roadmap</h3>
                <p>
                  Follow your preparation stages, mark completed topics, and track your syllabus progress.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="saas-feature-card">
                <div className="saas-feature-icon-container">
                  <FileCheck2 size={22} />
                </div>
                <div className="saas-feature-number">04 / PRACTICE</div>
                <h3>Mock Assessments</h3>
                <p>
                  Practice with available assessments and review your submitted performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Visual Product-Explanation Section (Editorial Split) */}
        <section id="overview" className="saas-section saas-explain-section">
          <div className="saas-container">
            <div className="saas-explain-grid">
              {/* Left Column: Explanatory Content */}
              <div className="saas-explain-copy">
                <span className="saas-section-eyebrow">A MORE ORGANIZED WAY TO PREPARE</span>
                <h2 className="saas-explain-heading">Know What to Study. Know Where You Stand.</h2>
                <p className="saas-explain-lead">
                  Preparation becomes easier to manage when your target, learning plan, and progress are organized in one place.
                </p>

                <div className="saas-explain-benefits">
                  <div className="saas-benefit-item">
                    <div className="saas-benefit-check">
                      <Check size={14} />
                    </div>
                    <div className="saas-benefit-text">
                      <strong>A clear starting point</strong>
                      <span>— Focus on the company and role you selected.</span>
                    </div>
                  </div>

                  <div className="saas-benefit-item">
                    <div className="saas-benefit-check">
                      <Check size={14} />
                    </div>
                    <div className="saas-benefit-text">
                      <strong>A structured learning plan</strong>
                      <span>— Follow mapped syllabus topics and resources.</span>
                    </div>
                  </div>

                  <div className="saas-benefit-item">
                    <div className="saas-benefit-check">
                      <Check size={14} />
                    </div>
                    <div className="saas-benefit-text">
                      <strong>Visible preparation progress</strong>
                      <span>— See the topics you have completed and those that remain.</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="saas-btn saas-btn-primary"
                      onClick={() => navigate(dashboardRoute)}
                    >
                      <span>Open Preparation Hub</span>
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

              {/* Right Column: Realistic Product Preview Panel */}
              <div className="saas-explain-preview">
                <div className="explain-preview-card">
                  {/* Card Header */}
                  <div className="explain-preview-head">
                    <div className="explain-preview-company">
                      <div className="explain-preview-avatar">A</div>
                      <div>
                        <div className="explain-preview-company-name">Accenture Syllabus</div>
                        <div className="explain-preview-company-role">Full Stack Developer Track</div>
                      </div>
                    </div>
                    <div className="explain-preview-filter-tabs">
                      <span className="explain-tab-pill active">All (35)</span>
                      <span className="explain-tab-pill inactive">Completed (24)</span>
                      <span className="explain-tab-pill inactive">Remaining (11)</span>
                    </div>
                  </div>

                  {/* Topic Rows */}
                  <div className="explain-preview-body">
                    <div className="explain-topic-row">
                      <div className="explain-topic-left">
                        <div className="explain-topic-checkbox checked">
                          <Check size={13} />
                        </div>
                        <div className="explain-topic-info">
                          <strong>Sliding Window & Two-Pointer Patterns</strong>
                          <span>DSA · Arrays & Strings</span>
                        </div>
                      </div>
                      <div className="explain-topic-badges">
                        <span className="explain-resource-pill">
                          <FileText size={11} /> 2 Docs
                        </span>
                        <span className="explain-resource-pill">
                          <Video size={11} /> 1 Video
                        </span>
                      </div>
                    </div>

                    <div className="explain-topic-row">
                      <div className="explain-topic-left">
                        <div className="explain-topic-checkbox checked">
                          <Check size={13} />
                        </div>
                        <div className="explain-topic-info">
                          <strong>Binary Search & Search Space Reduction</strong>
                          <span>DSA · Searching Algorithms</span>
                        </div>
                      </div>
                      <div className="explain-topic-badges">
                        <span className="explain-resource-pill">
                          <FileText size={11} /> 1 Doc
                        </span>
                        <span className="explain-resource-pill">
                          <Award size={11} /> 8 Questions
                        </span>
                      </div>
                    </div>

                    <div className="explain-topic-row">
                      <div className="explain-topic-left">
                        <div className="explain-topic-checkbox progress" />
                        <div className="explain-topic-info">
                          <strong>Transactions & ACID Properties</strong>
                          <span>Core CS · Database Management Systems</span>
                        </div>
                      </div>
                      <div className="explain-topic-badges">
                        <span className="explain-resource-pill" style={{ color: 'var(--hv-blue)', borderColor: 'rgba(54, 92, 245, 0.25)' }}>
                          <Clock size={11} /> In Study
                        </span>
                        <span className="explain-resource-pill">
                          <FileText size={11} /> 1 Guide
                        </span>
                      </div>
                    </div>

                    <div className="explain-topic-row">
                      <div className="explain-topic-left">
                        <div className="explain-topic-checkbox progress" />
                        <div className="explain-topic-info">
                          <strong>Process Scheduling & Deadlocks</strong>
                          <span>Core CS · Operating Systems</span>
                        </div>
                      </div>
                      <div className="explain-topic-badges">
                        <span className="explain-resource-pill">
                          <FileText size={11} /> 2 Guides
                        </span>
                        <span className="explain-resource-pill">
                          <Award size={11} /> 5 Questions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Explain the Workflow Simply */}
        <section id="workflow" className="saas-section saas-workflow-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-eyebrow">HOW IT WORKS</span>
              <h2 className="saas-section-title">From Preparation to Practice</h2>
              <p className="saas-section-description">
                A simple, systematic workflow designed to turn consistent preparation effort into measurable interview and hiring results.
              </p>
            </div>

            <div className="saas-workflow-grid">
              <div className="saas-workflow-line" />

              {/* Step 1 */}
              <div className="saas-step-card">
                <div className="saas-step-header">
                  <span className="saas-step-number">01</span>
                  <div className="saas-step-icon">
                    <Target size={20} />
                  </div>
                </div>
                <h3>Choose Your Target</h3>
                <p>
                  Select the company and job role you want to prepare for.
                </p>
              </div>

              {/* Step 2 */}
              <div className="saas-step-card">
                <div className="saas-step-header">
                  <span className="saas-step-number">02</span>
                  <div className="saas-step-icon">
                    <BookOpen size={20} />
                  </div>
                </div>
                <h3>Learn with Structure</h3>
                <p>
                  Use the Preparation Hub and Roadmap to study relevant topics and track completion.
                </p>
              </div>

              {/* Step 3 */}
              <div className="saas-step-card">
                <div className="saas-step-header">
                  <span className="saas-step-number">03</span>
                  <div className="saas-step-icon">
                    <FileCheck2 size={20} />
                  </div>
                </div>
                <h3>Practice and Review</h3>
                <p>
                  Attempt mock assessments and review your submitted scores.
                </p>
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

        {/* 8. Strong Final Call to Action */}
        <section className="saas-cta-section">
          <div className="saas-container">
            <div className="saas-cta-card">
              <div className="saas-cta-eyebrow">
                <Sparkles size={13} />
                <span>PLACEMENT READINESS PLATFORM</span>
              </div>
              <h2 className="saas-cta-heading">Make Your Preparation More Intentional.</h2>
              <p className="saas-cta-description">
                Build a consistent study plan, follow your progress, and prepare for your next placement opportunity with HireVerse.
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
                      <span>Get Started with HireVerse</span>
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

      {/* 9. Complete Polished Footer */}
      <footer className="saas-footer">
        <div className="saas-container">
          <div className="saas-footer-main">
            {/* Brand Column */}
            <div className="saas-footer-brand-col">
              <Link
                to="/"
                className="saas-brand saas-brand-footer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="saas-brand-icon">
                  <Compass size={20} />
                </div>
                <div className="saas-brand-text">
                  <strong>Hire<span>Verse</span></strong>
                  <small>Placement Platform</small>
                </div>
              </Link>
              <p className="saas-footer-desc">
                Company-Wise Placement Preparation & Interview Readiness Platform. Structured syllabus roadmaps, mapped resources, and server-timed mock assessments.
              </p>
              <div className="saas-footer-badge">
                <CheckCircle2 size={13} />
                <span>Built for Students, Graduates & Tech Job Seekers</span>
              </div>
            </div>

            {/* Links Col 1: Platform Navigation */}
            <div className="saas-footer-links-col">
              <h4>Platform</h4>
              <ul>
                <li>
                  <a
                    href="#hero"
                    onClick={(e) => {
                      e.preventDefault()
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#overview" onClick={(e) => scrollToSection(e, 'overview')}>
                    Platform Overview
                  </a>
                </li>
                <li>
                  <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Links Col 2: Workspace Portals */}
            <div className="saas-footer-links-col">
              <h4>Workspace Portals</h4>
              <ul>
                {isAuthenticated ? (
                  <li>
                    <Link to={dashboardRoute}>Preparation Dashboard</Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link to="/login">Candidate Sign In</Link>
                    </li>
                    <li>
                      <Link to="/register">Candidate Registration</Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to="/placement-portal">Placement Officer Portal</Link>
                </li>
                <li>
                  <Link to="/admin">Admin Workspace</Link>
                </li>
              </ul>
            </div>

            {/* Links Col 3: System & Policies */}
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
              <span>MERN Stack Architecture</span>
              <em>·</em>
              <span>Server-Governed Assessments</span>
              <em>·</em>
              <span>Verified Career & Hiring Solutions</span>
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
                  <p><strong>Your Privacy is Respected:</strong> HireVerse stores candidate academic profile data (branch, graduation year, target company) strictly for interview preparation, mock assessment benchmarks, and recruitment eligibility.</p>
                  <p>Passwords are securely hashed using bcrypt before database storage, and authentication sessions use industry-standard JSON Web Tokens (JWT). Profile records are accessible only to authorized placement administrators and the individual candidate.</p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p><strong>Platform Usage Standards:</strong> HireVerse is designed for students, graduates, job seekers, faculty mentors, and college placement coordinators. All mock assessment questions, roadmap milestones, and readiness scoring logic are intended for educational and career preparation purposes.</p>
                  <p>Candidates agree to uphold academic honesty during timed mock assessments and hiring preparation.</p>
                </>
              )}
              {legalModal === 'security' && (
                <>
                  <p><strong>Server-Governed Evaluation:</strong> HireVerse executes mock test grading and score calculations server-side with strict timers to prevent client-side answer tampering.</p>
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
