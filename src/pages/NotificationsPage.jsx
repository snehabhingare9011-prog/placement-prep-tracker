import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Milestone,
  FileCheck2,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SkeletonLoader from '../components/common/SkeletonLoader'
import { formatTimeAgo } from '../utils/timeAgo'
import api from '../api/client'

const CATEGORY_TABS = [
  { key: 'all', label: 'All Updates' },
  { key: 'preparation', label: 'Preparation & Roadmap' },
  { key: 'mock_tests', label: 'Mock Assessments' },
  { key: 'placement_drives', label: 'Placement Drives' }
]

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

export function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [categoryUnread, setCategoryUnread] = useState({
    all: 0,
    preparation: 0,
    mock_tests: 0,
    placement_drives: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadNotifications = async (cat = activeCategory) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.notifications.getAll({
        category: cat !== 'all' ? cat : undefined,
        limit: 50
      })
      if (res.success) {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unreadCount || 0)
        if (res.categoryUnread) {
          setCategoryUnread(res.categoryUnread)
        }
      } else {
        setError(res.message || 'Unable to load notifications')
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError(err.message || 'Unable to connect to the notification service')
    } finally {
      setLoading(false)
    }
  }

  // Load when active tab changes
  useEffect(() => {
    loadNotifications(activeCategory)
  }, [activeCategory])

  // Cross-component sync
  useEffect(() => {
    const handleSync = () => {
      loadNotifications(activeCategory)
    }
    window.addEventListener('notifications:updated', handleSync)
    return () => {
      window.removeEventListener('notifications:updated', handleSync)
    }
  }, [activeCategory])

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.notifications.markRead(notif._id)
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        setCategoryUnread(prev => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
          [notif.category]: Math.max(0, (prev[notif.category] || 1) - 1)
        }))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead(activeCategory !== 'all' ? activeCategory : undefined)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      if (activeCategory === 'all') {
        setUnreadCount(0)
        setCategoryUnread({ all: 0, preparation: 0, mock_tests: 0, placement_drives: 0 })
      } else {
        const cleared = categoryUnread[activeCategory] || 0
        setUnreadCount(prev => Math.max(0, prev - cleared))
        setCategoryUnread(prev => ({ ...prev, [activeCategory]: 0, all: Math.max(0, prev.all - cleared) }))
      }
      window.dispatchEvent(new CustomEvent('notifications:updated'))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notifications-header-box">
        <div className="notifications-header-info">
          <div className="notifications-title-row">
            <h1 className="notifications-page-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="notifications-unread-chip">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="notifications-page-subtitle">
            Stay updated on your preparation and placement journey.
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="notifications-header-actions">
            <button
              type="button"
              className="mark-all-read-action-btn"
              onClick={handleMarkAllRead}
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="notifs-page-filters-strip">
        {CATEGORY_TABS.map(tab => {
          const unreadForCategory = categoryUnread[tab.key] || 0
          const isActive = activeCategory === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`notifs-filter-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(tab.key)}
            >
              <span>{tab.label}</span>
              {unreadForCategory > 0 && (
                <span className="notifs-tab-badge">
                  {unreadForCategory}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Notifications List Container */}
      <div className="notifs-page-container">
        {loading ? (
          <div className="notifs-loading-wrapper">
            <SkeletonLoader rows={4} height={56} />
          </div>
        ) : error ? (
          <div className="notifs-error-state">
            <div className="notifs-error-icon">
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <h3>Unable to load notifications</h3>
            <p>{error}</p>
            <button
              type="button"
              className="notifs-retry-btn"
              onClick={() => loadNotifications(activeCategory)}
            >
              <RotateCcw size={14} /> Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifs-empty-card">
            <div className="empty-bell-circle">
              <Bell size={26} color="#94a3b8" />
            </div>
            <h3 className="empty-title">You're all caught up!</h3>
            <p className="empty-desc">
              {activeCategory === 'all'
                ? 'No notifications right now. Activity on assessments, roadmap milestones, and campus drives will appear here.'
                : `No notifications available under ${CATEGORY_TABS.find(t => t.key === activeCategory)?.label || 'this category'}.`}
            </p>
          </div>
        ) : (
          <div className="notifs-compact-list">
            {notifications.map(item => {
              const isUnread = !item.isRead
              const iconClass = item.type === 'application_deadline' ? 'cat-deadline' : `cat-${item.category}`
              return (
                <div
                  key={item._id}
                  className={`notif-compact-row ${isUnread ? 'is-unread' : 'is-read'}`}
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`notif-compact-icon ${iconClass}`}>
                    {getCategoryIcon(item.category, item.type)}
                  </div>

                  <div className="notif-compact-content">
                    <div className="notif-compact-head">
                      <div className="notif-compact-title-wrap">
                        <h4 className="notif-compact-title">{item.title}</h4>
                        {isUnread && <span className="notif-unread-dot" title="Unread" />}
                      </div>

                      <span className="notif-compact-time" title={new Date(item.createdAt).toLocaleString()}>
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="notif-compact-message">{item.message}</p>

                    {item.actionLabel && (
                      <div className="notif-compact-action-row">
                        <span className="notif-compact-action-btn">
                          {item.actionLabel} <ArrowRight size={12} />
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
    </div>
  )
}

export default NotificationsPage
