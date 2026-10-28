import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { JobRole } from '../src/models/JobRole.js'
import { Question } from '../src/models/Question.js'
import { Test } from '../src/models/Test.js'
import { TestAttempt } from '../src/models/TestAttempt.js'
import { PracticeAttempt } from '../src/models/PracticeAttempt.js'
import { SavedQuestion } from '../src/models/SavedQuestion.js'
import { Roadmap } from '../src/models/Roadmap.js'
import { PlacementDrive } from '../src/models/PlacementDrive.js'
import { Announcement } from '../src/models/Announcement.js'
import { ActivityLog } from '../src/models/ActivityLog.js'

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding process...')

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    JobRole.deleteMany({}),
    Question.deleteMany({}),
    Test.deleteMany({}),
    TestAttempt.deleteMany({}),
    PracticeAttempt.deleteMany({}),
    SavedQuestion.deleteMany({}),
    Roadmap.deleteMany({}),
    PlacementDrive.deleteMany({}),
    Announcement.deleteMany({}),
    ActivityLog.deleteMany({})
  ])

  console.log('[Seed] Cleared existing database collections.')

  // 1. Seed Companies
  const companiesData = [
    {
      name: 'Google',
      code: 'google',
      mark: 'G',
      color: '#4285f4',
      difficulty: 'Advanced',
      industry: 'Internet & Cloud Services',
      description: 'Product engineering roles with strong problem-solving, algorithms, and distributed system design focus.',
      roles: ['Software Engineer', 'Frontend Engineer', 'Site Reliability Engineer'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Online Assessment', description: '2 medium-to-hard algorithmic problems in 90 minutes', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical Round 1: DSA', description: 'Live coding on graphs, trees and dynamic programming', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'Technical Round 2: Core CS', description: 'System design, operating systems, and concurrency', roundType: 'Technical Interview' },
        { roundNumber: 4, name: 'Googliness & Leadership', description: 'Scenario-based behavioural and culture alignment interview', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 8.0, allowedBranches: ['Computer Engineering', 'Information Technology', 'Electronics & Comm'], graduationYears: [2026, 2027] },
      requiredSkills: ['DSA', 'System Design', 'DBMS', 'OS', 'JavaScript', 'C++ / Java'],
      frequentlyTestedSubjects: ['DSA', 'DBMS', 'OS', 'System Design']
    },
    {
      name: 'Microsoft',
      code: 'microsoft',
      mark: 'M',
      color: '#1574d1',
      difficulty: 'Advanced',
      industry: 'Enterprise Software & Cloud',
      description: 'Engineering roles focused on robust software fundamentals, clean code, object-oriented design and cloud platforms.',
      roles: ['Software Engineer', 'Support Engineer', 'Data Engineer'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Online Coding Assessment', description: '3 coding challenges on arrays, hashing and trees', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical Interview 1', description: 'Deep dive into data structures and algorithmic complexity', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'Technical Interview 2', description: 'Object-oriented programming, database design, and concurrency', roundType: 'Technical Interview' },
        { roundNumber: 4, name: 'AA / Managerial Round', description: 'Architectural thinking, project discussion and team collaboration', roundType: 'Managerial' }
      ],
      eligibilityCriteria: { minCgpa: 7.5, allowedBranches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      requiredSkills: ['DSA', 'OOP', 'DBMS', 'Cloud basics', 'React', 'C# / Java'],
      frequentlyTestedSubjects: ['DSA', 'OOP', 'DBMS', 'OS']
    },
    {
      name: 'Amazon',
      code: 'amazon',
      mark: 'a',
      color: '#111827',
      difficulty: 'Advanced',
      industry: 'E-commerce & Cloud Services',
      description: 'High-ownership engineering roles with rigorous coding questions and Amazon Leadership Principles evaluation.',
      roles: ['Software Development Engineer', 'QA Engineer'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Online Assessment', description: '2 coding problems + 1 work simulation assessment', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical Round: Problem Solving', description: 'Trees, graphs and greedy algorithm design', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'Technical Round: CS Fundamentals', description: 'DBMS internals, SQL queries, and OS memory management', roundType: 'Technical Interview' },
        { roundNumber: 4, name: 'Bar Raiser Round', description: 'Customer obsession, bias for action and technical depth', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 7.5, allowedBranches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      requiredSkills: ['DSA', 'Leadership Principles', 'OS', 'SQL', 'System Design'],
      frequentlyTestedSubjects: ['DSA', 'DBMS', 'OS', 'System Design']
    },
    {
      name: 'Accenture',
      code: 'accenture',
      mark: '>',
      color: '#a100ff',
      difficulty: 'Intermediate',
      industry: 'Consulting & Technology Delivery',
      description: 'Technology delivery roles that combine full-stack development, problem solving and clear client communication.',
      roles: ['Full Stack Developer', 'Associate Software Engineer'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Cognitive & Technical Assessment', description: 'Analytical, verbal reasoning and pseudocode test', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Coding Assessment', description: '2 algorithmic questions in 45 minutes', roundType: 'Online Assessment' },
        { roundNumber: 3, name: 'Communication Assessment', description: 'Interactive verbal fluency and listening test', roundType: 'Online Assessment' },
        { roundNumber: 4, name: 'Technical & HR Discussion', description: 'Final-year project review, web frameworks and adaptability', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 6.5, allowedBranches: ['Computer Engineering', 'Information Technology', 'Electronics & Comm', 'Mechanical', 'Civil'], graduationYears: [2026] },
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'DBMS', 'DSA', 'Git & GitHub', 'Aptitude', 'Communication'],
      frequentlyTestedSubjects: ['Aptitude', 'DSA', 'DBMS', 'SQL']
    },
    {
      name: 'TCS',
      code: 'tcs',
      mark: 't',
      color: '#1769aa',
      difficulty: 'Foundation',
      industry: 'Information Technology & Consulting',
      description: 'Premier campus hiring tracks across digital engineering, cloud consulting and enterprise IT services.',
      roles: ['Digital Profile', 'Ninja Profile', 'Prime Profile'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'TCS NQT Assessment', description: 'Foundation aptitude, advanced quantitative and coding questions', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical Interview', description: 'Core CS concepts: OOP, SQL, data structures and web basics', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'Managerial & HR Interview', description: 'Resume walk-through, willingness to relocate, and career goals', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 6.0, allowedBranches: ['Computer Engineering', 'Information Technology', 'Electronics & Comm'], graduationYears: [2026] },
      requiredSkills: ['Aptitude', 'DSA', 'OOP', 'SQL', 'Communication'],
      frequentlyTestedSubjects: ['Aptitude', 'Core CS', 'SQL', 'DSA']
    },
    {
      name: 'Infosys',
      code: 'infosys',
      mark: 'i',
      color: '#007cc3',
      difficulty: 'Foundation',
      industry: 'IT Services & Consulting',
      description: 'Campus hiring tracks with strong emphasis on analytical thinking, aptitude and object-oriented foundations.',
      roles: ['Systems Engineer', 'Specialist Programmer'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Online Test (InfyTQ)', description: 'Mathematical ability, logical reasoning and coding challenges', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical Interview', description: 'Programming questions, DBMS queries and project architecture', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'HR Interview', description: 'Communication, problem handling and culture fit', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 6.0, allowedBranches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      requiredSkills: ['Aptitude', 'Java', 'DBMS', 'OS', 'OOP'],
      frequentlyTestedSubjects: ['Aptitude', 'Core CS', 'DBMS']
    },
    {
      name: 'Deloitte',
      code: 'deloitte',
      mark: 'D',
      color: '#86bc25',
      difficulty: 'Intermediate',
      industry: 'Professional Services & Consulting',
      description: 'Technology consulting roles combining analytical modeling, database management and client communication skills.',
      roles: ['Analyst', 'Technology Consultant'],
      recruitmentRounds: [
        { roundNumber: 1, name: 'Aptitude & Verbal Test', description: 'Quantitative, logical reasoning and English proficiency', roundType: 'Online Assessment' },
        { roundNumber: 2, name: 'Technical & Case Round', description: 'SQL questions, business problem-solving and logic flowcharts', roundType: 'Technical Interview' },
        { roundNumber: 3, name: 'Partner / HR Interview', description: 'Behavioral scenarios, teamwork and career trajectory', roundType: 'HR Interview' }
      ],
      eligibilityCriteria: { minCgpa: 6.8, allowedBranches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      requiredSkills: ['Aptitude', 'SQL', 'Communication', 'OOP', 'Problem solving'],
      frequentlyTestedSubjects: ['Aptitude', 'SQL', 'DBMS']
    }
  ]

  const seededCompanies = await Company.insertMany(companiesData)
  const companyMap = new Map(seededCompanies.map(c => [c.code, c]))
  console.log(`[Seed] Seeded ${seededCompanies.length} companies.`)

  // 2. Seed Job Roles
  const rolesData = [
    {
      company: companyMap.get('google')._id,
      title: 'Software Engineer',
      description: 'Develop scalable backend systems, robust APIs, and performant data processing pipelines.',
      requiredSkills: ['DSA', 'System Design', 'C++', 'Go', 'Operating Systems'],
      packageLpa: '22 - 32 LPA',
      eligibility: { minCgpa: 8.0, branches: ['Computer Engineering', 'Information Technology'] }
    },
    {
      company: companyMap.get('accenture')._id,
      title: 'Full Stack Developer',
      description: 'Build end-to-end web applications with modern frontend frameworks and microservice APIs.',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git & GitHub'],
      packageLpa: '8 - 12 LPA',
      eligibility: { minCgpa: 6.5, branches: ['Computer Engineering', 'Information Technology'] }
    },
    {
      company: companyMap.get('microsoft')._id,
      title: 'Software Engineer',
      description: 'Engineer cloud services, enterprise applications, and developer productivity tools.',
      requiredSkills: ['DSA', 'OOP', 'Azure', 'C#', 'SQL'],
      packageLpa: '18 - 26 LPA',
      eligibility: { minCgpa: 7.5, branches: ['Computer Engineering', 'Information Technology'] }
    },
    {
      company: companyMap.get('tcs')._id,
      title: 'Digital Profile',
      description: 'Cutting-edge digital initiatives in cloud engineering, AI/ML deployment, and cyber security.',
      requiredSkills: ['Python', 'SQL', 'DSA', 'OOP', 'Communication'],
      packageLpa: '7 - 9 LPA',
      eligibility: { minCgpa: 6.5, branches: ['Computer Engineering', 'Information Technology'] }
    }
  ]
  await JobRole.insertMany(rolesData)
  console.log(`[Seed] Seeded ${rolesData.length} job roles.`)

  // 3. Seed Categorized Question Bank
  const questionsData = [
    {
      title: 'Longest Consecutive Sequence in Unsorted Array',
      statement: 'Given an unsorted array of integers, return the length of the longest consecutive elements sequence. The algorithm must run in O(n) time complexity.',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Arrays',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Sort the array first in O(n log n) time',
        'Store elements in a HashSet and verify if (num - 1) exists before expanding',
        'Use a binary search tree to store counts',
        'Use a sliding window of fixed size k'
      ],
      correctAnswer: 1,
      explanation: 'By inserting all numbers into a HashSet, we can look up elements in O(1). A number begins a sequence only if (num - 1) is not in the set, ensuring every element is visited at most twice for overall O(n) time.',
      examples: 'Input: nums = [100, 4, 200, 1, 3, 2]\nOutput: 4\nExplanation: The longest consecutive sequence is [1, 2, 3, 4], length 4.',
      constraints: '0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
      companies: [companyMap.get('google')._id, companyMap.get('amazon')._id],
      roles: ['Software Engineer', 'Full Stack Developer'],
      estimatedTimeMinutes: 20
    },
    {
      title: 'LRU Cache Design & Data Structure',
      statement: 'Which combination of data structures provides O(1) time complexity for both get(key) and put(key, value) operations in a Least Recently Used (LRU) Cache?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Hashing',
      difficulty: 'Hard',
      questionType: 'multiple-choice',
      options: [
        'Stack and dynamic array',
        'Hash Map and Doubly Linked List',
        'Binary Search Tree and Queue',
        'Priority Queue (Min-Heap) and Hash Set'
      ],
      correctAnswer: 1,
      explanation: 'A Hash Map allows O(1) key lookups. A Doubly Linked List allows O(1) removal and insertion of nodes at the head or tail to keep track of least recently accessed items.',
      examples: 'get(key): Move node to head of DLL in O(1).\nput(key, val): Evict node from tail if at capacity in O(1).',
      constraints: 'Capacity between 1 and 3000.',
      companies: [companyMap.get('google')._id, companyMap.get('amazon')._id, companyMap.get('microsoft')._id],
      roles: ['Software Engineer'],
      estimatedTimeMinutes: 30
    },
    {
      title: 'ACID Properties: Ensuring Atomicity in Transactions',
      statement: 'Which ACID property guarantees that all operations within a database transaction either execute completely or leave the database unchanged?',
      category: 'Core CS',
      subject: 'DBMS',
      topic: 'Transactions',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Consistency',
        'Isolation',
        'Atomicity',
        'Durability'
      ],
      correctAnswer: 2,
      explanation: 'Atomicity ensures "all-or-nothing" execution. If any query inside the transaction fails, the entire transaction rolls back.',
      examples: 'In a bank transfer: debiting Account A and crediting Account B must either both happen or neither.',
      constraints: 'Standard relational databases (PostgreSQL, MySQL, Oracle).',
      companies: [companyMap.get('accenture')._id, companyMap.get('infosys')._id, companyMap.get('tcs')._id],
      roles: ['Full Stack Developer', 'Systems Engineer'],
      estimatedTimeMinutes: 10
    },
    {
      title: 'SQL: Find the Second Highest Distinct Salary',
      statement: 'Write or choose the correct SQL statement that returns the second highest distinct salary from the Employee table. If no second highest salary exists, return NULL.',
      category: 'Core CS',
      subject: 'SQL',
      topic: 'SQL Queries',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1',
        'SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)',
        'SELECT salary FROM Employee WHERE salary != MAX(salary)',
        'SELECT TOP 2 salary FROM Employee ORDER BY salary ASC'
      ],
      correctAnswer: 1,
      explanation: 'Using SELECT MAX(salary) WHERE salary < (SELECT MAX(salary)) cleanly handles duplicate maximums and returns NULL when fewer than 2 distinct salaries exist.',
      examples: 'Employee table: id=1 salary=100, id=2 salary=200, id=3 salary=300 -> Result: 200',
      constraints: 'Table has columns (id INT, salary INT).',
      companies: [companyMap.get('accenture')._id, companyMap.get('deloitte')._id, companyMap.get('tcs')._id],
      roles: ['Full Stack Developer', 'Analyst'],
      estimatedTimeMinutes: 12
    },
    {
      title: 'CPU Scheduling: Starvation Risk',
      statement: 'Which operating system CPU scheduling algorithm can lead to indefinite starvation of low-priority processes when higher-priority processes arrive continuously?',
      category: 'Core CS',
      subject: 'Operating Systems',
      topic: 'Process Scheduling',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Round Robin with 10ms quantum',
        'Priority Scheduling (Preemptive / Non-preemptive)',
        'First-Come, First-Served (FCFS)',
        'FIFO Paging'
      ],
      correctAnswer: 1,
      explanation: 'In Priority Scheduling, high-priority processes can monopolize the CPU. Aging (gradually increasing the priority of waiting processes) is the classic solution.',
      examples: 'A process with priority 10 waits indefinitely because priority 1 processes keep being queued.',
      constraints: 'Single CPU system.',
      companies: [companyMap.get('google')._id, companyMap.get('microsoft')._id, companyMap.get('infosys')._id],
      roles: ['Software Engineer', 'Associate Software Engineer'],
      estimatedTimeMinutes: 10
    },
    {
      title: 'Quantitative Aptitude: Train Pacing & Relative Velocity',
      statement: 'A train 150 meters long is traveling at a speed of 54 km/h. How many seconds will it take to completely pass an electric pole standing beside the track?',
      category: 'Aptitude',
      subject: 'Aptitude',
      topic: 'Quantitative',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        '8 seconds',
        '10 seconds',
        '12 seconds',
        '15 seconds'
      ],
      correctAnswer: 1,
      explanation: 'Convert 54 km/h to m/s: 54 * (5/18) = 15 m/s. To pass a stationary pole, the train must cover its own length: Time = Distance / Speed = 150 / 15 = 10 seconds.',
      examples: 'Speed in m/s = Speed in km/h * 5/18.',
      constraints: 'Standard campus aptitude screening format.',
      companies: [companyMap.get('tcs')._id, companyMap.get('accenture')._id, companyMap.get('deloitte')._id],
      roles: ['Associate Software Engineer', 'Ninja Profile'],
      estimatedTimeMinutes: 5
    },
    {
      title: 'SQL: Filtering Aggregated Group Results',
      statement: 'Which clause must be used in standard SQL to filter grouped rows based on an aggregate condition like COUNT() or AVG()?',
      category: 'Core CS',
      subject: 'SQL',
      topic: 'SQL Queries',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'WHERE',
        'HAVING',
        'GROUP BY',
        'QUALIFY'
      ],
      correctAnswer: 1,
      explanation: 'The WHERE clause filters individual rows before aggregation occurs. The HAVING clause filters groups after the GROUP BY clause has aggregated them.',
      examples: 'SELECT department_id, COUNT(*) FROM Employee GROUP BY department_id HAVING COUNT(*) > 5;',
      constraints: 'ANSI SQL standard.',
      companies: [companyMap.get('accenture')._id, companyMap.get('deloitte')._id],
      roles: ['Full Stack Developer', 'Analyst'],
      estimatedTimeMinutes: 8
    },
    {
      title: 'Object-Oriented Programming: Encapsulation',
      statement: 'Which core OOP concept hides the internal implementation details and data representation of an object while exposing a well-defined public interface?',
      category: 'Core CS',
      subject: 'OOP',
      topic: 'OOP Concepts',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Inheritance',
        'Encapsulation',
        'Polymorphism',
        'Dynamic Binding'
      ],
      correctAnswer: 1,
      explanation: 'Encapsulation binds data together with the functions that manipulate that data, restricting direct access from outside code via private variables and public getters/setters.',
      examples: 'Class BankAccount with private balance variable and public deposit()/withdraw() methods.',
      constraints: 'Java, C++, TypeScript, C#.',
      companies: [companyMap.get('infosys')._id, companyMap.get('tcs')._id, companyMap.get('microsoft')._id],
      roles: ['Software Engineer', 'Systems Engineer'],
      estimatedTimeMinutes: 5
    },
    {
      title: 'Detect Cycle in Directed Graph',
      statement: 'Which graph traversal approach can reliably detect a cycle in a directed graph with O(V + E) time complexity?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Graphs',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Simple Breadth-First Search with a visited boolean array',
        'Depth-First Search with recursion call-stack tracking (3-color state / visiting array)',
        'Dijkstra Shortest Path algorithm',
        'Prim Minimal Spanning Tree algorithm'
      ],
      correctAnswer: 1,
      explanation: 'In a directed graph, a cycle occurs if and only if a back edge is encountered during DFS. This is detected using a recursion stack boolean array or 3 colors (unvisited, visiting, visited).',
      examples: 'If a node is currently in the active recursion call stack (visiting) and is reached again, a cycle exists.',
      constraints: 'Graph represented as adjacency list.',
      companies: [companyMap.get('google')._id, companyMap.get('amazon')._id],
      roles: ['Software Engineer'],
      estimatedTimeMinutes: 25
    },
    {
      title: 'Behavioral: Resolving Disagreements on Technical Architecture',
      statement: 'Describe a situation where a teammate disagreed with your proposed architectural design. How did you handle the discussion and reach consensus?',
      category: 'HR',
      subject: 'Interview',
      topic: 'Behavioral & Leadership',
      difficulty: 'Medium',
      questionType: 'descriptive',
      options: [],
      correctAnswer: 'Structured STAR response highlighting active listening, empirical benchmarks, and shared team priorities.',
      explanation: 'Use the STAR technique (Situation, Task, Action, Result). State the technical disagreement objectively, describe how you benchmarked trade-offs or built a small proof-of-concept, and show that you put the project outcome above ego.',
      examples: 'Example: Choosing between PostgreSQL and MongoDB for an audit logging feature.',
      constraints: 'Target length: 150 - 250 words.',
      companies: [companyMap.get('google')._id, companyMap.get('amazon')._id, companyMap.get('accenture')._id],
      roles: ['Software Engineer', 'Full Stack Developer'],
      estimatedTimeMinutes: 15
    }
  ]

  const seededQuestions = await Question.insertMany(questionsData)
  console.log(`[Seed] Seeded ${seededQuestions.length} questions.`)

  // 4. Seed Mock Tests
  const testsData = [
    {
      title: 'Google · Software Engineer Readiness Test',
      description: 'Comprehensive 45-minute technical assessment covering high-frequency algorithmic problem solving, DBMS transactions, OS process scheduling and graph cycles.',
      company: companyMap.get('google')._id,
      role: 'Software Engineer',
      category: 'Diagnostic Assessment',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [
        seededQuestions[0]._id, // Longest consecutive
        seededQuestions[1]._id, // LRU Cache
        seededQuestions[4]._id, // CPU Starvation
        seededQuestions[8]._id, // Cycle in graph
        seededQuestions[2]._id, // ACID Atomicity
        seededQuestions[7]._id  // OOP Encapsulation
      ],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },
    {
      title: 'Accenture · Full Stack Diagnostic Assessment',
      description: 'Role-aligned diagnostic covering JavaScript/TypeScript, SQL queries, database transactions and core aptitude fundamentals.',
      company: companyMap.get('accenture')._id,
      role: 'Full Stack Developer',
      category: 'Role Benchmark',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [
        seededQuestions[2]._id, // ACID Atomicity
        seededQuestions[3]._id, // Second highest salary
        seededQuestions[5]._id, // Train pacing
        seededQuestions[6]._id, // HAVING clause
        seededQuestions[7]._id  // OOP Encapsulation
      ],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Core CS Checkpoint: DBMS, SQL & Operating Systems',
      description: 'Focused assessment on academic computer science fundamentals frequently tested in campus interviews.',
      company: companyMap.get('microsoft')._id,
      role: 'Software Engineer',
      category: 'Subject Drill',
      difficulty: 'Intermediate',
      durationMinutes: 25,
      questions: [
        seededQuestions[2]._id,
        seededQuestions[3]._id,
        seededQuestions[4]._id,
        seededQuestions[6]._id,
        seededQuestions[7]._id
      ],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Quantitative & Analytical Aptitude Sprint',
      description: 'Timed speed test simulating campus placement screening assessments.',
      company: companyMap.get('tcs')._id,
      role: 'Digital Profile',
      category: 'Aptitude',
      difficulty: 'Foundation',
      durationMinutes: 20,
      questions: [
        seededQuestions[5]._id,
        seededQuestions[2]._id,
        seededQuestions[7]._id
      ],
      marksPerQuestion: 5,
      negativeMarking: 1,
      totalMarks: 15,
      isPublished: true
    }
  ]

  const seededTests = await Test.insertMany(testsData)
  console.log(`[Seed] Seeded ${seededTests.length} mock tests.`)

  // 5. Seed Demo Users
  const studentUser = new User({
    name: 'Arjun Sharma',
    email: 'student@hireverse.dev',
    password: 'Student@123',
    role: 'student',
    college: 'Apex Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Engineering',
    graduationYear: 2026,
    cgpa: 8.4,
    skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'DBMS', 'DSA', 'Git & GitHub', 'Aptitude'],
    targetRoles: ['Full Stack Developer', 'Software Engineer'],
    targetCompany: companyMap.get('accenture')._id,
    currentTargetRole: 'Full Stack Developer',
    completedTopics: ['apti-quantitative', 'dsa-arrays-strings'],
    targetProgress: [
      {
        company: companyMap.get('accenture')._id,
        role: 'Full Stack Developer',
        completedTopics: ['apti-quantitative', 'dsa-arrays-strings']
      }
    ],
    status: 'active'
  })
  await studentUser.save()

  const officerUser = new User({
    name: 'Dr. Sunita Rao',
    email: 'placement@hireverse.dev',
    password: 'Officer@123',
    role: 'placement_officer',
    college: 'Apex Institute of Technology',
    degree: 'Ph.D. in Computer Science',
    branch: 'Training & Placement Cell',
    graduationYear: 2010,
    cgpa: 9.2,
    status: 'active'
  })
  await officerUser.save()

  const facultyUser = new User({
    name: 'Prof. Ramesh Gupta',
    email: 'faculty@hireverse.dev',
    password: 'Faculty@123',
    role: 'faculty',
    college: 'Apex Institute of Technology',
    degree: 'M.Tech',
    branch: 'Computer Engineering',
    graduationYear: 2012,
    cgpa: 8.8,
    status: 'active'
  })
  await facultyUser.save()

  const adminUser = new User({
    name: 'HireVerse System Administrator',
    email: 'admin@hireverse.dev',
    password: 'Admin@123',
    role: 'admin',
    college: 'HireVerse Central Platform',
    degree: 'Engineering Administration',
    branch: 'Systems Architecture',
    graduationYear: 2020,
    cgpa: 9.5,
    status: 'active'
  })
  await adminUser.save()

  console.log('[Seed] Seeded 4 demo accounts (student, placement_officer, faculty, admin).')

  // 6. Seed Practice Attempts for Arjun Sharma
  await PracticeAttempt.create([
    {
      user: studentUser._id,
      question: seededQuestions[0]._id, // Longest consecutive
      submittedAnswer: 1,
      isCorrect: true,
      notes: 'Used HashSet approach to ensure O(n) linear scan.',
      status: 'solved',
      timeTakenSeconds: 980
    },
    {
      user: studentUser._id,
      question: seededQuestions[2]._id, // ACID Atomicity
      submittedAnswer: 2,
      isCorrect: true,
      notes: 'Atomicity ensures all-or-nothing execution.',
      status: 'solved',
      timeTakenSeconds: 320
    },
    {
      user: studentUser._id,
      question: seededQuestions[3]._id, // Second highest salary
      submittedAnswer: 1,
      isCorrect: true,
      notes: 'Subquery with MAX handles duplicates.',
      status: 'solved',
      timeTakenSeconds: 410
    },
    {
      user: studentUser._id,
      question: seededQuestions[4]._id, // CPU Starvation
      submittedAnswer: 1,
      isCorrect: true,
      notes: 'Priority scheduling without aging causes indefinite starvation.',
      status: 'solved',
      timeTakenSeconds: 280
    },
    {
      user: studentUser._id,
      question: seededQuestions[5]._id, // Train pacing
      submittedAnswer: 1,
      isCorrect: true,
      notes: '150m / 15m/s = 10s',
      status: 'solved',
      timeTakenSeconds: 190
    },
    {
      user: studentUser._id,
      question: seededQuestions[8]._id, // Cycle in graph
      submittedAnswer: 0,
      isCorrect: false,
      notes: 'Need to review cycle detection with recursion stack colors.',
      status: 'attempted',
      timeTakenSeconds: 850
    }
  ])

  // 7. Seed Completed Mock Test Attempt for Arjun Sharma
  const test1 = seededTests[0]
  await TestAttempt.create({
    user: studentUser._id,
    test: test1._id,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    durationMinutes: test1.durationMinutes,
    expiryTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 38 * 60 * 1000),
    status: 'completed',
    answers: [
      { questionId: seededQuestions[0]._id, selectedOption: 1, markedForReview: false },
      { questionId: seededQuestions[1]._id, selectedOption: 1, markedForReview: false },
      { questionId: seededQuestions[4]._id, selectedOption: 1, markedForReview: false },
      { questionId: seededQuestions[8]._id, selectedOption: 0, markedForReview: true },
      { questionId: seededQuestions[2]._id, selectedOption: 2, markedForReview: false },
      { questionId: seededQuestions[7]._id, selectedOption: 1, markedForReview: false }
    ],
    result: {
      score: 19,
      maxScore: 24,
      percentage: 79,
      correctCount: 5,
      incorrectCount: 1,
      unansweredCount: 0,
      timeTakenSeconds: 2280,
      subjectBreakdown: [
        { subject: 'DSA', totalQuestions: 3, correctQuestions: 2, score: 7, percentage: 67 },
        { subject: 'Core CS', totalQuestions: 3, correctQuestions: 3, score: 12, percentage: 100 }
      ],
      weakTopics: ['Graphs']
    }
  })

  // 8. Seed Saved Bookmark
  await SavedQuestion.create({
    user: studentUser._id,
    question: seededQuestions[1]._id,
    notes: 'Revise LRU Cache before Amazon and Google rounds.'
  })

  // 9. Seed Student Roadmap organized by Accenture's verified interview rounds
  await Roadmap.create({
    user: studentUser._id,
    company: companyMap.get('accenture')._id,
    role: 'Full Stack Developer',
    availableWeeks: 8,
    targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
    progressPercentage: 20,
    phases: [
      {
        phaseNumber: 1,
        roundNumber: 1,
        roundType: 'Online Assessment',
        title: 'Round 1: Cognitive & Technical Assessment',
        subtitle: 'Analytical, verbal reasoning and pseudocode test',
        tasks: [
          {
            taskId: 'apti-quantitative',
            topicId: 'apti-quantitative',
            title: 'Quantitative Aptitude: Time, Work & Percentages',
            subject: 'Aptitude',
            topic: 'apti-quantitative',
            detail: 'Frequently tested in campus online assessments. Covers work equivalences, speed-distance-time, percentages, and profit & loss.',
            priority: 'High',
            estimatedMinutes: 45,
            completed: true,
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            taskId: 'apti-logical-reasoning',
            topicId: 'apti-logical-reasoning',
            title: 'Logical Reasoning: Blood Relations, Coding-Decoding & Puzzles',
            subject: 'Aptitude',
            topic: 'apti-logical-reasoning',
            detail: 'Critical screening section for Accenture, TCS NQT, Infosys, and Deloitte rounds.',
            priority: 'High',
            estimatedMinutes: 40,
            completed: false
          },
          {
            taskId: 'apti-verbal-ability',
            topicId: 'apti-verbal-ability',
            title: 'Verbal Ability: Sentence Correction & Comprehension',
            subject: 'Aptitude',
            topic: 'apti-verbal-ability',
            detail: 'Grammar rules, sentence completion, para jumbles, and reading comprehension.',
            priority: 'Medium',
            estimatedMinutes: 30,
            completed: false
          }
        ]
      },
      {
        phaseNumber: 2,
        roundNumber: 2,
        roundType: 'Online Assessment',
        title: 'Round 2: Coding Assessment',
        subtitle: '2 algorithmic questions in 45 minutes',
        tasks: [
          {
            taskId: 'dsa-arrays-strings',
            topicId: 'dsa-arrays-strings',
            title: 'Arrays & Strings: Two-Pointer & Sliding Window',
            subject: 'DSA',
            topic: 'dsa-arrays-strings',
            detail: 'Core algorithmic patterns: two-pointers, sliding window, prefix sums, and frequency hashmaps.',
            priority: 'High',
            estimatedMinutes: 60,
            completed: true,
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            taskId: 'dsa-linked-lists',
            topicId: 'dsa-linked-lists',
            title: 'Linked Lists: Cycle Detection & Reversals',
            subject: 'DSA',
            topic: 'dsa-linked-lists',
            detail: 'Singly and doubly linked lists, Floyd fast/slow cycle detection, reversing sublists, and merge operations.',
            priority: 'Medium',
            estimatedMinutes: 45,
            completed: false
          }
        ]
      },
      {
        phaseNumber: 3,
        roundNumber: 3,
        roundType: 'Online Assessment',
        title: 'Round 3: Communication Assessment',
        subtitle: 'Interactive verbal fluency and listening test',
        tasks: [
          {
            taskId: 'apti-verbal-ability',
            topicId: 'apti-verbal-ability',
            title: 'Verbal Fluency & Listening Comprehension',
            subject: 'Aptitude',
            topic: 'apti-verbal-ability',
            detail: 'Verbal fluency, pronunciation, and listening comprehension drills.',
            priority: 'Medium',
            estimatedMinutes: 30,
            completed: false
          }
        ]
      },
      {
        phaseNumber: 4,
        roundNumber: 4,
        roundType: 'HR Interview',
        title: 'Round 4: Technical & HR Discussion',
        subtitle: 'Final-year project review, web frameworks and adaptability',
        tasks: [
          {
            taskId: 'core-dbms-sql',
            topicId: 'core-dbms-sql',
            title: 'DBMS: Transactions, ACID Properties & SQL Queries',
            subject: 'Core CS',
            topic: 'core-dbms-sql',
            detail: 'ACID transaction management, isolation levels, Normalization (1NF to BCNF), and SQL joins.',
            priority: 'High',
            estimatedMinutes: 45,
            completed: false
          },
          {
            taskId: 'core-oop',
            topicId: 'core-oop',
            title: 'Object-Oriented Programming (OOP) & Design Principles',
            subject: 'Core CS',
            topic: 'core-oop',
            detail: 'The 4 pillars (Encapsulation, Abstraction, Inheritance, Polymorphism), and SOLID principles.',
            priority: 'High',
            estimatedMinutes: 40,
            completed: false
          },
          {
            taskId: 'web-javascript-react',
            topicId: 'web-javascript-react',
            title: 'Modern JavaScript & React.js Frontend Architecture',
            subject: 'Web & Technical',
            topic: 'web-javascript-react',
            detail: 'ES6+ syntax, asynchronous programming, React hooks, and component lifecycle.',
            priority: 'High',
            estimatedMinutes: 50,
            completed: false
          },
          {
            taskId: 'web-backend-apis',
            topicId: 'web-backend-apis',
            title: 'Backend Engineering: Node.js, Express & RESTful APIs',
            subject: 'Web & Technical',
            topic: 'web-backend-apis',
            detail: 'Express routing, middleware architecture, JWT authentication, and database integration.',
            priority: 'High',
            estimatedMinutes: 50,
            completed: false
          },
          {
            taskId: 'hr-star-framework',
            topicId: 'hr-star-framework',
            title: 'HR & Behavioral: STAR Method & Project Walkthrough',
            subject: 'HR & Behavioral',
            topic: 'hr-star-framework',
            detail: 'Structure interview answers using Situation, Task, Action, Result. Prepare project walkthroughs.',
            priority: 'Medium',
            estimatedMinutes: 30,
            completed: false
          }
        ]
      }
    ]
  })

  // 10. Seed Placement Drives
  const drivesData = [
    {
      company: companyMap.get('google')._id,
      title: 'Google Campus Software Engineering Drive 2026',
      roles: ['Software Engineer', 'Site Reliability Engineer'],
      packageLpa: '22 - 32 LPA',
      driveDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      venue: 'Main Auditorium & Virtual Coding Sandbox',
      eligibility: { minCgpa: 8.0, branches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      status: 'upcoming',
      description: 'Campus hiring drive for graduating 2026 engineering students. Shortlisting based on online coding assessment and technical interviews.'
    },
    {
      company: companyMap.get('accenture')._id,
      title: 'Accenture Advanced Technology Delivery Hiring',
      roles: ['Full Stack Developer', 'Associate Software Engineer'],
      packageLpa: '8 - 12 LPA',
      driveDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      venue: 'Placement Cell Hall B',
      eligibility: { minCgpa: 6.5, branches: ['Computer Engineering', 'Information Technology', 'Electronics & Comm'], graduationYears: [2026] },
      status: 'upcoming',
      description: 'Hiring drive for cloud platforms, web engineering, and enterprise architecture.'
    },
    {
      company: companyMap.get('microsoft')._id,
      title: 'Microsoft India Campus Engagement Program',
      roles: ['Software Engineer'],
      packageLpa: '18 - 26 LPA',
      driveDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      venue: 'Virtual Platform (Codility + Teams)',
      eligibility: { minCgpa: 7.5, branches: ['Computer Engineering', 'Information Technology'], graduationYears: [2026] },
      status: 'upcoming',
      description: 'Campus hiring for Microsoft Cloud & AI engineering teams.'
    },
    {
      company: companyMap.get('tcs')._id,
      title: 'TCS National Qualifier Test (NQT) Campus Cycle',
      roles: ['Digital Profile', 'Prime Profile'],
      packageLpa: '7 - 10 LPA',
      driveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      venue: 'Online Proctored Center',
      eligibility: { minCgpa: 6.0, branches: ['Computer Engineering', 'Information Technology', 'Electronics & Comm'], graduationYears: [2026] },
      status: 'ongoing',
      description: 'National Qualifier Test for all eligible final-year engineering students.'
    }
  ]
  await PlacementDrive.insertMany(drivesData)
  console.log(`[Seed] Seeded ${drivesData.length} placement drives.`)

  // 11. Seed Announcements
  const announcementsData = [
    {
      title: 'Google & Microsoft Campus Registration Windows Now Open',
      content: 'Final-year students meeting the minimum CGPA eligibility must verify their profile details and target company preferences before the deadline.',
      category: 'Placement Drive',
      priority: 'high',
      targetAudience: 'final_year',
      author: officerUser._id,
      authorName: 'Dr. Sunita Rao (Placement Cell)'
    },
    {
      title: 'Full-Length Diagnostic Mock Test Scheduled for Saturday',
      content: 'All registered students are advised to attempt the full-length company readiness mock test to calibrate their subject strengths and identify weak topics.',
      category: 'Mock Test',
      priority: 'medium',
      targetAudience: 'all',
      author: facultyUser._id,
      authorName: 'Prof. Ramesh Gupta'
    },
    {
      title: 'Technical Resume & Project Walkthrough Guidelines',
      content: 'Please ensure your resume includes measurable metrics on your software projects (e.g. latency reductions, queries optimized) and direct links to public repositories.',
      category: 'General',
      priority: 'medium',
      targetAudience: 'students',
      author: officerUser._id,
      authorName: 'Placement Office'
    }
  ]
  await Announcement.insertMany(announcementsData)
  console.log(`[Seed] Seeded ${announcementsData.length} announcements.`)

  // 12. Seed Activity Logs for Arjun Sharma (to give realistic activity trends and streak)
  const activities = [
    { user: studentUser._id, activityType: 'login', title: 'Signed in to HireVerse', subject: 'Account', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'practice_solve', title: 'Solved Longest Consecutive Sequence in Unsorted Array', subject: 'DSA', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'roadmap_task', title: 'Completed milestone: Arrays & Two-Pointer Patterns', subject: 'DSA', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'practice_solve', title: 'Solved ACID Properties in Transactions', subject: 'DBMS', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'mock_test_complete', title: 'Completed Google · Software Engineer Readiness Test (Score: 79%)', subject: 'Mock Test', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'practice_solve', title: 'Solved Quantitative Aptitude: Train Pacing', subject: 'Aptitude', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { user: studentUser._id, activityType: 'target_change', title: 'Set active target to Accenture · Full Stack Developer', subject: 'Target', createdAt: new Date() }
  ]
  await ActivityLog.insertMany(activities)
  console.log(`[Seed] Seeded ${activities.length} activity records.`)

  console.log('[Seed] Seeding completed successfully!')
  return {
    studentUser,
    officerUser,
    facultyUser,
    adminUser,
    companiesCount: seededCompanies.length,
    questionsCount: seededQuestions.length,
    testsCount: seededTests.length
  }
}

// Standalone execution wrapper
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  ;(async () => {
    try {
      await connectDB()
      await seedDatabase()
      console.log('✅ Database seeded successfully. Ready for demonstration!')
      process.exit(0)
    } catch (err) {
      console.error('❌ Seeding failed:', err)
      process.exit(1)
    }
  })()
}
