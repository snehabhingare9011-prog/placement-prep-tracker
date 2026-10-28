import { useState, useEffect } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Milestone,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Check,
  Target,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Globe,
  Video as YoutubeIcon,
  ExternalLink,
  Building2,
  AlertCircle,
  Play,
  Layers,
  Lock,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'
import { mapQuestionToHubTopicId } from '../utils/topicMapping'

export function RoadmapPage() {
  const { user, showToast } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const outletContext = useOutletContext()
  const onOpenTarget = outletContext?.onOpenTarget

  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsedRounds, setCollapsedRounds] = useState({})
  const [curriculumTopics, setCurriculumTopics] = useState([])
  const [selectedResourceTopic, setSelectedResourceTopic] = useState(null)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  const targetCompanyId = user?.targetCompany?._id || user?.targetCompany
  const targetRole = user?.currentTargetRole || 'Software Engineer'

  // Helper functions for stage completion & sequential unlocking
  const isPhaseCompleted = (phase) => {
    const tasks = phase?.tasks || []
    return tasks.length > 0 && tasks.every(t => t.completed)
  }

  const isPhaseUnlocked = (phaseIndex, phases) => {
    if (phaseIndex === 0) return true
    for (let k = 0; k < phaseIndex; k++) {
      if (!isPhaseCompleted(phases[k])) {
        return false
      }
    }
    return true
  }

  useEffect(() => {
    async function loadRoadmapAndTopics() {
      setLoading(true)
      try {
        const [roadmapRes, topicsRes] = await Promise.all([
          api.roadmaps.get({ companyId: targetCompanyId, role: targetRole }).catch(() => ({ success: false })),
          api.curriculum.getAllTopics().catch(() => ({ success: false }))
        ])

        if (roadmapRes.success && roadmapRes.roadmap) {
          const loadedRoadmap = roadmapRes.roadmap
          setRoadmap(loadedRoadmap)

          // Automatically expand active stage, keep completed or locked stages collapsed
          const phases = loadedRoadmap.phases || []
          const initialCollapsed = {}
          let foundActive = false

          phases.forEach((p, idx) => {
            const isUnlocked = isPhaseUnlocked(idx, phases)
            const isDone = isPhaseCompleted(p)

            if (isUnlocked && !isDone && !foundActive) {
              initialCollapsed[idx] = false // Active stage is open
              foundActive = true
            } else if (isDone) {
              initialCollapsed[idx] = true // Completed stages collapsed
            } else {
              initialCollapsed[idx] = true // Locked stages collapsed by default
            }
          })
          setCollapsedRounds(initialCollapsed)
        } else {
          setRoadmap(null)
        }

        if (topicsRes.success && topicsRes.topics) {
          setCurriculumTopics(topicsRes.topics)
        }
      } catch (err) {
        console.error('Failed to load roadmap:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRoadmapAndTopics()
  }, [targetCompanyId, targetRole])

  // Handle deep-link scrolling to specific recruitment round from notification actionUrl
  useEffect(() => {
    const roundParam = searchParams.get('round')
    if (roundParam && roadmap?.phases) {
      const rNum = parseInt(roundParam, 10)
      const targetIdx = roadmap.phases.findIndex((p, idx) => (p.roundNumber || idx + 1) === rNum)
      if (targetIdx !== -1) {
        setCollapsedRounds(prev => ({ ...prev, [targetIdx]: false }))
        const timer = setTimeout(() => {
          const el = document.getElementById(`stage-${rNum}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 350)
        return () => clearTimeout(timer)
      }
    }
  }, [searchParams, roadmap])

  const toggleRoundCollapse = (roundIndex) => {
    setCollapsedRounds(prev => ({
      ...prev,
      [roundIndex]: !prev[roundIndex]
    }))
  }

  const handleToggleExpandAll = () => {
    if (!roadmap?.phases) return
    const allCurrentlyCollapsed = roadmap.phases.every((_, idx) => collapsedRounds[idx])
    const newCollapsed = {}
    roadmap.phases.forEach((_, idx) => {
      newCollapsed[idx] = !allCurrentlyCollapsed
    })
    setCollapsedRounds(newCollapsed)
  }

  // Toggle topic completion (optimistic instant update + database persistence)
  const handleToggleTask = async (taskId, isStageLocked, stageIndex) => {
    if (!roadmap || updatingTaskId) return

    // Guard: Do not allow completing topics in locked stages
    if (isStageLocked) {
      showToast(
        `Stage ${stageIndex + 1} is locked. Complete all required topics in the active stage first to unlock!`,
        'attention'
      )
      return
    }

    setUpdatingTaskId(taskId)
    const prevRoadmap = roadmap

    // Optimistically update topic completion in local state immediately
    const updatedPhases = roadmap.phases.map(phase => {
      const updatedTasks = phase.tasks.map(t => {
        if (t.taskId === taskId) {
          const willBeCompleted = !t.completed
          return {
            ...t,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? new Date() : null
          }
        }
        return t
      })
      const total = updatedTasks.length
      const completed = updatedTasks.filter(t => t.completed).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      const status = completed === 0 ? 'Not Started' : (completed === total ? 'Completed' : 'In Progress')
      return {
        ...phase,
        tasks: updatedTasks,
        totalTopics: total,
        completedTopics: completed,
        percentage,
        status
      }
    })

    const allTasks = updatedPhases.flatMap(p => p.tasks)
    const uniqueIds = [...new Set(allTasks.map(t => t.taskId))]
    const uniqueDone = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]
    const progressPercentage = uniqueIds.length > 0 ? Math.round((uniqueDone.length / uniqueIds.length) * 100) : 0

    const nextRoadmap = {
      ...roadmap,
      phases: updatedPhases,
      uniqueTotalTopics: uniqueIds.length,
      uniqueCompletedTopics: uniqueDone.length,
      progressPercentage
    }

    // Check if toggling this topic completed the current stage or unlocked a new stage
    const currentPhaseOld = roadmap.phases[stageIndex]
    const currentPhaseNew = updatedPhases[stageIndex]
    const wasStageComplete = currentPhaseOld && isPhaseCompleted(currentPhaseOld)
    const isStageNowComplete = currentPhaseNew && isPhaseCompleted(currentPhaseNew)

    // Immediate UI update
    setRoadmap(nextRoadmap)

    // Feedback toast & auto-expansion of newly unlocked stage
    if (!wasStageComplete && isStageNowComplete) {
      const nextStageIndex = stageIndex + 1
      if (nextStageIndex < updatedPhases.length) {
        showToast(`Stage ${stageIndex + 1} Completed! Stage ${nextStageIndex + 1} is now Unlocked 🚀`, 'success')
        setCollapsedRounds(prev => ({
          ...prev,
          [stageIndex]: true,
          [nextStageIndex]: false // Automatically expand unlocked stage
        }))
      } else {
        showToast('All preparation stages completed! Excellent work! 🎉', 'success')
      }
    } else {
      const taskObj = (currentPhaseNew.tasks || []).find(t => t.taskId === taskId)
      if (taskObj?.completed) {
        showToast('Topic marked as completed! ✓', 'success')
      } else {
        showToast('Topic marked as incomplete.', 'info')
        // If unchecking made the stage incomplete, ensure it stays expanded
        setCollapsedRounds(prev => ({
          ...prev,
          [stageIndex]: false
        }))
      }
    }

    // Persist to server
    try {
      const res = await api.roadmaps.toggleTask(roadmap._id, taskId)
      if (!res.success) {
        setRoadmap(prevRoadmap)
        showToast('Failed to save completion status to server.', 'danger')
      }
    } catch (err) {
      setRoadmap(prevRoadmap)
      showToast(err.message || 'Failed to update topic status', 'danger')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // Find corresponding Preparation Hub resource for a topic
  const findTopicResource = (task) => {
    const topicId = task.topicId || task.taskId
    let found = curriculumTopics.find(t => t.id === topicId)
    if (!found) {
      const fallbackId = mapQuestionToHubTopicId(task.title, task.subject)
      if (fallbackId) {
        found = curriculumTopics.find(t => t.id === fallbackId)
      }
    }
    return found || null
  }

  // Open resource modal for a topic (viewing never marks a topic completed)
  const handleOpenStudyResource = (task, isStageLocked, stageIndex) => {
    const topicId = task.topicId || task.taskId
    const foundResource = findTopicResource(task)

    const allTasks = roadmap?.phases?.flatMap(p => p.tasks || []) || []
    const isCompleted = task.completed !== undefined
      ? task.completed
      : (allTasks.find(t => t.taskId === topicId)?.completed || false)

    if (foundResource) {
      setSelectedResourceTopic({
        ...foundResource,
        taskId: task.taskId || topicId,
        taskCompleted: isCompleted,
        hasResource: true,
        isStageLocked,
        stageIndex
      })
    } else {
      setSelectedResourceTopic({
        id: topicId,
        taskId: task.taskId || topicId,
        title: task.title,
        pillar: task.subject,
        description: task.detail || 'Curated study materials are currently in preparation for this topic.',
        popularWebsites: [],
        youtubeVideos: [],
        hasResource: false,
        taskCompleted: isCompleted,
        isStageLocked,
        stageIndex
      })
    }
  }

  if (loading) {
    return (
      <div className="roadmap-loading">
        <PageHeader eyebrow="PLACEMENT JOURNEY" title="Loading your placement journey..." />
        <SkeletonLoader rows={6} height={70} />
      </div>
    )
  }

  const company = roadmap?.company || user?.targetCompany || {
    name: 'Selected Company',
    mark: 'H',
    color: '#2563eb'
  }

  // Empty state: No target company selected
  if (!targetCompanyId && !roadmap) {
    return (
      <div className="roadmap-page">
        <PageHeader
          eyebrow="PLACEMENT JOURNEY"
          title="Placement Preparation Roadmap"
          description="Select your target placement company and job role to view your personalized interview journey."
        />
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '40px auto',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <Target size={44} color="#2563eb" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px', fontWeight: 700 }}>
            No Placement Target Selected
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
            Choose your target placement company and job role to load your required interview stages, syllabus milestones, and learning resources.
          </p>
          <button
            type="button"
            className="button primary"
            onClick={onOpenTarget ? onOpenTarget : () => navigate('/companies')}
            style={{ display: 'inline-flex' }}
          >
            <Building2 size={15} /> Select Target Company
          </button>
        </div>
      </div>
    )
  }

  // Empty state: Roadmap unavailable for selected company and role
  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="roadmap-page">
        <PageHeader
          eyebrow="PLACEMENT JOURNEY"
          title={`Placement Journey: ${company.name}`}
          description={`Target Role: ${roadmap?.role || targetRole}`}
        />
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '40px auto',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <Milestone size={44} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px', fontWeight: 700 }}>
            No Roadmap Available Yet
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
            A verified preparation roadmap is not available yet for {company.name} ({targetRole}). Interview stages and topic mappings are currently being curated by our placement team.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/companies" className="button secondary">
              <Building2 size={15} /> Browse Supported Companies
            </Link>
            <Link to="/company-prep" className="button">
              <BookOpen size={15} /> Open Preparation Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate unique statistics strictly from database tasks
  const allTasks = roadmap.phases.flatMap(p => p.tasks || [])
  const uniqueTaskIds = [...new Set(allTasks.map(t => t.taskId))]
  const uniqueCompletedTaskIds = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]

  const totalUniqueTopics = uniqueTaskIds.length
  const completedUniqueTopics = uniqueCompletedTaskIds.length
  const overallPercentage = totalUniqueTopics > 0
    ? Math.round((completedUniqueTopics / totalUniqueTopics) * 100)
    : 0

  // Identify active stage index (first unlocked stage that is incomplete)
  const activePhaseIndex = roadmap.phases.findIndex(
    (phase, idx) => isPhaseUnlocked(idx, roadmap.phases) && !isPhaseCompleted(phase)
  )

  // Identify first incomplete stage overall (used for lock messages)
  const firstIncompleteStageIndex = roadmap.phases.findIndex(p => !isPhaseCompleted(p))

  // Find next incomplete topic in the active stage
  let nextIncompleteTask = null
  if (activePhaseIndex !== -1) {
    const activePhase = roadmap.phases[activePhaseIndex]
    const foundTask = (activePhase.tasks || []).find(t => !t.completed)
    if (foundTask) {
      nextIncompleteTask = foundTask
    }
  }

  return (
    <div className="roadmap-page">
      {/* 1. Header showing "Placement Journey", selected company and job role */}
      <PageHeader
        eyebrow="PLACEMENT JOURNEY"
        title={`${company.name} · ${roadmap.role || targetRole}`}
        description={`Follow your structured preparation roadmap through each verified recruitment round for ${company.name}. Complete required topics to unlock subsequent stages and track your progress.`}
      >
        <Link to="/company-prep" className="button secondary">
          <BookOpen size={15} /> Preparation Hub
        </Link>
        <Link to="/mock-tests" className="button secondary">
          <FileCheck2 size={15} /> Mock Tests
        </Link>
      </PageHeader>

      {/* 2. Compact Overall Preparation Summary based on real saved completion data */}
      <section className="journey-hero-strip">
        <div className="journey-hero-meta">
          <CompanyMark company={company} large />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                TARGET PLACEMENT GOAL
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>·</span>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                {roadmap.phases.length} Recruitment Stages
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '2px 0 3px' }}>
              {roadmap.role || targetRole} at {company.name}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              <b>{completedUniqueTopics}</b> of <b>{totalUniqueTopics}</b> unique required topics completed ({overallPercentage}% preparation progress)
            </p>
          </div>
        </div>

        <div style={{ flex: '1 1 240px', maxWidth: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Overall Completion</span>
            <b style={{ fontSize: '16px', color: '#0f172a' }}>{overallPercentage}%</b>
          </div>
          <ProgressBar
            value={overallPercentage}
            tone={overallPercentage === 100 ? 'green' : 'blue'}
            showValue={false}
            height={8}
          />
        </div>
      </section>

      {/* All Preparation Stages Completed Celebration Banner */}
      {completedUniqueTopics > 0 && completedUniqueTopics === totalUniqueTopics && (
        <section style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '18px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <CheckCircle2 size={26} color="#16a34a" />
            <div>
              <strong style={{ fontSize: '15px', color: '#166534', display: 'block' }}>
                All Preparation Stages Completed! 🎉
              </strong>
              <span style={{ fontSize: '12px', color: '#15803d' }}>
                You have finished all {totalUniqueTopics} syllabus milestones across all recruitment rounds for {company.name}. Validate your readiness with a timed mock assessment.
              </span>
            </div>
          </div>
          <Link to="/mock-tests" className="button" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
            <FileCheck2 size={14} /> Take Mock Assessment
          </Link>
        </section>
      )}

      {/* Metric Counts and Expand/Collapse Controls Bar */}
      <div className="journey-controls-bar">
        <div className="journey-filter-tabs">
          <div className="filter-tab journey-stat-pill total">
            <span>All Topics</span>
            <span className="filter-tab-count journey-stat-pill-count">{totalUniqueTopics}</span>
          </div>
          <div className="filter-tab journey-stat-pill remaining">
            <span>Remaining</span>
            <span className="filter-tab-count journey-stat-pill-count">{totalUniqueTopics - completedUniqueTopics}</span>
          </div>
          <div className="filter-tab journey-stat-pill completed">
            <span>Completed</span>
            <span className="filter-tab-count journey-stat-pill-count">{completedUniqueTopics}</span>
          </div>
        </div>

        <button
          type="button"
          className="journey-expand-btn"
          onClick={handleToggleExpandAll}
        >
          <Layers size={14} />
          <span>{roadmap.phases.every((_, idx) => collapsedRounds[idx]) ? 'Expand All Stages' : 'Collapse All Stages'}</span>
        </button>
      </div>

      {/* 4 & 5. Vertical Timeline Sequence of Recruitment Round Cards with Sequential Unlocking */}
      <div className="journey-timeline-wrapper">
        {roadmap.phases.map((phase, pIdx) => {
          const isCollapsed = !!collapsedRounds[pIdx]
          const phaseTasks = phase.tasks || []
          const filteredTasks = phaseTasks

          const doneInPhase = phaseTasks.filter(t => t.completed).length
          const totalInPhase = phaseTasks.length
          const phasePct = totalInPhase > 0 ? Math.round((doneInPhase / totalInPhase) * 100) : 0

          // Calculate stage completion and unlocking state
          const isCompletedStage = isPhaseCompleted(phase)
          const isUnlockedStage = isPhaseUnlocked(pIdx, roadmap.phases)
          const isActiveStage = isUnlockedStage && !isCompletedStage
          const isStageLocked = !isUnlockedStage

          let stageState = 'upcoming'
          let stageLabel = 'Upcoming Stage'

          if (totalInPhase === 0) {
            stageState = 'unavailable'
            stageLabel = 'No Topics Assigned'
          } else if (isCompletedStage) {
            stageState = 'completed'
            stageLabel = 'Completed'
          } else if (isActiveStage) {
            stageState = 'active'
            stageLabel = 'Active Stage'
          } else if (isStageLocked) {
            stageState = 'locked'
            stageLabel = `Locked · Complete Stage ${firstIncompleteStageIndex + 1} First`
          }

          return (
            <div key={phase.phaseNumber || pIdx} id={`stage-${phase.roundNumber || pIdx + 1}`} className="journey-stage-row">
              {/* Timeline Spine & Stage Node Indicator */}
              <div className="journey-stage-spine">
                <div
                  className={`journey-stage-node ${stageState}`}
                  title={`Stage ${phase.roundNumber || pIdx + 1}: ${stageLabel}`}
                >
                  {isCompletedStage ? (
                    <Check size={18} strokeWidth={3} />
                  ) : isActiveStage ? (
                    <Play size={15} fill="currentColor" />
                  ) : isStageLocked ? (
                    <Lock size={15} />
                  ) : (
                    <span>{phase.roundNumber || pIdx + 1}</span>
                  )}
                </div>
              </div>

              {/* Stage Card */}
              <article className={`journey-stage-card ${isActiveStage ? 'is-active-stage' : ''} ${isCompletedStage ? 'is-completed-stage' : ''} ${isStageLocked ? 'is-locked-stage' : ''}`}>
                {/* Stage Header */}
                <header
                  className="journey-stage-header"
                  onClick={() => toggleRoundCollapse(pIdx)}
                  style={{ background: isCollapsed ? (isStageLocked ? '#fcfdfd' : '#ffffff') : '#f8fafc' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 300px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          STAGE {phase.roundNumber || pIdx + 1}
                        </span>

                        {/* Distinct text badges & icons for stage state */}
                        <span className={`stage-status-pill ${stageState}`}>
                          {isCompletedStage && <Check size={12} strokeWidth={3} />}
                          {isActiveStage && <Sparkles size={12} />}
                          {isStageLocked && <Lock size={12} />}
                          {stageState === 'unavailable' && <AlertCircle size={12} />}
                          {stageLabel}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: isStageLocked ? '#475569' : '#0f172a', margin: '2px 0 0' }}>
                        {phase.title}
                      </h3>

                      {phase.subtitle && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                          {phase.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isCompletedStage ? '#166534' : (isActiveStage ? '#1d4ed8' : '#64748b')
                      }}>
                        {doneInPhase} / {totalInPhase} Topics ({phasePct}%)
                      </span>
                      <div style={{ width: '90px', marginTop: '3px' }}>
                        <ProgressBar
                          value={phasePct}
                          tone={isCompletedStage ? 'green' : (isActiveStage ? 'blue' : 'gray')}
                          showValue={false}
                          height={4}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={isCollapsed ? `Expand ${phase.title}` : `Collapse ${phase.title}`}
                      style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: '#64748b' }}
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </header>

                {/* Expandable List of Topics */}
                {!isCollapsed && (
                  <div style={{ padding: '16px 20px', display: 'grid', gap: '10px', borderTop: '1px solid #e2e8f0' }}>
                    {/* Locked stage informative banner */}
                    {isStageLocked && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ background: '#f1f5f9', color: '#64748b', padding: '7px', borderRadius: '6px', flexShrink: 0 }}>
                          <Lock size={15} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                          <strong style={{ color: '#1e293b', display: 'block', marginBottom: '2px' }}>
                            Prerequisite Stage Incomplete
                          </strong>
                          Complete all required topics in <b>Stage {firstIncompleteStageIndex + 1}: {roadmap.phases[firstIncompleteStageIndex]?.title}</b> to unlock this stage and its completion checkboxes. You can preview study resources below.
                        </div>
                      </div>
                    )}

                    {filteredTasks.map(task => {
                      const isCompleted = task.completed
                      const isNextIncomplete = nextIncompleteTask && nextIncompleteTask.taskId === task.taskId
                      const isUpdating = updatingTaskId === task.taskId
                      const resourceObj = findTopicResource(task)
                      const hasResource = !!resourceObj

                      return (
                        <div
                          key={task.taskId}
                          className={`topic-item-card ${isCompleted ? 'is-done' : ''} ${isNextIncomplete ? 'is-next' : ''} ${isStageLocked ? 'is-locked' : ''}`}
                        >
                          {/* 1. Modern Clean Custom Checkbox */}
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isCompleted}
                            disabled={isStageLocked || isUpdating}
                            onClick={() => handleToggleTask(task.taskId, isStageLocked, pIdx)}
                            title={
                              isStageLocked
                                ? `Locked: Complete Stage ${firstIncompleteStageIndex + 1} first to unlock this topic`
                                : isCompleted
                                ? 'Mark as incomplete'
                                : 'Mark as completed'
                            }
                            className={`topic-checkbox ${isCompleted ? 'checked' : ''} ${isStageLocked ? 'locked' : ''}`}
                          >
                            <div className="topic-checkbox-box">
                              {isCompleted ? (
                                <Check size={14} strokeWidth={3} />
                              ) : isStageLocked ? (
                                <Lock size={11} strokeWidth={2.2} />
                              ) : null}
                            </div>
                          </button>

                          {/* Topic Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                              <span className={`pillar-tag ${(task.subject || '').toLowerCase().replace(/[^a-z]/g, '-')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {task.subject}
                              </span>
                              <span className={`importance-tag ${(task.priority || 'medium').toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {task.priority} Priority
                              </span>
                              <span style={{ fontSize: '10px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <Clock size={11} /> {task.estimatedMinutes} mins
                              </span>
                              {isNextIncomplete && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '4px',
                                  padding: '1px 6px'
                                }}>
                                  Next to Study
                                </span>
                              )}
                              {isCompleted && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#16a34a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Check size={11} /> Completed
                                </span>
                              )}
                              {isStageLocked && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  padding: '1px 6px'
                                }}>
                                  Locked
                                </span>
                              )}
                            </div>

                            <strong style={{
                              fontSize: '13px',
                              color: isCompleted ? '#334155' : (isStageLocked ? '#475569' : '#0f172a'),
                              textDecoration: 'none',
                              display: 'block'
                            }}>
                              {task.title}
                            </strong>

                            {task.detail && (
                              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                                {task.detail}
                              </p>
                            )}
                          </div>

                          {/* "Study Now" Action linking to matching Preparation Hub resource */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {hasResource ? (
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => handleOpenStudyResource(task, isStageLocked, pIdx)}
                                style={{
                                  fontSize: '11px',
                                  padding: '5px 11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <BookOpen size={12} /> Study Now
                              </button>
                            ) : (
                              <span className="resource-unavailable-label" title="Curated study materials are currently in preparation for this topic">
                                Resource not available yet
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {filteredTasks.length === 0 && (
                      <p style={{ margin: 0, padding: '16px 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                        No topics listed for this interview round.
                      </p>
                    )}
                  </div>
                )}
              </article>
            </div>
          )
        })}
      </div>



      {/* Learning Resources Modal: Opens curated notes & videos */}
      {selectedResourceTopic && (
        <Modal
          title={`Study Topic: ${selectedResourceTopic.title}`}
          close={() => setSelectedResourceTopic(null)}
          onClose={() => setSelectedResourceTopic(null)}
          maxWidth="560px"
        >
          <div className="resource-modal-content">
            <div className="modal-topic-overview">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className={`pillar-tag ${(selectedResourceTopic.pillar || '').toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {selectedResourceTopic.pillar}
                </span>
                {selectedResourceTopic.importance && (
                  <span className={`importance-tag ${selectedResourceTopic.importance.toLowerCase()}`}>
                    {selectedResourceTopic.importance} Importance
                  </span>
                )}
                {selectedResourceTopic.estimatedHours && (
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={12} /> {selectedResourceTopic.estimatedHours}
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  marginLeft: 'auto',
                  color: selectedResourceTopic.taskCompleted ? '#16a34a' : '#d97706'
                }}>
                  {selectedResourceTopic.taskCompleted ? '✓ Completed' : '○ Incomplete'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {selectedResourceTopic.description}
              </p>
            </div>

            {/* Verified Documentation Tutorials */}
            <div className="resource-section" style={{ marginTop: '16px' }}>
              <h4 className="resource-section-heading">
                <Globe size={16} />
                <span>Verified Documentation & Tutorials</span>
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
                        <span>Provider: <b>{web.provider}</b></span>
                      </div>
                      <div className="resource-open-action">
                        <span>Open Guide</span>
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0' }}>
                    {selectedResourceTopic.hasResource === false ? 'Resource not available yet for this topic.' : 'No external documentation mapped for this topic.'}
                  </p>
                )}
              </div>
            </div>

            {/* Video Playlists */}
            <div className="resource-section" style={{ marginTop: '16px' }}>
              <h4 className="resource-section-heading">
                <YoutubeIcon size={16} className="yt-icon" />
                <span>Curated Video Playlists</span>
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
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0' }}>
                    {selectedResourceTopic.hasResource === false ? 'Video playlists not available yet for this topic.' : 'No video masterclasses mapped for this topic.'}
                  </p>
                )}
              </div>
            </div>

            {/* Action Footer: Manual toggle checkbox & Hub Link */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '16px',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`button ${selectedResourceTopic.taskCompleted ? 'secondary' : 'primary'}`}
                  onClick={() => {
                    handleToggleTask(
                      selectedResourceTopic.taskId,
                      selectedResourceTopic.isStageLocked,
                      selectedResourceTopic.stageIndex || 0
                    )
                    setSelectedResourceTopic(prev => ({ ...prev, taskCompleted: !prev.taskCompleted }))
                  }}
                  disabled={updatingTaskId === selectedResourceTopic.taskId || selectedResourceTopic.isStageLocked}
                >
                  {selectedResourceTopic.isStageLocked ? (
                    <>
                      <Lock size={15} /> Topic Locked (Complete Prerequisite Stage First)
                    </>
                  ) : selectedResourceTopic.taskCompleted ? (
                    <>
                      <CheckCircle2 size={15} color="#16a34a" /> Marked Completed (Click to Uncheck)
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Mark Topic as Completed
                    </>
                  )}
                </button>

                <Link
                  to={`/company-prep?company=${targetCompanyId}&topic=${selectedResourceTopic.id}`}
                  className="button secondary"
                  onClick={() => setSelectedResourceTopic(null)}
                >
                  <BookOpen size={14} /> Open in Preparation Hub
                </Link>
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

export default RoadmapPage
