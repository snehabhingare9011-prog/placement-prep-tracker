import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
  Check,
  Award,
  Lightbulb,
  FileCheck2,
  Milestone
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

  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [curriculumData, setCurriculumData] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [completedTopicIds, setCompletedTopicIds] = useState([])
  const [activePillar, setActivePillar] = useState('All')
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingTopicId, setUpdatingTopicId] = useState(null)

  const activeUserTargetId = user?.targetCompany?._id || user?.targetCompany
  const activeUserRole = user?.currentTargetRole || 'Software Engineer'

  // 1. Fetch available companies on mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies && res.companies.length > 0) {
          setCompanies(res.companies)
          const urlCompanyId = searchParams.get('company')
          const initialId = urlCompanyId || activeUserTargetId || res.companies[0]._id
          setSelectedCompanyId(initialId)
        }
      } catch (err) {
        console.error('Failed to load companies:', err)
      }
    }
    loadCompanies()
  }, [])

  // Sync selected company & role when user target changes
  useEffect(() => {
    const urlCompanyId = searchParams.get('company')
    if (!urlCompanyId && activeUserTargetId && activeUserTargetId !== selectedCompanyId) {
      setSelectedCompanyId(activeUserTargetId)
      if (user?.currentTargetRole) {
        setSelectedRoles([user.currentTargetRole])
      }
    }
  }, [activeUserTargetId, user?.currentTargetRole])

  // 2. Load user completed topics progress scoped to active company
  useEffect(() => {
    if (!selectedCompanyId) return

    async function loadUserProgress() {
      try {
        const role = selectedRoles[0] || activeUserRole
        const res = await api.curriculum.getUserProgress({ companyId: selectedCompanyId, role })
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
  }, [selectedCompanyId, selectedRoles[0], activeUserRole])

  // 3. Load curriculum whenever selected company or roles change
  useEffect(() => {
    if (!selectedCompanyId) return

    async function loadCurriculum() {
      setLoading(true)
      try {
        const res = await api.curriculum.getByCompany(selectedCompanyId, selectedRoles)
        if (res.success) {
          setCurriculumData(res)
          if (selectedRoles.length === 0) {
            const defaultRole = activeUserRole && res.company?.roles?.includes(activeUserRole)
              ? [activeUserRole]
              : (res.company?.roles?.slice(0, 1) || ['Software Engineer'])
            setSelectedRoles(defaultRole)
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
    api.curriculum.updateRoles(updated).catch(() => {})
  }

  // Toggle topic completion scoped to company
  const handleToggleTopic = async (topicId) => {
    setUpdatingTopicId(topicId)
    try {
      const role = selectedRoles[0] || activeUserRole
      const res = await api.curriculum.toggleTopic(topicId, selectedCompanyId, role)
      if (res.success) {
        setCompletedTopicIds(res.completedTopics || [])
        showToast(
          res.isCompleted ? 'Topic marked as completed! 🎉' : 'Topic marked as incomplete',
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

  // Prioritized Next Incomplete Topic
  const nextIncompleteTopic = allTopics.find(
    t => t.roles.some(r => selectedRoles.includes(r)) && !completedTopicIds.includes(t.id)
  )

  return (
    <div className="company-learning-page">
      <PageHeader
        eyebrow="TARGET COMPANY PREPARATION HUB"
        title="Structured Placement Learning Resources"
        description="Master required syllabus topics organized by target company and job role. Follow curated documentation guides, video playlists, and track topic completion."
      >
        <Link to="/roadmap" className="button secondary">
          <Milestone size={15} /> View Roadmap
        </Link>
        <Link to="/mock-tests" className="button">
          <FileCheck2 size={15} /> Mock Assessments
        </Link>
      </PageHeader>

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
                <p>Curriculum Completion for {activeCompany?.name || 'Selected Company'}</p>
                <h3>
                  {progressPercent}% Complete
                  <small>({completedCount} of {totalRelevantTopics} topics mastered)</small>
                </h3>
              </div>
            </div>
            <div className="progress-meta-text">
              <span>{totalRelevantTopics - completedCount} topics remaining to complete target syllabus</span>
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

      {/* Next Incomplete Topic Callout */}
      {nextIncompleteTopic && (
        <section style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderLeft: '4px solid #2563eb',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 320px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
              <Lightbulb size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.6px' }}>
                NEXT INCOMPLETE TOPIC TO STUDY
              </span>
              <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                {nextIncompleteTopic.title}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                {nextIncompleteTopic.importance} Importance · {nextIncompleteTopic.pillar} · Est. effort: {nextIncompleteTopic.estimatedHours}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button"
              style={{ fontSize: '12px' }}
              onClick={() => setSelectedResourceTopic(nextIncompleteTopic)}
            >
              <BookOpen size={14} /> Open Topic Resources <ArrowRight size={13} />
            </button>
          </div>
        </section>
      )}

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
            const isNextUp = nextIncompleteTopic?.id === topic.id

            return (
              <article
                key={topic.id}
                className={`topic-learning-card ${isCompleted ? 'completed' : ''}`}
                style={isNextUp && !isCompleted ? { borderColor: '#93c5fd', boxShadow: '0 0 0 1px #bfdbfe' } : {}}
              >
                <div className="topic-card-header">
                  <button
                    type="button"
                    className={`topic-checkbox-btn ${isCompleted ? 'checked' : ''}`}
                    onClick={() => handleToggleTopic(topic.id)}
                    disabled={isToggling}
                    title={isCompleted ? 'Click to uncheck (mark as incomplete)' : 'Click to mark as completed'}
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
                      {isNextUp && !isCompleted && (
                        <span style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700
                        }}>
                          ★ Next Up
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{
                          background: '#f0fdf4',
                          color: '#16a34a',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700
                        }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h3 className={isCompleted ? 'line-through-title' : ''}>
                      {topic.title}
                    </h3>
                  </div>
                </div>

                <p className="topic-description">{topic.description}</p>

                {/* Applicable Roles */}
                <div className="topic-roles-preview">
                  <small>Relevant for:</small>
                  {topic.roles.map(r => (
                    <span
                      key={r}
                      className={`role-tag-mini ${selectedRoles.includes(r) ? 'active-role' : ''}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>

                {/* Quick Resource Bar & Actions */}
                <div className="topic-card-footer">
                  <div className="resource-indicators">
                    <span title={`${topic.popularWebsites?.length || 0} Website Tutorials`}>
                      <Globe size={14} /> {topic.popularWebsites?.length || 0} Web Guides
                    </span>
                    <span title={`${topic.youtubeVideos?.length || 0} Curated YouTube Playlists`}>
                      <YoutubeIcon size={14} className="yt-icon" /> {topic.youtubeVideos?.length || 0} Videos
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleToggleTopic(topic.id)}
                      disabled={isToggling}
                      style={{ fontSize: '11px', padding: '5px 9px' }}
                    >
                      {isCompleted ? 'Uncheck' : 'Mark Completed'}
                    </button>

                    <button
                      type="button"
                      className="button secondary view-resources-btn"
                      onClick={() => setSelectedResourceTopic(topic)}
                    >
                      <BookOpen size={13} />
                      <span>Resources</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Learning Resources & Notes Modal */}
      {selectedResourceTopic && (
        <Modal
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          title={`Study Topic: ${selectedResourceTopic.title}`}
          maxWidth="720px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span className={`pillar-tag ${selectedResourceTopic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {selectedResourceTopic.pillar}
                </span>
                <span className={`importance-tag ${selectedResourceTopic.importance.toLowerCase()}`}>
                  {selectedResourceTopic.importance} Importance
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  {selectedResourceTopic.estimatedHours}
                </span>
                {completedTopicIds.includes(selectedResourceTopic.id) ? (
                  <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 700, marginLeft: 'auto' }}>
                    ✓ Completed on Server
                  </span>
                ) : (
                  <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600, marginLeft: 'auto' }}>
                    ○ Incomplete
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {selectedResourceTopic.description}
              </p>
            </div>

            {/* Key Concepts to Understand */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              margin: '14px 0'
            }}>
              <strong style={{ fontSize: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} color="#2563eb" /> Key Concepts to Master:
              </strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569', display: 'grid', gap: '4px' }}>
                <li>Core theory, syntax, and foundational definitions required for recruitment rounds.</li>
                <li>Frequently tested interview edge cases, time/space trade-offs, and design patterns.</li>
                <li>Best practices and architectural principles expected for {activeCompany?.name || 'campus recruitment'}.</li>
              </ul>
            </div>

            {/* Verified Documentation & Written Guides */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <Globe size={16} />
                <span>Verified Documentation & Written Tutorials</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.popularWebsites && selectedResourceTopic.popularWebsites.length > 0 ? (
                  selectedResourceTopic.popularWebsites.map((web, idx) => (
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
                        <span>Source: <b>{web.provider}</b></span>
                      </div>
                      <div className="resource-open-action">
                        <span>Open Guide</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No external documentation mapped for this topic.</p>
                )}
              </div>
            </div>

            {/* Curated YouTube Video Playlists */}
            <div className="resource-section">
              <h4 className="resource-section-heading">
                <YoutubeIcon size={16} className="yt-icon" />
                <span>Curated Video Playlists & Masterclasses</span>
              </h4>
              <div className="resource-items-list">
                {selectedResourceTopic.youtubeVideos && selectedResourceTopic.youtubeVideos.length > 0 ? (
                  selectedResourceTopic.youtubeVideos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-item-link"
                    >
                      <div className="resource-item-icon yt-icon">
                        <YoutubeIcon size={16} />
                      </div>
                      <div className="resource-item-details">
                        <strong>{vid.title}</strong>
                        <span>Channel: <b>{vid.channel}</b> · Duration: {vid.duration}</span>
                      </div>
                      <div className="resource-open-action">
                        <span>Watch Video</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No video playlists mapped for this topic.</p>
                )}
              </div>
            </div>

            {/* Explicit Notice */}
            <p style={{
              margin: '14px 0 0',
              fontSize: '11px',
              color: '#64748b',
              background: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <strong>Note:</strong> Opening this topic or external resources does not automatically mark it as completed. Use the button below to update your completion status when you are ready.
            </p>

            {/* Modal Action Footer: Explicit Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '14px',
              marginTop: '14px'
            }}>
              <button
                type="button"
                className={`button ${completedTopicIds.includes(selectedResourceTopic.id) ? 'secondary' : 'primary'}`}
                onClick={() => handleToggleTopic(selectedResourceTopic.id)}
              >
                {completedTopicIds.includes(selectedResourceTopic.id) ? (
                  <>
                    <CheckCircle2 size={15} color="#16a34a" /> Marked Completed (Click to Uncheck)
                  </>
                ) : (
                  <>
                    <Check size={15} /> Mark Topic as Completed
                  </>
                )}
              </button>

              <button
                type="button"
                className="button secondary"
                onClick={() => setSelectedResourceTopic(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CompanyLearningPage
