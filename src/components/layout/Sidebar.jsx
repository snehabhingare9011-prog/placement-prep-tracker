import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FileCheck2,
  Milestone,
  Target,
  BarChart3,
  FileText,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Sidebar({ mobileOpen, closeMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isStaff = user?.role === 'placement_officer' || user?.role === 'faculty' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return (
    <>
      {mobileOpen && <div className="sidebar-mobile-backdrop" onClick={closeMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/dashboard" className="brand" onClick={closeMobile}>
            <span className="brand-mark">H</span>
            <span>Hire<span>Verse</span></span>
          </Link>
          <button type="button" className="sidebar-close-btn" onClick={closeMobile} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <p className="nav-label">PREPARATION</p>
        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/companies"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <Building2 size={18} />
            <span>Companies</span>
          </NavLink>

          <NavLink
            to="/company-prep"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <BookOpen size={18} />
            <span>Preparation Hub</span>
          </NavLink>

          <NavLink
            to="/mock-tests"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <FileCheck2 size={18} />
            <span>Mock Assessments</span>
          </NavLink>

          <NavLink
            to="/roadmap"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <Milestone size={18} />
            <span>Roadmap</span>
          </NavLink>

          <NavLink
            to="/readiness"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <Target size={18} />
            <span>Readiness Score</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <BarChart3 size={18} />
            <span>Progress Analytics</span>
          </NavLink>
        </nav>

        <p className="nav-label">AI CAREER ACCELERATORS</p>
        <nav>
          <NavLink
            to="/resume-analyzer"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <FileText size={18} />
            <span>AI Resume Analyzer</span>
          </NavLink>

          <NavLink
            to="/ai-interview"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <Sparkles size={18} />
            <span>AI Mock Interview</span>
          </NavLink>
        </nav>

        {isStaff && (
          <>
            <p className="nav-label">COLLEGE PORTAL</p>
            <nav>
              <NavLink
                to="/placement-portal"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <GraduationCap size={18} />
                <span>Placement Officers</span>
              </NavLink>
            </nav>
          </>
        )}

        {isAdmin && (
          <>
            <p className="nav-label">ADMINISTRATION</p>
            <nav>
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <ShieldCheck size={18} />
                <span>Admin Workspace</span>
              </NavLink>
            </nav>
          </>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-user-compact">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-text">
              <strong>{user?.name || 'Guest User'}</strong>
              <small>{user?.role ? user.role.replace('_', ' ') : 'Student'}</small>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
