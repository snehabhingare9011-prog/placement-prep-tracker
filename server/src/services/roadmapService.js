import { Company } from '../models/Company.js'
import { PracticeAttempt } from '../models/PracticeAttempt.js'
import { TestAttempt } from '../models/TestAttempt.js'
import { Roadmap } from '../models/Roadmap.js'

export async function generateRoadmapForStudent(userId, companyId, roleTitle, availableWeeks = 8) {
  const company = await Company.findById(companyId).lean()
  if (!company) {
    throw new Error('Target company not found')
  }

  // Find student weak topics
  const practiceAttempts = await PracticeAttempt.find({ user: userId }).populate('question').lean()
  const weakSubjects = new Set()
  const topicCounts = {}

  practiceAttempts.forEach(p => {
    const subj = p.question?.subject
    if (!subj) return
    if (!topicCounts[subj]) topicCounts[subj] = { total: 0, correct: 0 }
    topicCounts[subj].total += 1
    if (p.isCorrect || p.status === 'solved') topicCounts[subj].correct += 1
  })

  Object.entries(topicCounts).forEach(([subj, data]) => {
    if (data.total >= 2 && Math.round((data.correct / data.total) * 100) < 60) {
      weakSubjects.add(subj)
    }
  })

  const now = new Date()
  const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000)

  // Deterministic rule-based task curriculum
  const phases = [
    {
      phaseNumber: 1,
      title: 'Phase 1 · Programming Foundations & Core Algorithms',
      subtitle: `Essential fundamentals tested in ${company.name}'s initial screening`,
      tasks: [
        {
          taskId: 'p1-t1',
          title: 'Arrays & Two-Pointer Patterns',
          subject: 'DSA',
          topic: 'Arrays',
          detail: 'Master two-pointer and sliding-window problems with linear time complexity.',
          priority: weakSubjects.has('DSA') ? 'High' : 'Medium',
          estimatedMinutes: 45,
          dueDate: addDays(now, 3),
          completed: false
        },
        {
          taskId: 'p1-t2',
          title: 'String Manipulation & Frequency Maps',
          subject: 'DSA',
          topic: 'Strings',
          detail: 'Anagrams, palindrome checks, and hash table lookups.',
          priority: 'Medium',
          estimatedMinutes: 30,
          dueDate: addDays(now, 6),
          completed: false
        },
        {
          taskId: 'p1-t3',
          title: 'Quantitative Aptitude: Time, Work & Percentages',
          subject: 'Aptitude',
          topic: 'Quantitative',
          detail: `Frequently tested in ${company.name} online assessment round.`,
          priority: 'High',
          estimatedMinutes: 40,
          dueDate: addDays(now, 9),
          completed: false
        }
      ]
    },
    {
      phaseNumber: 2,
      title: 'Phase 2 · Data Structures & Problem Solving Patterns',
      subtitle: 'Targeted data structures aligned with past technical interviews',
      tasks: [
        {
          taskId: 'p2-t1',
          title: 'Linked Lists & Fast/Slow Pointer Traversal',
          subject: 'DSA',
          topic: 'Linked Lists',
          detail: 'Cycle detection, reversing sublists, and merge operations.',
          priority: 'Medium',
          estimatedMinutes: 45,
          dueDate: addDays(now, 14),
          completed: false
        },
        {
          taskId: 'p2-t2',
          title: 'Binary Trees & BST Traversals',
          subject: 'DSA',
          topic: 'Trees',
          detail: 'Inorder, preorder, postorder traversals and height/depth computations.',
          priority: 'High',
          estimatedMinutes: 60,
          dueDate: addDays(now, 18),
          completed: false
        },
        {
          taskId: 'p2-t3',
          title: 'Graph Traversals (BFS & DFS)',
          subject: 'DSA',
          topic: 'Graphs',
          detail: 'Connected components, topological sort, and shortest path basics.',
          priority: weakSubjects.has('DSA') ? 'High' : 'Medium',
          estimatedMinutes: 60,
          dueDate: addDays(now, 22),
          completed: false
        }
      ]
    },
    {
      phaseNumber: 3,
      title: 'Phase 3 · Core Computer Science Fundamentals',
      subtitle: 'Theoretical rigor in DBMS, OS, Networks and Object-Oriented Design',
      tasks: [
        {
          taskId: 'p3-t1',
          title: 'DBMS: Transactions, ACID Properties & Indexing',
          subject: 'Core CS',
          topic: 'DBMS',
          detail: 'Transaction isolation levels, B-Trees vs Hash indexes, and query optimization.',
          priority: weakSubjects.has('DBMS') ? 'High' : 'Medium',
          estimatedMinutes: 45,
          dueDate: addDays(now, 27),
          completed: false
        },
        {
          taskId: 'p3-t2',
          title: 'SQL: Complex Joins, Grouping & Window Functions',
          subject: 'Core CS',
          topic: 'SQL',
          detail: 'Inner/outer joins, aggregate filters with HAVING, and ranking queries.',
          priority: 'High',
          estimatedMinutes: 35,
          dueDate: addDays(now, 32),
          completed: false
        },
        {
          taskId: 'p3-t3',
          title: 'Operating Systems: Process Scheduling & Synchronization',
          subject: 'Core CS',
          topic: 'Operating Systems',
          detail: 'Deadlocks, semaphores, mutexes, and virtual memory paging.',
          priority: 'Medium',
          estimatedMinutes: 40,
          dueDate: addDays(now, 36),
          completed: false
        }
      ]
    },
    {
      phaseNumber: 4,
      title: 'Phase 4 · Mock Assessments & Company Interview Drills',
      subtitle: `Simulated rounds mirroring the ${company.name} hiring process`,
      tasks: [
        {
          taskId: 'p4-t1',
          title: `${company.name} Full-Length Readiness Mock Test`,
          subject: 'Mock Test',
          topic: 'Comprehensive',
          detail: 'Timed assessment covering aptitude, coding, and core CS MCQs.',
          priority: 'High',
          estimatedMinutes: 45,
          dueDate: addDays(now, 42),
          completed: false
        },
        {
          taskId: 'p4-t2',
          title: 'Technical Project Walkthrough Preparation',
          subject: 'Technical',
          topic: 'Architecture & Projects',
          detail: 'Structure a 3-minute explanation of your key projects and technical trade-offs.',
          priority: 'High',
          estimatedMinutes: 30,
          dueDate: addDays(now, 46),
          completed: false
        },
        {
          taskId: 'p4-t3',
          title: 'Behavioral & STAR Method Interview Practice',
          subject: 'HR',
          topic: 'Behavioral',
          detail: 'Formulate responses for leadership, conflict resolution, and teamwork questions.',
          priority: 'Medium',
          estimatedMinutes: 25,
          dueDate: addDays(now, 50),
          completed: false
        }
      ]
    }
  ]

  // Check if an existing roadmap exists for this user and company
  let roadmap = await Roadmap.findOne({ user: userId, company: companyId })
  if (roadmap) {
    // Preserve any already completed task statuses matching taskIds
    const completedTaskIds = new Set()
    roadmap.phases.forEach(p => {
      p.tasks.forEach(t => {
        if (t.completed) completedTaskIds.add(t.taskId)
      })
    })

    phases.forEach(p => {
      p.tasks.forEach(t => {
        if (completedTaskIds.has(t.taskId)) {
          t.completed = true
          t.completedAt = new Date()
        }
      })
    })

    roadmap.role = roleTitle || roadmap.role
    roadmap.availableWeeks = availableWeeks
    roadmap.targetDate = addDays(now, availableWeeks * 7)
    roadmap.phases = phases

    const allTasks = phases.flatMap(p => p.tasks)
    const doneTasks = allTasks.filter(t => t.completed)
    roadmap.progressPercentage = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0

    await roadmap.save()
    return roadmap
  }

  roadmap = await Roadmap.create({
    user: userId,
    company: companyId,
    role: roleTitle || company.roles[0] || 'Software Engineer',
    availableWeeks,
    targetDate: addDays(now, availableWeeks * 7),
    phases,
    progressPercentage: 0
  })

  return roadmap
}
