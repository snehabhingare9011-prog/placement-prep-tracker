import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Compass, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../saas-landing.css'

export function PublicNavbar({
  activeSection: propActiveSection,
  onScrollToSection
}) {
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isLanding = location.pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(!isLanding)
  const [internalActiveSection, setInternalActiveSection] = useState(isLanding ? 'hero' : null)
  const isClickScrollingRef = useRef(false)
  const clickTimerRef = useRef(null)

  // Active section only highlighted when viewing landing page
  const activeSection = isLanding
    ? (propActiveSection !== undefined ? propActiveSection : internalActiveSection)
    : null

  const isAuthenticated = Boolean(user && token)

  const dashboardRoute = user?.role === 'admin'
    ? '/admin'
    : (user?.role === 'placement_officer' || user?.role === 'faculty')
      ? '/placement-portal'
      : (!user?.targetCompany ? '/onboarding' : '/dashboard')

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll detection & section spy (active on landing page)
  useEffect(() => {
    if (!isLanding) {
      setIsScrolled(true)
      return
    }

    const sectionIds = ['hero', 'features', 'overview', 'workflow', 'faq']

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      setIsScrolled(scrollY > 10)

      if (isClickScrollingRef.current) return

      // Boundary 1: Top of page (Hero/Home)
      if (scrollY < 80) {
        setInternalActiveSection('hero')
        return
      }

      // Boundary 2: Bottom of page (FAQ / footer)
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      if (scrollY + windowHeight >= documentHeight - 80) {
        setInternalActiveSection('faq')
        return
      }

      // Intermediate sections detection
      const detectionLine = 110
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i]
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= detectionLine && rect.bottom > detectionLine) {
            setInternalActiveSection(id)
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
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [isLanding])

  const scrollToSection = (e, id) => {
    if (e) e.preventDefault()
    setMobileMenuOpen(false)

    if (isLanding) {
      if (onScrollToSection) {
        onScrollToSection(e, id)
        return
      }

      setInternalActiveSection(id)
      isClickScrollingRef.current = true
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      clickTimerRef.current = setTimeout(() => {
        isClickScrollingRef.current = false
      }, 800)

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const behavior = prefersReducedMotion ? 'auto' : 'smooth'

      if (id === 'hero') {
        window.scrollTo({ top: 0, behavior })
        if (window.history.pushState) window.history.pushState(null, '', '#hero')
        return
      }

      const element = document.getElementById(id)
      if (element) {
        const navOffset = 74
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - navOffset
        window.scrollTo({ top: offsetPosition, behavior })
        if (window.history.pushState) window.history.pushState(null, '', `#${id}`)
      }
    } else {
      // User is on /login, /register, etc. -> smoothly navigate to landing page section
      navigate(`/#${id}`, { state: { scrollTo: id } })
    }
  }

  const handleBrandClick = (e) => {
    if (isLanding) {
      scrollToSection(e, 'hero')
    } else {
      navigate('/')
    }
  }

  return (
    <header className={`saas-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="saas-nav-container">
        {/* Brand Wordmark */}
        <Link
          to="/"
          className="saas-brand"
          onClick={handleBrandClick}
          aria-label="HireVerse Home"
        >
          <div className="saas-brand-icon">
            <Compass size={20} />
          </div>
          <div className="saas-brand-text">
            <strong>Hire<span>Verse</span></strong>
            <small>Placement Platform</small>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="saas-nav-menu" aria-label="Main Navigation">
          <a
            href="/#hero"
            className={activeSection === 'hero' ? 'is-active' : ''}
            onClick={(e) => scrollToSection(e, 'hero')}
            aria-current={activeSection === 'hero' ? 'page' : undefined}
          >
            Home
          </a>
          <a
            href="/#features"
            className={activeSection === 'features' ? 'is-active' : ''}
            onClick={(e) => scrollToSection(e, 'features')}
            aria-current={activeSection === 'features' ? 'page' : undefined}
          >
            Features
          </a>
          <a
            href="/#overview"
            className={activeSection === 'overview' ? 'is-active' : ''}
            onClick={(e) => scrollToSection(e, 'overview')}
            aria-current={activeSection === 'overview' ? 'page' : undefined}
          >
            Platform
          </a>
          <a
            href="/#workflow"
            className={activeSection === 'workflow' ? 'is-active' : ''}
            onClick={(e) => scrollToSection(e, 'workflow')}
            aria-current={activeSection === 'workflow' ? 'page' : undefined}
          >
            How It Works
          </a>
          <a
            href="/#faq"
            className={activeSection === 'faq' ? 'is-active' : ''}
            onClick={(e) => scrollToSection(e, 'faq')}
            aria-current={activeSection === 'faq' ? 'page' : undefined}
          >
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
                  <Link
                    to="/login"
                    className="saas-btn saas-btn-secondary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="saas-btn saas-btn-primary"
                  >
                    <span>Register</span>
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
          <nav className="saas-mobile-links" aria-label="Mobile Navigation">
            <a
              href="/#hero"
              className={activeSection === 'hero' ? 'is-active' : ''}
              onClick={(e) => scrollToSection(e, 'hero')}
              aria-current={activeSection === 'hero' ? 'page' : undefined}
            >
              <span>Home</span>
              {activeSection === 'hero' && <span className="mobile-active-dot" />}
            </a>
            <a
              href="/#features"
              className={activeSection === 'features' ? 'is-active' : ''}
              onClick={(e) => scrollToSection(e, 'features')}
              aria-current={activeSection === 'features' ? 'page' : undefined}
            >
              <span>Features</span>
              {activeSection === 'features' && <span className="mobile-active-dot" />}
            </a>
            <a
              href="/#overview"
              className={activeSection === 'overview' ? 'is-active' : ''}
              onClick={(e) => scrollToSection(e, 'overview')}
              aria-current={activeSection === 'overview' ? 'page' : undefined}
            >
              <span>Platform</span>
              {activeSection === 'overview' && <span className="mobile-active-dot" />}
            </a>
            <a
              href="/#workflow"
              className={activeSection === 'workflow' ? 'is-active' : ''}
              onClick={(e) => scrollToSection(e, 'workflow')}
              aria-current={activeSection === 'workflow' ? 'page' : undefined}
            >
              <span>How It Works</span>
              {activeSection === 'workflow' && <span className="mobile-active-dot" />}
            </a>
            <a
              href="/#faq"
              className={activeSection === 'faq' ? 'is-active' : ''}
              onClick={(e) => scrollToSection(e, 'faq')}
              aria-current={activeSection === 'faq' ? 'page' : undefined}
            >
              <span>FAQ</span>
              {activeSection === 'faq' && <span className="mobile-active-dot" />}
            </a>
          </nav>

          <div className="saas-mobile-actions">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="saas-btn saas-btn-primary saas-btn-block"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate(dashboardRoute)
                    }}
                  >
                    <LayoutDashboard size={16} />
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
                      <span>Register</span>
                      <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicNavbar
