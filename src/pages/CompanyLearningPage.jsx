import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Video as YoutubeIcon,
  Globe,
  BookOpen,
  Clock,
  ArrowRight,
  ChevronRight,
  Check,
  Award,
  Lightbulb,
  FileCheck2,
  Milestone
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
  const [searchParams] = useSearchParams()

  const [curriculumData, setCurriculumData] = useState(null)
  const [completedTopicIds, setCompletedTopicIds] = useState([])
  const [activePillar, setActivePillar] = useState('All')
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [companyDetails, setCompanyDetails] = useState(null)

  // Target company and role automatically derived from student's target in Companies section
  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany || searchParams.get('company') || ''
  const targetRole = user?.currentTargetRole || 'Software Engineer'

  // Load curriculum, user topic completion progress, and company info
  useEffect(() => {
    if (!targetCompanyId) {
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      try {
        const [currRes, progRes, compRes] = await Promise.all([
          api.curriculum.getByCompany(targetCompanyId, [targetRole]).catch(err => ({ success: false, message: err.message })),
          api.curriculum.getUserProgress({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          api.companies.getById(targetCompanyId).catch(() => ({ success: false }))
        ])

        if (currRes.success) {
          setCurriculumData(currRes)
          const topicParam = searchParams.get('topic')
          if (topicParam && currRes.topics) {
            const match = currRes.topics.find(t => t.id === topicParam)
            if (match) setSelectedResourceTopic(match)
          }
        } else if (currRes.message) {
          showToast('Failed to load curriculum: ' + currRes.message, 'danger')
        }

        if (progRes.success && Array.isArray(progRes.completedTopics)) {
          setCompletedTopicIds(progRes.completedTopics)
        }

        if (compRes.success && compRes.company) {
          setCompanyDetails(compRes.company)
        }
      } catch (err) {
        console.error('Failed to load company preparation data:', err)
        showToast('Failed to load preparation data: ' + err.message, 'danger')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [targetCompanyId?.toString(), targetRole])

  const activeCompany = companyDetails || (typeof user?.targetCompany === 'object' ? user?.targetCompany : null) || curriculumData?.company
  const activeCompanyName = activeCompany?.name || 'Target Company'

  const allTopics = curriculumData?.topics || []
  const roleLower = targetRole.toLowerCase()

  // Match topics relevant to the student's target role
  const relevantTopics = allTopics.filter(t => !t.roles || t.roles.length === 0 || t.roles.some(r => r.toLowerCase() === roleLower))

  const filteredTopics = relevantTopics.filter(topic => {
    return activePillar === 'All' || topic.pillar === activePillar
  })

  // Calculate completion stats
  const totalRelevantTopics = relevantTopics.length
  const completedCount = relevantTopics.filter(t => completedTopicIds.includes(t.id)).length
  const progressPercent = totalRelevantTopics > 0
    ? Math.round((completedCount / totalRelevantTopics) * 100)
    : 0

  // Prioritized Next Incomplete Topic
  const nextIncompleteTopic = relevantTopics.find(t => !completedTopicIds.includes(t.id))

  return (
    <div className="company-learning-page">
      <PageHeader
        eyebrow={`TARGET PREPARATION HUB · ${activeCompanyName.toUpperCase()} · ${targetRole.toUpperCase()}`}
        title="Structured Placement Learning Resources"
        description={`Master required syllabus topics for ${activeCompanyName} (${targetRole}). Follow curated documentation guides, video playlists, and track topic completion.`}
      >
        <Link to="/roadmap" className="button secondary">
          <Milestone size={15} /> View Roadmap
        </Link>
        <Link to="/mock-tests" className="button">
          <FileCheck2 size={15} /> Mock Assessments
        </Link>
      </PageHeader>

      {/* If No Target Company is Selected */}
      {!targetCompanyId ? (
        <section className="learning-control-panel" style={{ textAlign: 'center', padding: '48px 24px', margin: '20px 0' }}>
          <Building2 size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            No Target Company Selected
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Please select a target company and job role in the Companies section to view your customized preparation curriculum and topics.
          </p>
          <Link to="/companies" className="button primary" style={{ display: 'inline-flex' }}>
            <Building2 size={14} /> Go to Companies Section <ArrowRight size={13} />
          </Link>
        </section>
      ) : (
        <>
          {/* Curriculum Completion Summary Banner */}
          <section className="company-progress-banner" style={{ marginBottom: '22px' }}>
            <div className="progress-info">
              <div className="progress-stat-pill">
                <div className="award-icon-box">
                  <Award size={20} className="award-icon" />
                </div>
                <div>
                  <p>Curriculum Completion for {activeCompanyName}</p>
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
          </section>

          {/* Pillar Tabs Navigation */}
          <div className="pillar-filter-tabs">
            {PILLARS.map(pillar => {
              const count = pillar === 'All'
                ? relevantTopics.length
                : relevantTopics.filter(t => t.pillar === pillar).length

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
              <h3>No resources available for this target yet.</h3>
              <p>No preparation resources match the selected target company and role ({targetRole}).</p>
            </div>
          ) : (
            <div className="topics-checklist-grid">
              {filteredTopics.map(topic => {
                const isCompleted = completedTopicIds.includes(topic.id)
                const isNextUp = nextIncompleteTopic?.id === topic.id

                return (
                  <article
                    key={topic.id}
                    className={`topic-learning-card ${isCompleted ? 'completed' : ''} ${isNextUp && !isCompleted ? 'next-up' : ''}`}
                  >
                    <div className="topic-card-header">
                      <div
                        className={`topic-icon-slot ${isCompleted ? 'checked' : ''}`}
                        title={isCompleted ? 'Completed on Roadmap' : 'Topic Guide'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={20} className="check-icon-active" />
                        ) : (
                          <BookOpen size={18} className="topic-neutral-icon" />
                        )}
                      </div>

                      <div className="topic-title-area">
                        <div className="topic-meta-row">
                          <div className="topic-meta-badges">
                            <span className={`pillar-tag ${topic.pillar.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                              {topic.pillar}
                            </span>
                            <span className={`importance-tag ${topic.importance.toLowerCase()}`}>
                              {topic.importance}
                            </span>
                            <span className="estimated-time">
                              <Clock size={11} /> {topic.estimatedHours}
                            </span>
                          </div>

                          {isCompleted && (
                            <span className="topic-completed-badge">
                              <Check size={11} strokeWidth={2.8} /> Completed
                            </span>
                          )}
                          {isNextUp && !isCompleted && (
                            <span className="topic-next-badge">
                              ★ Next Up
                            </span>
                          )}
                        </div>

                        <h3 className="topic-title">
                          {topic.title}
                        </h3>
                      </div>
                    </div>

                    <p className="topic-description">{topic.description}</p>

                    {/* Applicable Roles */}
                    <div className="topic-roles-preview">
                      <small>Relevant for:</small>
                      {topic.roles.map(r => {
                        const isActive = r.toLowerCase() === roleLower
                        return (
                          <span
                            key={r}
                            className={`role-tag-mini ${isActive ? 'active-role' : ''}`}
                          >
                            {isActive && <span className="active-dot">• </span>}
                            {r}
                          </span>
                        )
                      })}
                    </div>

                    {/* Quick Resource Bar & Actions */}
                    <div className="topic-card-footer">
                      <div className="resource-indicators">
                        <span title={`${topic.popularWebsites?.length || 0} Web Guides`}>
                          <Globe size={13} className="globe-icon" />
                          <span>{topic.popularWebsites?.length || 0} Web Guides</span>
                        </span>
                        <span title={`${topic.youtubeVideos?.length || 0} Video Lessons`}>
                          <YoutubeIcon size={13} className="yt-icon" />
                          <span>{topic.youtubeVideos?.length || 0} Videos</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="button secondary view-resources-btn"
                        onClick={() => setSelectedResourceTopic(topic)}
                      >
                        <BookOpen size={13} />
                        <span>Resources</span>
                        <ChevronRight size={13} className="btn-arrow" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Learning Resources & Notes Modal */}
      {selectedResourceTopic && (
        <Modal
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          title={`Study Topic: ${selectedResourceTopic.title}`}
          maxWidth="560px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
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
              margin: '2px 0'
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
              <strong>Note:</strong> Preparation Hub is for studying and reference. To update topic completion and unlock sequential stages, mark your progress on your <Link to="/roadmap" style={{ color: '#2563eb', fontWeight: 600 }}>Full Roadmap</Link>.
            </p>

            {/* Modal Action Footer: Display-only Status & Close */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '14px',
              marginTop: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {completedTopicIds.includes(selectedResourceTopic.id) ? (
                  <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    <CheckCircle2 size={16} /> Completed on Roadmap
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    Status: Incomplete · <Link to="/roadmap" style={{ color: '#2563eb', fontWeight: 600 }}>Mark on Roadmap</Link>
                  </span>
                )}
              </div>

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
