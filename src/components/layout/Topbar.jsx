import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, Menu, UserCircle, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import CompanyMark from '../common/CompanyMark'
import api from '../../api/client'

export function Topbar({ onOpenTarget, onOpenProfile, onToggleMobile }) {
  const { user } = useAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [readAnnouncements, setReadAnnouncements] = useState(false)

  const currentCompany = user?.targetCompany || {
    name: 'Accenture',
    mark: '>',
    color: '#a100ff'
  }
  const currentRole = user?.currentTargetRole || 'Full Stack Developer'

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await api.placement.getAnnouncements()
        if (res.success && res.announcements) {
          setAnnouncements(res.announcements.slice(0, 4))
        }
      } catch (e) {
        // Fallback
      }
    }
    loadAnnouncements()
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="target-switch">
          <span>Preparing for</span>
          <button type="button" onClick={onOpenTarget} title="Click to change target company or role">
            <CompanyMark company={currentCompany} size={20} />
            <strong>{currentCompany.name}</strong>
            <em>·</em>
            <span>{currentRole}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="notification-wrap">
          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={18} />
            {!readAnnouncements && announcements.length > 0 && <b className="notice-badge" />}
          </button>

          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-head">
                <strong>Placement Updates</strong>
                <button type="button" onClick={() => setReadAnnouncements(true)}>
                  {readAnnouncements ? 'All caught up' : 'Mark all read'}
                </button>
              </div>

              <div className="popover-list">
                {readAnnouncements || announcements.length === 0 ? (
                  <p className="empty-copy">You’re all caught up with campus updates.</p>
                ) : (
                  announcements.map((ann, i) => (
                    <article key={ann._id || i} className="notice-item">
                      <i className={`notice-dot ${i % 2 === 1 ? 'blue' : ''}`} />
                      <div>
                        <b>{ann.title}</b>
                        <p>{ann.content}</p>
                        <small>{ann.authorName || 'Placement Cell'}</small>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="popover-footer">
                <Link
                  to="/placement-drives"
                  className="popover-link"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View Placement Drives →
                </Link>
                <button
                  type="button"
                  className="popover-close-text"
                  onClick={() => setNotificationsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="profile-button"
          onClick={onOpenProfile}
          title="Manage Account Profile"
        >
          <span className="profile-initials">
            {user?.name
              ? user.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'U'}
          </span>
          <div className="profile-details">
            <strong>{user?.name || 'My Account'}</strong>
            <small>{user?.branch || user?.role?.replace('_', ' ') || 'Student'}</small>
          </div>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  )
}

export default Topbar
