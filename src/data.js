export const companies = [
  { id: 'accenture', name: 'Accenture', mark: '>', color: '#a100ff', difficulty: 'Intermediate', roles: ['Full Stack Developer', 'Associate Software Engineer'], readiness: 68, rounds: ['Online assessment', 'Technical interview', 'HR discussion'], skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'DBMS', 'DSA', 'Git & GitHub', 'Aptitude', 'Communication'], description: 'Technology delivery roles that combine full-stack development, problem solving and clear communication.' },
  { id: 'google', name: 'Google', mark: 'G', color: '#4285f4', difficulty: 'Advanced', roles: ['Software Engineer', 'Frontend Engineer'], readiness: 72, rounds: ['Online assessment', 'Technical interview', 'Googliness & leadership'], skills: ['DSA', 'System Design', 'DBMS', 'OS', 'JavaScript'], description: 'Product engineering roles with strong problem-solving and system-design focus.' },
  { id: 'microsoft', name: 'Microsoft', mark: 'M', color: '#1574d1', difficulty: 'Advanced', roles: ['Software Engineer', 'Support Engineer'], readiness: 68, rounds: ['Online assessment', 'Technical rounds', 'HR discussion'], skills: ['DSA', 'OOP', 'DBMS', 'Cloud basics', 'React'], description: 'Engineering roles focused on coding fundamentals and collaboration.' },
  { id: 'amazon', name: 'Amazon', mark: 'a', color: '#111827', difficulty: 'Advanced', roles: ['Software Development Engineer', 'QA Engineer'], readiness: 61, rounds: ['Online assessment', 'Technical interview', 'Bar raiser'], skills: ['DSA', 'Leadership Principles', 'OS', 'SQL', 'System Design'], description: 'High-ownership engineering roles with rigorous coding interviews.' },
  { id: 'tcs', name: 'TCS', mark: 't', color: '#1769aa', difficulty: 'Foundation', roles: ['Digital Profile', 'Ninja Profile'], readiness: 81, rounds: ['TCS NQT', 'Technical interview', 'HR interview'], skills: ['Aptitude', 'DSA', 'OOP', 'SQL', 'Communication'], description: 'Campus hiring tracks across digital engineering and IT services.' },
  { id: 'infosys', name: 'Infosys', mark: 'i', color: '#007cc3', difficulty: 'Foundation', roles: ['Systems Engineer', 'Specialist Programmer'], readiness: 76, rounds: ['Online test', 'Technical interview', 'HR interview'], skills: ['Aptitude', 'Java', 'DBMS', 'OS', 'OOP'], description: 'Campus roles with strong emphasis on aptitude and CS fundamentals.' },
  { id: 'deloitte', name: 'Deloitte', mark: 'D', color: '#86bc25', difficulty: 'Intermediate', roles: ['Analyst', 'Technology Consultant'], readiness: 70, rounds: ['Aptitude test', 'Case / technical round', 'HR interview'], skills: ['Aptitude', 'SQL', 'Communication', 'OOP', 'Problem solving'], description: 'Technology consulting roles combining analytical and communication skills.' },
]

export const readinessSkills = [
  { name: 'DSA', score: 68, status: 'needs work' },
  { name: 'Core CS', score: 74, status: 'on track' },
  { name: 'Aptitude', score: 81, status: 'strong' },
  { name: 'Coding', score: 76, status: 'on track' },
  { name: 'Interview', score: 62, status: 'needs work' },
  { name: 'Resume', score: 78, status: 'on track' },
]

export const todayPlan = [
  { id: 'arrays', title: 'Arrays & Strings: sliding-window patterns', subject: 'DSA', duration: '45 min', priority: 'High' },
  { id: 'dbms', title: 'DBMS: transactions and ACID properties', subject: 'Core CS', duration: '30 min', priority: 'Medium' },
  { id: 'aptitude', title: 'Complete 20 quantitative aptitude questions', subject: 'Aptitude', duration: '25 min', priority: 'Medium' },
  { id: 'interview', title: 'Practice one technical interview answer', subject: 'Interview', duration: '20 min', priority: 'High' },
]

export const roadmapPhases = [
  { title: 'Phase 1 · Programming foundations', subtitle: 'Build fluency before advanced patterns', items: [
    { id: 'array-basics', title: 'Arrays and strings', detail: '12 / 12 problems', time: 'Completed', difficulty: 'Foundation', done: true },
    { id: 'recursion', title: 'Recursion and backtracking', detail: '8 / 10 problems', time: '40 min left', difficulty: 'Intermediate', done: false },
  ] },
  { title: 'Phase 2 · Data structures', subtitle: 'Targeted for your selected company', items: [
    { id: 'linked-list', title: 'Linked lists', detail: '10 / 10 problems', time: 'Completed', difficulty: 'Foundation', done: true },
    { id: 'trees', title: 'Trees and BST', detail: '7 / 14 problems', time: '1 hr 20 min', difficulty: 'Intermediate', done: false },
    { id: 'graphs', title: 'Graphs', detail: '3 / 12 problems', time: '2 hr 10 min', difficulty: 'Advanced', done: false },
  ] },
  { title: 'Phase 3 · Core CS', subtitle: 'Frequently tested technical fundamentals', items: [
    { id: 'dbms-roadmap', title: 'DBMS and SQL', detail: '4 / 8 lessons', time: '1 hr 40 min', difficulty: 'Intermediate', done: false },
    { id: 'os-roadmap', title: 'Operating systems', detail: '2 / 8 lessons', time: '2 hr 25 min', difficulty: 'Intermediate', done: false },
    { id: 'cn-roadmap', title: 'Computer networks', detail: '0 / 7 lessons', time: '2 hr 10 min', difficulty: 'Intermediate', done: false },
  ] },
  { title: 'Phase 4 · Interview preparation', subtitle: 'Make your knowledge interview-ready', items: [
    { id: 'technical-interview', title: 'Technical interview drills', detail: '1 / 5 sessions', time: '1 hr 45 min', difficulty: 'Advanced', done: false },
    { id: 'behavioral-interview', title: 'Behavioural interview stories', detail: '0 / 4 stories', time: '55 min', difficulty: 'Foundation', done: false },
  ] },
]

export const questions = [
  { id: 1, title: 'Longest consecutive sequence', subject: 'DSA', topic: 'Arrays', difficulty: 'Medium', company: 'Google', time: '25 min', statement: 'Given an unsorted array of integers, return the length of the longest sequence of consecutive elements. Your solution should run in O(n) time.', examples: 'Input: [100, 4, 200, 1, 3, 2]\nOutput: 4  // sequence is [1, 2, 3, 4]' },
  { id: 2, title: 'Design a URL shortener', subject: 'System Design', topic: 'Design', difficulty: 'Hard', company: 'Google', time: '40 min', statement: 'Design a service that creates short aliases for long URLs. Explain the data model, API contract, scaling approach and collision strategy.', examples: 'Focus on API design, key generation, redirects, reliability and analytics.' },
  { id: 3, title: 'Find the second-largest salary', subject: 'DBMS', topic: 'SQL', difficulty: 'Easy', company: 'TCS', time: '12 min', statement: 'Write a SQL query that returns the second-highest distinct salary from an Employee table.', examples: 'Table: Employee(id, name, salary)\nReturn NULL if no second salary exists.' },
  { id: 4, title: 'LRU cache implementation', subject: 'DSA', topic: 'Hashing', difficulty: 'Hard', company: 'Amazon', time: '35 min', statement: 'Implement an LRU cache with get and put operations in O(1) time complexity.', examples: 'Use a hash map and a doubly linked list.' },
  { id: 5, title: 'ACID properties in transactions', subject: 'Core CS', topic: 'DBMS', difficulty: 'Easy', company: 'Infosys', time: '10 min', statement: 'Explain Atomicity, Consistency, Isolation and Durability with one practical database example.', examples: 'Answer in structured points. Include why isolation matters.' },
]

export const mockQuestions = [
  { id: 1, subject: 'DSA', question: 'Which data structure is best suited to implement an LRU cache with O(1) operations?', options: ['Stack and queue', 'Hash map and doubly linked list', 'Binary search tree', 'Heap and array'], answer: 1 },
  { id: 2, subject: 'DBMS', question: 'Which ACID property ensures that a transaction is all-or-nothing?', options: ['Consistency', 'Isolation', 'Atomicity', 'Durability'], answer: 2 },
  { id: 3, subject: 'OS', question: 'Which scheduling algorithm can cause starvation?', options: ['Round Robin', 'Priority scheduling', 'FCFS', 'FIFO paging'], answer: 1 },
  { id: 4, subject: 'Aptitude', question: 'A train travels 120 km in 2 hours. What is its average speed?', options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'], answer: 2 },
  { id: 5, subject: 'OOP', question: 'Which concept hides internal implementation details from a user?', options: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Overloading'], answer: 1 },
  { id: 6, subject: 'SQL', question: 'Which clause filters grouped results in SQL?', options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'], answer: 1 },
]

export const assistantSources = [
  { title: 'Google careers · interview process', note: 'Company preparation library' },
  { title: 'Google SWE preparation roadmap', note: 'HireVerse curated guide' },
  { title: 'Your DBMS practice results', note: 'Student progress data' },
]
