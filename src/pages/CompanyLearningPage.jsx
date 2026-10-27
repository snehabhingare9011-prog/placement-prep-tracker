import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Video as YoutubeIcon,
  Globe,
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  Check,
  Award
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

const PILLARS = [
  'All',
  'Aptitude',
  'DSA',
  'Core CS',
  'Web & Technical',
  'HR & Behavioral'
]

export function CompanyLearningPage() {
  const { user, showToast } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [curriculumData, setCurriculumData] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [completedTopicIds, setCompletedTopicIds] = useState([])
  const [activePillar, setActivePillar] = useState('All')
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingTopicId, setUpdatingTopicId] = useState(null)

  // 1. Fetch available companies on mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies && res.companies.length > 0) {
          setCompanies(res.companies)
          // Default to company from URL, or user target, or first company
          const urlCompanyId = searchParams.get('company')
          const userTargetId = user?.targetCompany?._id || user?.targetCompany
          const initialId = urlCompanyId || userTargetId || res.companies[0]._id
          setSelectedCompanyId(initialId)
        }
      } catch (err) {
        console.error('Failed to load companies:', err)
      }
    }
    loadCompanies()
  }, [])

  // 2. Load user completed topics progress
  useEffect(() => {
    async function loadUserProgress() {
      try {
        const res = await api.curriculum.getUserProgress()
        if (res.success) {
          setCompletedTopicIds(res.completedTopics || [])
          if (res.selectedRoles && res.selectedRoles.length > 0 && selectedRoles.length === 0) {
            setSelectedRoles(res.selectedRoles)
          }
        }
      } catch (err) {
        console.error('Failed to load user progress:', err)
      }
    }
    loadUserProgress()
  }, [])

  // 3. Load curriculum whenever selected company or roles change
  useEffect(() => {
    if (!selectedCompanyId) return

    async function loadCurriculum() {
      setLoading(true)
      try {
        const res = await api.curriculum.getByCompany(selectedCompanyId, selectedRoles)
        if (res.success) {
          setCurriculumData(res)
          // If no roles were initially selected, initialize with all company roles
          if (selectedRoles.length === 0 && res.company?.roles) {
            setSelectedRoles(res.company.roles)
          }
        }
      } catch (err) {
        console.error('Failed to load company curriculum:', err)
        showToast('Failed to load curriculum: ' + err.message, 'danger')
      } finally {
        setLoading(false)
      }
    }
    loadCurriculum()
  }, [selectedCompanyId, selectedRoles.length])

  // Handle company change
  const handleCompanyChange = (e) => {
    const compId = e.target.value
    setSelectedCompanyId(compId)
    setSearchParams({ company: compId })
    // Reset selected roles to trigger fresh defaults
    setSelectedRoles([])
  }

  // Toggle role selection
  const handleToggleRole = (role) => {
    let updated = []
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        showToast('At least one job role must remain selected.', 'warning')
        return
      }
      updated = selectedRoles.filter(r => r !== role)
    } else {
      updated = [...selectedRoles, role]
    }
    setSelectedRoles(updated)
    // Persist to backend
    api.curriculum.updateRoles(updated).catch(() => {})
  }

  // Toggle topic completion
  const handleToggleTopic = async (topicId) => {
    setUpdatingTopicId(topicId)
    try {
      const res = await api.curriculum.toggleTopic(topicId)
      if (res.success) {
        setCompletedTopicIds(res.completedTopics || [])
        showToast(
          res.isCompleted ? 'Topic marked as completed! 🎉' : 'Topic marked for review',
          'success'
        )
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setUpdatingTopicId(null)
    }
  }

  // Filter topics based on active pillar and selected roles
  const allTopics = curriculumData?.topics || []
  const filteredTopics = allTopics.filter(topic => {
    const matchesPillar = activePillar === 'All' || topic.pillar === activePillar
    const matchesRole = topic.roles.some(r => selectedRoles.includes(r))
    return matchesPillar && matchesRole
  })

  // Calculate stats
  const totalRelevantTopics = allTopics.filter(t => t.roles.some(r => selectedRoles.includes(r))).length
  const completedCount = allTopics.filter(
    t => t.roles.some(r => selectedRoles.includes(r)) && completedTopicIds.includes(t.id)
  ).length
  const progressPercent = totalRelevantTopics > 0
    ? Math.round((completedCount / totalRelevantTopics) * 100)
    : 0

  const activeCompany = companies.find(c => c._id === selectedCompanyId) || curriculumData?.company

  return (
    <div className="company-learning-page">
      <PageHeader
        eyebrow="TARGET COMPANY PREPARATION HUB"
        title="What to Prepare & Free Resources"
        description="Select your target company and job roles to see exact syllabus requirements, verified website tutorials (W3Schools, GFG), and top YouTube playlists."
      />

      {/* Company & Multi-Role Selector Control Panel */}
      <section className="learning-control-panel">
        <div className="company-selector-bar">
          <div className="selector-field">
            <label htmlFor="company-dropdown">
              <Building2 size={16} />
              <span>Target Company:</span>
            </label>
            <select
              id="company-dropdown"
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              className="company-select-dropdown"
            >
              {companies.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.difficulty} Tier)
                </option>
              ))}
            </select>
          </div>

          {activeCompany && (
            <div className="selected-company-meta">
              <CompanyMark company={activeCompany} size={28} />
              <div>
                <strong>{activeCompany.name}</strong>
                <span>{activeCompany.industry || 'Technology'} · {activeCompany.difficulty} Difficulty</span>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Role Pills Selector */}
        {activeCompany?.roles && (
          <div className="multi-role-container">
            <span className="role-selector-label">
              <Layers size={14} />
              Select Job Roles (Multiple allowed):
            </span>
            <div className="role-checkbox-group">
              {activeCompany.roles.map(role => {
                const isSelected = selectedRoles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    className={`role-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleToggleRole(role)}
                  >
                    <span className="role-checkbox">
                      {isSelected ? <Check size={12} /> : null}
                    </span>
                    <span>{role}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Real-time Preparedness Progress Banner */}
        <div className="company-progress-banner">
          <div className="progress-info">
            <div className="progress-stat-pill">
              <Award size={18} className="award-icon" />
              <div>
                <p>Preparation Progress for {activeCompany?.name || 'Selected Company'}</p>
                <h3>
                  {progressPercent}% Complete
                  <small>({completedCount} of {totalRelevantTopics} topics mastered)</small>
                </h3>
              </div>
            </div>
            <div className="progress-meta-text">
              <span>{totalRelevantTopics - completedCount} topics remaining to reach 100% readiness</span>
            </div>
          </div>

          <div className="learning-progress-bar-track">
            <div
              className="learning-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Pillar Tabs Navigation */}
      <div className="pillar-filter-tabs">
        {PILLARS.map(pillar => {
          const count = pillar === 'All'
            ? allTopics.filter(t => t.roles.some(r => selectedRoles.includes(r))).length
            : allTopics.filter(t => t.pillar === pillar && t.roles.some(r => selectedRoles.includes(r))).length

          return (
            <button
              key={pillar}
              type="button"
              className={`pillar-tab ${activePillar === pillar ? 'active' : ''}`}
              onClick={() => setActivePillar(pillar)}
            >
              <span>{pillar}</span>
              <span className="pillar-badge">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Topics Checklist Grid */}
      {loading ? (
        <SkeletonLoader rows={6} height={120} />
      ) : filteredTopics.length === 0 ? (
        <div className="empty-topics-state">
          <BookOpen size={42} />
          <h3>No topics found for this filter</h3>
          <p>Try selecting additional job roles above or choosing 'All' topics.</p>
        </div>
      ) : (
        <div className="topics-checklist-grid">
          {filteredTopics.map(topic => {
            const isCompleted = completedTopicIds.includes(topic.id)
            const isToggling = updatingTopicId === topic.id

            return (
              <article
                key={topic.id}
                className={`topic-learning-card ${isCompleted ? 'completed' : ''}`}
              >
                <div className="topic-card-header">
                  <button
                    type="button"
                    className={`topic-checkbox-btn ${isCompleted ? 'checked' : ''}`}
                    onClick={() => handleToggleTopic(topic.id)}
                    disabled={isToggling}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="check-icon-active" />
                    ) : (
                      <Circle size={22} className="check-icon-empty" />
                    )}
                  </button>

                  <div className="topic-title-area">
                    <div className="topic-tag-row">
                      <span className={`pillar-tag ${topic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                        {topic.pillar}
                      </span>
                      <span className={`importance-tag ${topic.importance.toLowerCase()}`}>
                        {topic.importance} Importance
                      </span>
                      <span className="estimated-time">
                        <Clock size={12} /> {topic.estimatedHours}
                      </span>
                    </div>
                    <h3 className={isCompleted ? 'line-through-title' : ''}>
                      {topic.title}
                    </h3>
                  </div>
                </div>

                <p className="topic-description">{topic.description}</p>

                {/* Applicable Roles */}
                <div className="topic-roles-preview">
                  <small>Required for:</small>
                  {topic.roles.map(r => (
                    <span
                      key={r}
                      className={`role-tag-mini ${selectedRoles.includes(r) ? 'active-role' : ''}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>

                {/* Quick Resource Bar & Study Action */}
                <div className="topic-card-footer">
                  <div className="resource-indicators">
                    <span title={`${topic.popularWebsites.length} Website Tutorials`}>
                      <Globe size={14} /> {topic.popularWebsites.length} Web Tutorials
                    </span>
                    <span title={`${topic.youtubeVideos.length} Curated YouTube Playlists`}>
                      <YoutubeIcon size={14} className="yt-icon" /> {topic.youtubeVideos.length} YouTube Videos
                    </span>
                  </div>

                  <button
                    type="button"
                    className="button secondary view-resources-btn"
                    onClick={() => setSelectedResourceTopic(topic)}
                  >
                    <BookOpen size={14} />
                    <span>Study Resources</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Free Learning Resources Modal */}
      {selectedResourceTopic && (
        <Modal
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          title={`Learning Resources: ${selectedResourceTopic.title}`}
          maxWidth="700px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <span className={`pillar-tag ${selectedResourceTopic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                {selectedResourceTopic.pillar}
              </span>
              <p>{selectedResourceTopic.description}</p>
            </div>

            {/* Popular Website Links (W3Schools, GFG, MDN, IndiaBIX) */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <Globe size={16} />
                <span>Popular Website Tutorials & Documentation</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.popularWebsites.map((web, idx) => (
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
                      <span>Provider: <b>{web.provider}</b></span>
                    </div>
                    <div className="resource-open-action">
                      <span>Visit Site</span>
                      <ExternalLink size={14} />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Curated YouTube Video Links / Playlists */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <YoutubeIcon size={16} className="yt-icon" />
                <span>Curated YouTube Video Lectures & Playlists</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.youtubeVideos.map((yt, idx) => (
                  <a
                    key={idx}
                    href={yt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-item-link yt-link"
                  >
                    <div className="resource-item-icon yt-icon-box">
                      <YoutubeIcon size={16} />
                    </div>
                    <div className="resource-item-details">
                      <strong>{yt.title}</strong>
                      <span>Instructor / Channel: <b>{yt.channel}</b> · Duration: {yt.duration}</span>
                    </div>
                    <div className="resource-open-action yt-action">
                      <span>Watch</span>
                      <ExternalLink size={14} />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Mark as complete toggle inside modal */}
            <div className="modal-completion-footer">
              <button
                type="button"
                className={`button ${completedTopicIds.includes(selectedResourceTopic.id) ? 'secondary' : 'primary'}`}
                onClick={() => handleToggleTopic(selectedResourceTopic.id)}
              >
                {completedTopicIds.includes(selectedResourceTopic.id) ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Completed (Click to unmark)</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Mark This Topic Complete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CompanyLearningPage
