import { Company } from '../models/Company.js'
import { Roadmap } from '../models/Roadmap.js'
import { User } from '../models/User.js'
import { getCurriculumForCompany, COMPANY_CURRICULUM } from './curriculumService.js'

// Pre-verified mappings from company recruitment rounds to required curriculum topics
const COMPANY_ROUND_TOPIC_MAPPINGS = {
  google: [
    // Round 1: Online Assessment
    ['dsa-arrays-strings', 'dsa-trees-bst'],
    // Round 2: Technical Round 1: DSA
    ['dsa-linked-lists', 'dsa-graphs', 'dsa-dynamic-programming'],
    // Round 3: Technical Round 2: Core CS
    ['core-dbms-sql', 'core-os', 'web-system-design', 'core-cn'],
    // Round 4: Googliness & Leadership
    ['hr-star-framework']
  ],
  microsoft: [
    // Round 1: Online Coding Assessment
    ['dsa-arrays-strings', 'dsa-linked-lists'],
    // Round 2: Technical Interview 1
    ['dsa-trees-bst', 'dsa-graphs', 'dsa-dynamic-programming'],
    // Round 3: Technical Interview 2
    ['core-oop', 'core-dbms-sql', 'core-os'],
    // Round 4: AA / Managerial Round
    ['hr-star-framework']
  ],
  amazon: [
    // Round 1: Online Assessment
    ['dsa-arrays-strings', 'dsa-trees-bst'],
    // Round 2: Technical Round: Problem Solving
    ['dsa-linked-lists', 'dsa-graphs', 'dsa-dynamic-programming'],
    // Round 3: Technical Round: CS Fundamentals
    ['core-dbms-sql', 'core-os', 'web-system-design'],
    // Round 4: Bar Raiser Round
    ['hr-star-framework']
  ],
  accenture: [
    // Round 1: Cognitive & Technical Assessment
    ['apti-quantitative', 'apti-logical-reasoning', 'apti-verbal-ability'],
    // Round 2: Coding Assessment
    ['dsa-arrays-strings', 'dsa-linked-lists'],
    // Round 3: Communication Assessment
    ['apti-verbal-ability'],
    // Round 4: Technical & HR Discussion
    ['core-dbms-sql', 'core-oop', 'web-javascript-react', 'web-backend-apis', 'hr-star-framework']
  ],
  tcs: [
    // Round 1: TCS NQT Assessment
    ['apti-quantitative', 'apti-logical-reasoning', 'apti-verbal-ability', 'dsa-arrays-strings'],
    // Round 2: Technical Interview
    ['core-oop', 'core-dbms-sql', 'core-os', 'core-cn'],
    // Round 3: Managerial & HR Interview
    ['hr-star-framework']
  ],
  infosys: [
    // Round 1: Online Test (InfyTQ)
    ['apti-quantitative', 'apti-logical-reasoning', 'dsa-arrays-strings'],
    // Round 2: Technical Interview
    ['core-oop', 'core-dbms-sql', 'core-os'],
    // Round 3: HR Interview
    ['hr-star-framework']
  ],
  deloitte: [
    // Round 1: Aptitude & Verbal Test
    ['apti-quantitative', 'apti-logical-reasoning', 'apti-verbal-ability'],
    // Round 2: Technical & Case Round
    ['core-dbms-sql', 'core-oop'],
    // Round 3: Partner / HR Interview
    ['hr-star-framework']
  ]
}

export async function generateRoadmapForStudent(userId, companyId, roleTitle, availableWeeks = 8) {
  const company = await Company.findById(companyId).lean()
  if (!company) {
    throw new Error('Target company not found')
  }

  const role = roleTitle || company.roles?.[0] || 'Software Engineer'

  // Get verified curriculum topics matching this company and role
  const curriculum = getCurriculumForCompany(company, [role])
  const roleTopics = curriculum.topics || []
  const topicMap = new Map(roleTopics.map(t => [t.id, t]))

  // Fetch student's saved completion states for this company and role
  const user = await User.findById(userId).lean()
  let completedTopicIds = user?.completedTopics || []
  if (companyId && user?.targetProgress?.length > 0) {
    const entry = user.targetProgress.find(
      tp => tp.company?.toString() === companyId.toString() && (!role || tp.role === role || !tp.role)
    )
    if (entry && Array.isArray(entry.completedTopics)) {
      completedTopicIds = entry.completedTopics
    }
  }

  const now = new Date()
  const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000)

  let phases = []

  // Check if company has verified recruitment rounds
  if (company.recruitmentRounds && company.recruitmentRounds.length > 0) {
    const code = (company.code || '').toLowerCase()
    const predefinedRoundTopicIds = COMPANY_ROUND_TOPIC_MAPPINGS[code]

    phases = company.recruitmentRounds.map((round, rIdx) => {
      let targetTopicIds = []
      if (predefinedRoundTopicIds && predefinedRoundTopicIds[rIdx]) {
        targetTopicIds = predefinedRoundTopicIds[rIdx]
      } else {
        // Dynamic assignment based on round name and type
        const roundText = `${round.name} ${round.description || ''} ${round.roundType || ''}`.toLowerCase()
        if (roundText.includes('aptitude') || roundText.includes('cognitive') || roundText.includes('nqt') || roundText.includes('verbal')) {
          targetTopicIds = ['apti-quantitative', 'apti-logical-reasoning', 'apti-verbal-ability']
        } else if (roundText.includes('coding') || roundText.includes('problem solving') || roundText.includes('round 1')) {
          targetTopicIds = ['dsa-arrays-strings', 'dsa-linked-lists', 'dsa-trees-bst', 'dsa-graphs']
        } else if (roundText.includes('core') || roundText.includes('technical') || roundText.includes('case')) {
          targetTopicIds = ['core-dbms-sql', 'core-os', 'core-oop', 'core-cn']
        } else if (roundText.includes('hr') || roundText.includes('behavioral') || roundText.includes('managerial') || roundText.includes('leadership')) {
          targetTopicIds = ['hr-star-framework']
        }
      }

      // Filter to topics that are part of this role's required curriculum
      const matchedTopics = targetTopicIds
        .map(id => topicMap.get(id))
        .filter(Boolean)

      const roundTasks = matchedTopics.map((topic, tIdx) => {
        const isCompleted = completedTopicIds.includes(topic.id)
        return {
          taskId: topic.id,
          topicId: topic.id,
          title: topic.title,
          subject: topic.pillar,
          topic: topic.id,
          detail: topic.description,
          priority: topic.importance || 'Medium',
          estimatedMinutes: topic.estimatedHours ? parseInt(topic.estimatedHours) * 60 : 45,
          dueDate: addDays(now, (rIdx * 14) + ((tIdx + 1) * 3)),
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })

      return {
        phaseNumber: round.roundNumber || rIdx + 1,
        roundNumber: round.roundNumber || rIdx + 1,
        roundType: round.roundType || 'Technical Interview',
        title: round.name.startsWith('Round') ? round.name : `Round ${round.roundNumber || rIdx + 1}: ${round.name}`,
        subtitle: round.description || `Required preparation for ${round.name} at ${company.name}`,
        tasks: roundTasks
      }
    })

    // Check if any role topics were missed, and append them to appropriate round
    const assignedIds = new Set(phases.flatMap(p => p.tasks.map(t => t.taskId)))
    const unassignedTopics = roleTopics.filter(t => !assignedIds.has(t.id))

    if (unassignedTopics.length > 0) {
      unassignedTopics.forEach(topic => {
        // Find best phase by pillar
        let targetPhase = phases[1] || phases[0]
        if (topic.pillar === 'Aptitude' && phases[0]) targetPhase = phases[0]
        else if (topic.pillar === 'DSA' && phases[1]) targetPhase = phases[1]
        else if ((topic.pillar === 'Core CS' || topic.pillar === 'Web & Technical') && phases[2]) targetPhase = phases[2]
        else if (topic.pillar === 'HR & Behavioral' && phases[phases.length - 1]) targetPhase = phases[phases.length - 1]

        if (targetPhase) {
          const isCompleted = completedTopicIds.includes(topic.id)
          targetPhase.tasks.push({
            taskId: topic.id,
            topicId: topic.id,
            title: topic.title,
            subject: topic.pillar,
            topic: topic.id,
            detail: topic.description,
            priority: topic.importance || 'Medium',
            estimatedMinutes: topic.estimatedHours ? parseInt(topic.estimatedHours) * 60 : 45,
            dueDate: addDays(now, 20),
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null
          })
        }
      })
    }
  } else {
    // Fallback: 4 structured preparation rounds matching the standard curriculum pillars
    const pillarRounds = [
      {
        roundNumber: 1,
        title: 'Round 1: Screening & Aptitude Assessment',
        subtitle: `Quantitative, logical, and verbal fundamentals tested in ${company.name}'s initial screening`,
        pillar: 'Aptitude'
      },
      {
        roundNumber: 2,
        title: 'Round 2: Algorithmic Coding & Problem Solving',
        subtitle: 'Core data structures and algorithms aligned with technical assessments',
        pillar: 'DSA'
      },
      {
        roundNumber: 3,
        title: 'Round 3: Core CS & Technical Systems',
        subtitle: 'DBMS, operating systems, object-oriented design, and framework architecture',
        pillar: ['Core CS', 'Web & Technical']
      },
      {
        roundNumber: 4,
        title: 'Round 4: Behavioral & HR Interview',
        subtitle: 'STAR framework responses, project walkthroughs, and leadership discussions',
        pillar: 'HR & Behavioral'
      }
    ]

    phases = pillarRounds.map(pr => {
      const allowedPillars = Array.isArray(pr.pillar) ? pr.pillar : [pr.pillar]
      const matchingTopics = roleTopics.filter(t => allowedPillars.includes(t.pillar))

      const roundTasks = matchingTopics.map((topic, tIdx) => {
        const isCompleted = completedTopicIds.includes(topic.id)
        return {
          taskId: topic.id,
          topicId: topic.id,
          title: topic.title,
          subject: topic.pillar,
          topic: topic.id,
          detail: topic.description,
          priority: topic.importance || 'Medium',
          estimatedMinutes: topic.estimatedHours ? parseInt(topic.estimatedHours) * 60 : 45,
          dueDate: addDays(now, (pr.roundNumber * 10) + ((tIdx + 1) * 3)),
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })

      return {
        phaseNumber: pr.roundNumber,
        roundNumber: pr.roundNumber,
        title: pr.title,
        subtitle: pr.subtitle,
        tasks: roundTasks
      }
    })
  }

  // Calculate unique topic overall progress
  const allTasks = phases.flatMap(p => p.tasks)
  const uniqueTaskIds = [...new Set(allTasks.map(t => t.taskId))]
  const uniqueCompleted = [...new Set(allTasks.filter(t => t.completed).map(t => t.taskId))]
  const progressPercentage = uniqueTaskIds.length > 0
    ? Math.round((uniqueCompleted.length / uniqueTaskIds.length) * 100)
    : 0

  // Check if an existing roadmap exists for this user and company
  let roadmap = await Roadmap.findOne({ user: userId, company: companyId })
  if (roadmap) {
    roadmap.role = role
    roadmap.availableWeeks = availableWeeks
    roadmap.targetDate = addDays(now, availableWeeks * 7)
    roadmap.phases = phases
    roadmap.progressPercentage = progressPercentage

    await roadmap.save()
    return roadmap
  }

  roadmap = await Roadmap.create({
    user: userId,
    company: companyId,
    role: role,
    availableWeeks,
    targetDate: addDays(now, availableWeeks * 7),
    phases,
    progressPercentage
  })

  return roadmap
}
