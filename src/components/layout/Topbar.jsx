import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Menu,
  CheckCheck,
  Milestone,
  FileCheck2,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import CompanyMark from '../common/CompanyMark'
import { formatTimeAgo } from '../../utils/timeAgo'
import api from '../../api/client'

function getCategoryIcon(category, type) {
  if (type === 'application_deadline') {
    return <Clock size={16} color="#d97706" />
  }
  if (category === 'preparation') {
    return <Milestone size={16} color="#315EFB" />
  }
  if (category === 'mock_tests') {
    return <FileCheck2 size={16} color="#7c3aed" />
  }
  if (category === 'placement_drives') {
    return <Building2 size={16} color="#059669" />
  }
  return <Sparkles size={16} color="#315EFB" />
}

export function Topbar({ onOpenTarget, onOpenProfile, onToggleMobile }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const popoverRef = useRef(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const currentCompany = (user?.targetCompany && typeof user.targetCompany === 'object' && user.targetCompany.name)
    ? user.targetCompany
    : (user?.targetCompany && typeof user.targetCompany === 'string'
        ? { name: 'Target Company', mark: 'T', color: '#315EFB' }
        : { name: 'Accenture', mark: '>', color: '#a100ff' }
      )
  const currentRole = user?.currentTargetRole || 'Software Engineer'

  // Load recent notifications for student
  const fetchRecentNotifications = async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await api.notifications.getAll({ limit: 5 })
      if (res.success) {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unreadCount || 0)
      }
    } catch (e) {
      console.error('Failed to load notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  // Initial load & sync listener
  useEffect(() => {
    fetchRecentNotifications()

    const handleSync = () => {
      fetchRecentNotifications()
    }

    window.addEventListener('notifications:updated', handleSync)
    return () => {
      window.removeEventListener('notifications:updated', handleSync)
    }
  }, [user?._id])

  // Click outside listener to dismiss popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.notifications.markRead(notif._id)
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }
    setNotificationsOpen(false)
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      window.dispatchEvent(new CustomEvent('notifications:updated'))
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

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
            <CompanyMark company={currentCompany} size={22} />
            <strong>{currentCompany.name}</strong>
            <em>·</em>
            <span>{currentRole}</span>
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      <div className="topbar-actions">
        {/* =========================================================================
            NOTIFICATION BELL & DROPDOWN
            ========================================================================= */}
        <div className="notification-wrap" ref={popoverRef}>
          <button
            type="button"
            className={`notification-button ${notificationsOpen ? 'is-open' : ''}`}
            aria-label={`Notifications, ${unreadCount} unread`}
            title="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="topbar-unread-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              {/* Dropdown Header */}
              <div className="notification-dropdown-header">
                <div className="dropdown-title-row">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="dropdown-unread-chip">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              {/* Notification List (Latest 4-5 items) */}
              <div className="notification-dropdown-body">
                {loading && notifications.length === 0 ? (
                  <div className="notification-dropdown-loading">
                    <span>Loading updates...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notification-dropdown-empty">
                    <p className="empty-title">You're all caught up!</p>
                    <p className="empty-desc">
                      No notifications right now. Activity on assessments, roadmap milestones, and campus drives will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="notification-items-list">
                    {notifications.slice(0, 5).map(item => {
                      const isUnread = !item.isRead
                      const iconClass = item.type === 'application_deadline' ? 'cat-deadline' : `cat-${item.category}`
                      return (
                        <div
                          key={item._id}
                          className={`notification-dropdown-item ${isUnread ? 'is-unread' : 'is-read'}`}
                          onClick={() => handleNotificationClick(item)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={`notif-icon-box ${iconClass}`}>
                            {getCategoryIcon(item.category, item.type)}
                          </div>

                          <div className="notif-content-col">
                            <div className="notif-item-header">
                              <h4 className="notif-item-title">{item.title}</h4>
                              <div className="notif-meta-row">
                                <span className="notif-time" title={new Date(item.createdAt).toLocaleString()}>
                                  {formatTimeAgo(item.createdAt)}
                                </span>
                                {isUnread && <span className="notif-unread-dot" title="Unread" />}
                              </div>
                            </div>

                            <p className="notif-item-message">{item.message}</p>

                            {item.actionLabel && (
                              <div className="notif-action-wrap">
                                <span className="notif-action-pill">
                                  {item.actionLabel} <ArrowRight size={11} />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="notification-dropdown-footer">
                <Link
                  to="/notifications"
                  className="view-all-notifs-link"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View All Notifications <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account Button */}
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
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  )
}

export default Topbar
