import { Question } from '../models/Question.js'
import { Test } from '../models/Test.js'
import { Company } from '../models/Company.js'

/**
 * Returns the comprehensive categorized question bank covering DSA, Core CS, Aptitude, Technical, and HR.
 */
export function getQuestionsData(companyMap) {
  const getCoId = (code) => companyMap.get(code)?._id || null

  return [
    // 0: Longest Consecutive Sequence in Unsorted Array
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
      companies: [getCoId('google'), getCoId('amazon')].filter(Boolean),
      roles: ['Software Engineer', 'Full Stack Developer', 'Prime Profile'],
      estimatedTimeMinutes: 20
    },
    // 1: LRU Cache Design & Data Structure
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
      companies: [getCoId('google'), getCoId('amazon'), getCoId('microsoft')].filter(Boolean),
      roles: ['Software Engineer', 'Software Development Engineer', 'Specialist Programmer'],
      estimatedTimeMinutes: 30
    },
    // 2: ACID Properties: Ensuring Atomicity in Transactions
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
      companies: [getCoId('accenture'), getCoId('infosys'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Full Stack Developer', 'Systems Engineer', 'Software Engineer'],
      estimatedTimeMinutes: 10
    },
    // 3: SQL: Find the Second Highest Distinct Salary
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
      companies: [getCoId('accenture'), getCoId('deloitte'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Full Stack Developer', 'Analyst', 'Data Engineer'],
      estimatedTimeMinutes: 12
    },
    // 4: CPU Scheduling: Starvation Risk
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
      companies: [getCoId('google'), getCoId('microsoft'), getCoId('infosys')].filter(Boolean),
      roles: ['Software Engineer', 'Associate Software Engineer'],
      estimatedTimeMinutes: 10
    },
    // 5: Quantitative Aptitude: Train Pacing & Relative Velocity
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
      companies: [getCoId('tcs'), getCoId('accenture'), getCoId('deloitte')].filter(Boolean),
      roles: ['Associate Software Engineer', 'Ninja Profile', 'Full Stack Developer'],
      estimatedTimeMinutes: 5
    },
    // 6: SQL: Filtering Aggregated Group Results
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
      companies: [getCoId('accenture'), getCoId('deloitte'), getCoId('microsoft')].filter(Boolean),
      roles: ['Full Stack Developer', 'Analyst', 'Technology Consultant'],
      estimatedTimeMinutes: 8
    },
    // 7: Object-Oriented Programming: Encapsulation
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
      companies: [getCoId('infosys'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Software Engineer', 'Systems Engineer'],
      estimatedTimeMinutes: 5
    },
    // 8: Detect Cycle in Directed Graph
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
      companies: [getCoId('google'), getCoId('amazon')].filter(Boolean),
      roles: ['Software Engineer', 'Specialist Programmer'],
      estimatedTimeMinutes: 25
    },
    // 9: Behavioral: Resolving Disagreements on Technical Architecture
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
      companies: [getCoId('google'), getCoId('amazon'), getCoId('accenture')].filter(Boolean),
      roles: ['Software Engineer', 'Full Stack Developer', 'Technology Consultant'],
      estimatedTimeMinutes: 15
    },

    // 10: Logical Reasoning: Syllogism & Deductive Logic
    {
      title: 'Logical Reasoning: Syllogism & Deductive Logic',
      statement: 'Statements: All developers are problem solvers. Some problem solvers are architects. Conclusions: I. Some developers are architects. II. All architects are problem solvers. Which conclusion logically follows?',
      category: 'Aptitude',
      subject: 'Aptitude',
      topic: 'Logical Reasoning',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Neither conclusion I nor II follows',
        'Only conclusion I follows',
        'Only conclusion II follows',
        'Both conclusions I and II follow'
      ],
      correctAnswer: 0,
      explanation: 'From the given premises, the intersection between developers and architects is not guaranteed, and "some problem solvers are architects" does not imply that ALL architects are problem solvers.',
      examples: 'Standard Syllogism rule: Particular affirmative premise ("Some") cannot produce universal conclusion ("All").',
      constraints: 'Standard categorical logic format.',
      companies: [getCoId('tcs'), getCoId('accenture'), getCoId('deloitte'), getCoId('infosys')].filter(Boolean),
      roles: ['Associate Software Engineer', 'Ninja Profile', 'Systems Engineer', 'Analyst'],
      estimatedTimeMinutes: 8
    },
    // 11: Quantitative Aptitude: Work and Time Equivalences
    {
      title: 'Quantitative Aptitude: Work and Time Equivalences',
      statement: 'Person A can complete a software sprint task in 12 days, and Person B can complete it in 18 days. If they work together for 4 days, what fraction of the total task remains unfinished?',
      category: 'Aptitude',
      subject: 'Aptitude',
      topic: 'Quantitative',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        '1/3',
        '4/9',
        '7/18',
        '5/9'
      ],
      correctAnswer: 1,
      explanation: 'Combined daily rate = (1/12) + (1/18) = (3+2)/36 = 5/36 per day. In 4 days, work done = 4 * (5/36) = 20/36 = 5/9. Remaining work = 1 - (5/9) = 4/9.',
      examples: 'Formula: Remaining = 1 - (t * (1/A + 1/B)).',
      constraints: 'Both workers work continuously without pauses.',
      companies: [getCoId('tcs'), getCoId('infosys'), getCoId('deloitte'), getCoId('accenture')].filter(Boolean),
      roles: ['Ninja Profile', 'Systems Engineer', 'Analyst', 'Associate Software Engineer'],
      estimatedTimeMinutes: 6
    },
    // 12: Verbal Ability: Subject-Verb Agreement in Technical Prose
    {
      title: 'Verbal Ability: Subject-Verb Agreement in Technical Prose',
      statement: 'Identify the part of the sentence that contains a grammatical error: "Neither the principal architect (A) nor the backend engineers (B) was able to restore (C) the production database (D)."',
      category: 'Aptitude',
      subject: 'Aptitude',
      topic: 'Verbal Ability',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Neither the principal architect (A)',
        'nor the backend engineers (B)',
        'was able to restore (C)',
        'the production database (D)'
      ],
      correctAnswer: 2,
      explanation: 'In correlative conjunctions ("neither ... nor"), the verb must agree in number with the closer subject. Since "backend engineers" is plural, the correct verb is "were able to restore".',
      examples: 'Neither John nor his teammates were ready.',
      constraints: 'Standard English placement grammar screening.',
      companies: [getCoId('accenture'), getCoId('deloitte'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Associate Software Engineer', 'Analyst', 'Support Engineer'],
      estimatedTimeMinutes: 5
    },
    // 13: Lowest Common Ancestor in Binary Search Tree
    {
      title: 'Lowest Common Ancestor in Binary Search Tree',
      statement: 'In a Binary Search Tree (BST) with distinct values, how can the Lowest Common Ancestor (LCA) of two target nodes p and q be determined in O(h) time?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Trees',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Traverse from root: the first node whose value falls between min(p, q) and max(p, q) inclusive is the LCA',
        'Execute full Level-Order traversal and select the node with the lowest depth',
        'Find the in-order predecessor of node p',
        'Compute the maximum depth of both subtrees and return their arithmetic mean'
      ],
      correctAnswer: 0,
      explanation: 'In a BST, if both p and q are strictly smaller than the current node, the LCA must be in the left subtree. If both are greater, it is in the right subtree. The first node where paths diverge is the LCA.',
      examples: 'Root=6, p=2, q=8 -> 2 < 6 < 8, so LCA is 6.',
      constraints: 'All node values are unique. h is height of BST.',
      companies: [getCoId('amazon'), getCoId('microsoft'), getCoId('tcs')].filter(Boolean),
      roles: ['Software Development Engineer', 'Software Engineer', 'Prime Profile'],
      estimatedTimeMinutes: 18
    },
    // 14: Dynamic Programming: 0/1 Knapsack Recurrence
    {
      title: 'Dynamic Programming: 0/1 Knapsack Recurrence',
      statement: 'In the classic 0/1 Knapsack problem with weights wt[] and values val[], what is the optimal state transition relation for dp[i][w] representing items 0..i-1 and capacity w?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Dynamic Programming',
      difficulty: 'Hard',
      questionType: 'multiple-choice',
      options: [
        'dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - wt[i-1]]) when wt[i-1] <= w',
        'dp[i][w] = dp[i-1][w] + val[i-1] * wt[i-1]',
        'dp[i][w] = min(dp[i-1][w], val[i-1] + dp[i][w - wt[i-1]])',
        'dp[i][w] = max(dp[i][w-1], dp[i-1][w])'
      ],
      correctAnswer: 0,
      explanation: 'For each item i, we decide whether to exclude it (dp[i-1][w]) or include it if capacity permits (val[i-1] + dp[i-1][w - wt[i-1]]). Taking the maximum gives optimal value.',
      examples: 'Standard 2D DP array where items cannot be subdivided or duplicated.',
      constraints: 'Weights and values are positive integers.',
      companies: [getCoId('amazon'), getCoId('infosys'), getCoId('google')].filter(Boolean),
      roles: ['Software Development Engineer', 'Specialist Programmer'],
      estimatedTimeMinutes: 25
    },
    // 15: Sliding Window: Maximum in Continuous Subarray
    {
      title: 'Sliding Window: Maximum in Continuous Subarray',
      statement: 'Which data structure allows maintaining the maximum element of a sliding window of size k in O(n) total amortized time over an array of size n?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Arrays',
      difficulty: 'Hard',
      questionType: 'multiple-choice',
      options: [
        'Monotonic Decreasing Deque storing array indices',
        'Min-heap of size k',
        'Balanced Binary Search Tree storing window values',
        'Circular Singly Linked List'
      ],
      correctAnswer: 0,
      explanation: 'A monotonic double-ended queue maintains indices such that values are strictly descending. Each index is inserted and evicted at most once, yielding O(1) amortized operations per window slide.',
      examples: 'Window of size 3 sliding over [1, 3, -1, -3, 5, 3, 6, 7] -> Output: [3, 3, 5, 5, 6, 7].',
      constraints: '1 <= k <= nums.length <= 10^5.',
      companies: [getCoId('google'), getCoId('infosys')].filter(Boolean),
      roles: ['Frontend Engineer', 'Specialist Programmer', 'Software Engineer'],
      estimatedTimeMinutes: 20
    },
    // 16: Topological Sort: Precondition in Directed Graphs
    {
      title: 'Topological Sort: Precondition in Directed Graphs',
      statement: 'Under which structural condition does a valid Topological Ordering exist for a directed graph?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Graphs',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'The graph must be a Directed Acyclic Graph (DAG)',
        'The graph must be strongly connected with at least one cycle',
        'The graph must have an equal in-degree and out-degree for every vertex',
        'The graph must be a complete bipartite graph'
      ],
      correctAnswer: 0,
      explanation: 'Topological sorting orders vertices linearly such that for every directed edge u -> v, vertex u precedes v. If the graph contains any cycle, no such linear ordering can satisfy all dependencies.',
      examples: 'Task scheduling, build systems (Makefile, npm dependency resolution).',
      constraints: 'Graph represented as adjacency list.',
      companies: [getCoId('amazon'), getCoId('tcs'), getCoId('infosys')].filter(Boolean),
      roles: ['Software Development Engineer', 'Prime Profile', 'Specialist Programmer'],
      estimatedTimeMinutes: 15
    },
    // 17: OS Deadlock: Eliminating Hold and Wait
    {
      title: 'OS Deadlock: Eliminating Hold and Wait',
      statement: 'Which strategy successfully prevents system deadlock by eliminating the "Hold and Wait" Coffman condition?',
      category: 'Core CS',
      subject: 'Operating Systems',
      topic: 'Deadlocks',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Require processes to request and acquire all necessary resources simultaneously before execution begins',
        'Impose a global total ordering on resource allocation and acquire resources strictly in ascending numerical order',
        'Periodically preempt CPU registers of idle processes',
        'Disallow preemption of physical memory pages'
      ],
      correctAnswer: 0,
      explanation: 'Hold and wait requires a process to hold at least one resource while waiting for others. Requiring all resources to be allocated all-at-once guarantees that a process never holds a partial set.',
      examples: 'Conservative Two-Phase Locking (Strict 2PL).',
      constraints: 'OS Resource Allocation Graph model.',
      companies: [getCoId('google'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Prime Profile', 'Software Engineer'],
      estimatedTimeMinutes: 12
    },
    // 18: OS Memory: Page Fault Resolution
    {
      title: 'OS Memory: Page Fault Resolution',
      statement: 'What sequence of operations occurs when an executing CPU instruction triggers a Page Fault trap?',
      category: 'Core CS',
      subject: 'Operating Systems',
      topic: 'Virtual Memory',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'The MMU traps to OS kernel, which locates the missing page in disk swap space, loads it into a physical memory frame, and restarts the instruction',
        'The operating system immediately issues a SIGKILL signal and terminates the parent process',
        'The CPU flushes all translation lookaside buffers and switches to a 16-bit real addressing mode',
        'The OS writes the entire contents of RAM to disk and reboots the kernel'
      ],
      correctAnswer: 0,
      explanation: 'A page fault is an ordinary memory management event. The OS traps, identifies an invalid page table entry, reads the page from disk swap, updates the frame mapping, and resumes the instruction.',
      examples: 'Demand paging architecture.',
      constraints: 'Paged virtual memory architecture.',
      companies: [getCoId('google'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Software Engineer'],
      estimatedTimeMinutes: 15
    },
    // 19: Relational Normalization: Third Normal Form (3NF)
    {
      title: 'Relational Normalization: Third Normal Form (3NF)',
      statement: 'A relational schema is in Third Normal Form (3NF) if it is already in 2NF and which additional requirement is satisfied?',
      category: 'Core CS',
      subject: 'DBMS',
      topic: 'Normalization',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Every non-prime attribute is non-transitively dependent on every candidate key (no X -> Y where Y is non-prime and X is not a superkey)',
        'Every column contains only atomic, indivisible scalar values',
        'Every primary key consists of exactly one auto-generated integer column',
        'All composite foreign keys are partitioned across different physical database servers'
      ],
      correctAnswer: 0,
      explanation: '3NF removes transitive dependencies. A relation is in 3NF if for every functional dependency X -> A, either X is a superkey or A is a prime attribute.',
      examples: 'Table (EmpID -> DeptID -> DeptName) violates 3NF because DeptName transitively depends on EmpID through DeptID.',
      constraints: 'Relational database design.',
      companies: [getCoId('deloitte'), getCoId('tcs'), getCoId('microsoft')].filter(Boolean),
      roles: ['Technology Consultant', 'Prime Profile', 'Data Engineer'],
      estimatedTimeMinutes: 12
    },
    // 20: DBMS Indexing: B+ Trees vs Standard B-Trees
    {
      title: 'DBMS Indexing: B+ Trees vs Standard B-Trees',
      statement: 'Why do relational database engines (such as PostgreSQL and MySQL InnoDB) choose B+ Trees over B-Trees for disk-backed indexing?',
      category: 'Core CS',
      subject: 'DBMS',
      topic: 'Indexing',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Leaf nodes form a contiguous linked list for fast sequential range queries, while internal nodes store only keys to maximize branching fan-out',
        'B+ Trees require zero write locking during concurrent transactions',
        'B+ Trees guarantee O(1) hash table lookup performance for equality searches',
        'B+ Trees automatically compress all text columns using dictionary compression'
      ],
      correctAnswer: 0,
      explanation: 'In a B+ Tree, data rows or row pointers exist only at the leaves, which are doubly-linked. This allows range queries (BETWEEN x AND y) to traverse leaves sequentially without ascending back up tree levels.',
      examples: 'InnoDB Clustered Index on Primary Key.',
      constraints: 'Block-based persistent disk storage.',
      companies: [getCoId('microsoft'), getCoId('deloitte'), getCoId('google')].filter(Boolean),
      roles: ['Data Engineer', 'Technology Consultant', 'Software Engineer'],
      estimatedTimeMinutes: 14
    },
    // 21: Computer Networks: TCP 3-Way Handshake
    {
      title: 'Computer Networks: TCP 3-Way Handshake',
      statement: 'Which sequence of TCP segments establishes a reliable, full-duplex transmission control connection between a client and a listening server?',
      category: 'Core CS',
      subject: 'Networking',
      topic: 'Transport Layer',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Client sends SYN -> Server responds with SYN-ACK -> Client concludes with ACK',
        'Client sends ACK -> Server responds with SYN -> Client responds with FIN',
        'Server sends SYN -> Client responds with ACK -> Server responds with DATA',
        'Client sends PING -> Server responds with PONG -> Client sends CONNECT'
      ],
      correctAnswer: 0,
      explanation: 'The TCP three-way handshake synchronizes sequence numbers: 1. Client sends SYN(seq=x); 2. Server sends SYN(seq=y), ACK(x+1); 3. Client sends ACK(y+1).',
      examples: 'Browser establishing TCP connection before TLS handshake.',
      constraints: 'RFC 793 Transmission Control Protocol.',
      companies: [getCoId('google'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Support Engineer', 'Frontend Engineer'],
      estimatedTimeMinutes: 8
    },
    // 22: Computer Networks: DNS Transport Protocol
    {
      title: 'Computer Networks: DNS Transport Protocol',
      statement: 'Which transport layer protocol and default port are standard DNS query-response lookups primarily carried over?',
      category: 'Core CS',
      subject: 'Networking',
      topic: 'Application Layer',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'UDP over port 53',
        'TCP over port 80',
        'ICMP over port 443',
        'SCTP over port 25'
      ],
      correctAnswer: 0,
      explanation: 'Standard DNS queries are small (under 512 bytes) and use UDP port 53 for low latency and zero connection-establishment overhead. TCP is reserved for zone transfers or large responses.',
      examples: 'dig @8.8.8.8 hireverse.dev uses UDP:53.',
      constraints: 'RFC 1035 Domain Names.',
      companies: [getCoId('google'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Support Engineer'],
      estimatedTimeMinutes: 6
    },
    // 23: JavaScript Engine: Event Loop Execution Order
    {
      title: 'JavaScript Engine: Event Loop Execution Order',
      statement: 'What is the exact console output order of the following JavaScript snippet?\nconsole.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));\nconsole.log("4");',
      category: 'Technical',
      subject: 'Web Dev',
      topic: 'JavaScript',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        '1, 4, 3, 2',
        '1, 2, 3, 4',
        '1, 4, 2, 3',
        '1, 3, 4, 2'
      ],
      correctAnswer: 0,
      explanation: 'Synchronous code runs first ("1", "4"). Microtasks (Promise .then callback) run immediately after call stack empties ("3"). Macrotasks (setTimeout timer callback) execute in the subsequent event loop tick ("2").',
      examples: 'Call stack -> Microtask queue -> Macrotask queue.',
      constraints: 'ECMAScript Event Loop specifications.',
      companies: [getCoId('google'), getCoId('accenture')].filter(Boolean),
      roles: ['Frontend Engineer', 'Full Stack Developer'],
      estimatedTimeMinutes: 10
    },
    // 24: React: Key Props and Reconciliation Diffing
    {
      title: 'React: Key Props and Reconciliation Diffing',
      statement: 'Why does React require stable, unique "key" props when rendering arrays of dynamic list components?',
      category: 'Technical',
      subject: 'Web Dev',
      topic: 'React',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'To uniquely match virtual DOM elements with underlying DOM nodes across renders, enabling minimal mutations without re-rendering all siblings',
        'To cryptographically sign component state before persisting to the browser cache',
        'To automatically bind Redux dispatch actions to each list element',
        'To enforce sequential CSS layout ordering in mobile browsers'
      ],
      correctAnswer: 0,
      explanation: 'Keys allow React to identify which items have changed, been added, or been removed. Using array indices can cause component state bugs when items are reordered or deleted.',
      examples: '<li key={user.id}>{user.name}</li>',
      constraints: 'React Fiber reconciliation algorithm.',
      companies: [getCoId('google'), getCoId('accenture')].filter(Boolean),
      roles: ['Frontend Engineer', 'Full Stack Developer'],
      estimatedTimeMinutes: 8
    },
    // 25: Distributed Systems: Circuit Breaker Pattern
    {
      title: 'Distributed Systems: Circuit Breaker Pattern',
      statement: 'In microservice architectures, what is the core architectural purpose of implementing a Circuit Breaker pattern?',
      category: 'Technical',
      subject: 'Operating Systems',
      topic: 'Distributed Systems',
      difficulty: 'Hard',
      questionType: 'multiple-choice',
      options: [
        'To detect consecutive downstream failures and fail immediately with a fallback, preventing cascading thread starvation across calling services',
        'To encrypt payload data in transit using mutual TLS certificates',
        'To partition write operations across multiple master database shards',
        'To compress HTTP JSON responses using Brotli algorithms'
      ],
      correctAnswer: 0,
      explanation: 'A circuit breaker prevents an application from repeatedly trying to execute an operation that is likely to fail, stopping resource exhaustion and cascading cluster failures.',
      examples: 'Netflix Hystrix, Resilience4j.',
      constraints: 'High-availability distributed cloud systems.',
      companies: [getCoId('google'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Software Engineer'],
      estimatedTimeMinutes: 15
    },
    // 26: SQL Analytics: RANK() vs DENSE_RANK()
    {
      title: 'SQL Analytics: RANK() vs DENSE_RANK()',
      statement: 'In standard SQL window functions, what is the exact operational difference between RANK() and DENSE_RANK() when duplicate ordering values exist?',
      category: 'Technical',
      subject: 'SQL',
      topic: 'Window Functions',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'RANK() leaves gaps in sequence following tied rows (e.g., 1, 2, 2, 4), whereas DENSE_RANK() generates contiguous ranks without skipping numbers (e.g., 1, 2, 2, 3)',
        'DENSE_RANK() can only be applied to integer columns, while RANK() works on strings',
        'RANK() requires an explicit GROUP BY clause, whereas DENSE_RANK() cannot be grouped',
        'DENSE_RANK() sorts descending while RANK() sorts ascending'
      ],
      correctAnswer: 0,
      explanation: 'RANK() calculates rank with gaps based on peer group count: rank = count of predecessor rows + 1. DENSE_RANK() increments by 1 for each distinct ordering value without gaps.',
      examples: 'Scores: [100, 90, 90, 80] -> RANK(): 1, 2, 2, 4. DENSE_RANK(): 1, 2, 2, 3.',
      constraints: 'ANSI SQL:2003 Window Functions.',
      companies: [getCoId('microsoft'), getCoId('deloitte')].filter(Boolean),
      roles: ['Data Engineer', 'Technology Consultant', 'Analyst'],
      estimatedTimeMinutes: 10
    },
    // 27: Database Architecture: Relational vs Document NoSQL
    {
      title: 'Database Architecture: Relational vs Document NoSQL',
      statement: 'Which workload characteristic most strongly favors choosing a Document-based NoSQL store (such as MongoDB) over a traditional RDBMS?',
      category: 'Technical',
      subject: 'DBMS',
      topic: 'Data Modeling',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Polymorphic, hierarchical data entities with evolving schemas that are frequently read and written as complete nested documents',
        'Complex cross-table reporting requiring dozens of normalized relational JOIN operations',
        'Distributed ACID transactions requiring strict two-phase commit across disparate financial banking ledgers',
        'Tabular datasets with strict referential integrity constraints that never change'
      ],
      correctAnswer: 0,
      explanation: 'Document databases excel when data naturally forms rich, self-contained documents (like product catalogs or user profiles) that can be read with a single primary key lookup without expensive joins.',
      examples: 'E-commerce product catalog with varying attributes per category.',
      constraints: 'Modern web and mobile backends.',
      companies: [getCoId('microsoft'), getCoId('accenture')].filter(Boolean),
      roles: ['Data Engineer', 'Full Stack Developer'],
      estimatedTimeMinutes: 10
    },
    // 28: QA Engineering: Boundary Value Analysis
    {
      title: 'QA Engineering: Boundary Value Analysis',
      statement: 'An insurance form input field validates candidate ages and accepts integers from 18 to 60 inclusive. According to Boundary Value Analysis (BVA), which set of test inputs must be verified?',
      category: 'Technical',
      subject: 'Testing',
      topic: 'Test Case Design',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        '17, 18, 19, 59, 60, 61',
        '10, 25, 40, 55, 70',
        '0, 18, 60, 100',
        '18, 30, 45, 60'
      ],
      correctAnswer: 0,
      explanation: 'Boundary Value Analysis focuses on values at and immediately surrounding the input boundaries: min-1 (17), min (18), min+1 (19), max-1 (59), max (60), and max+1 (61).',
      examples: 'Boundary errors typically occur at inequality boundaries (e.g. < vs <=).',
      constraints: 'Black-box test design methodology.',
      companies: [getCoId('amazon')].filter(Boolean),
      roles: ['QA Engineer'],
      estimatedTimeMinutes: 8
    },
    // 29: IT Support Engineering: Hostname vs IP Network Diagnosis
    {
      title: 'IT Support Engineering: Hostname vs IP Network Diagnosis',
      statement: 'A client reports they can successfully ping a server by IP address (10.0.1.50) but get a timeout when connecting by hostname (erp.internal.corp). At which layer is the root cause situated?',
      category: 'Technical',
      subject: 'Networking',
      topic: 'Network Diagnostics',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Application Layer: DNS name resolution failure or misconfigured hosts file',
        'Network Layer: IP packet routing table misconfiguration',
        'Data Link Layer: ARP table cache overflow',
        'Physical Layer: Network interface card hardware defect'
      ],
      correctAnswer: 0,
      explanation: 'Successful ping by IP confirms that the Physical, Data Link, and Network layers are routing packets correctly. Failure only by hostname pinpoints a DNS name resolution failure at the Application Layer.',
      examples: 'nslookup erp.internal.corp returning NXDOMAIN.',
      constraints: 'Enterprise network diagnostics.',
      companies: [getCoId('microsoft')].filter(Boolean),
      roles: ['Support Engineer'],
      estimatedTimeMinutes: 7
    },
    // 30: Business Analytics: Aggregating Revenue by Category
    {
      title: 'Business Analytics: Aggregating Revenue by Category',
      statement: 'In an enterprise consulting case audit, which SQL statement calculates total revenue (unit_price * quantity) grouped by product category, sorted from highest to lowest revenue?',
      category: 'Technical',
      subject: 'SQL',
      topic: 'Business Analytics',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'SELECT category, SUM(unit_price * quantity) AS total_revenue FROM sales GROUP BY category ORDER BY total_revenue DESC',
        'SELECT category, AVG(unit_price * quantity) FROM sales GROUP BY unit_price',
        'SELECT category, unit_price * quantity AS rev FROM sales WHERE quantity > 0',
        'SELECT category, COUNT(order_id) FROM sales ORDER BY category ASC'
      ],
      correctAnswer: 0,
      explanation: 'Total revenue is computed by multiplying price by quantity, summing the result per category with GROUP BY category, and sorting descending with ORDER BY total_revenue DESC.',
      examples: 'SELECT category, SUM(...) GROUP BY category ORDER BY ... DESC.',
      constraints: 'Standard ANSI SQL.',
      companies: [getCoId('deloitte')].filter(Boolean),
      roles: ['Analyst', 'Technology Consultant'],
      estimatedTimeMinutes: 8
    },
    // 31: Amazon Leadership Principles: Customer Obsession
    {
      title: 'Amazon Leadership Principles: Customer Obsession',
      statement: 'Which scenario best demonstrates the Amazon Leadership Principle of "Customer Obsession" during a technical interview discussion?',
      category: 'HR',
      subject: 'Interview',
      topic: 'Leadership Principles',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'Identified a recurring checkout error affecting 0.5% of mobile users, investigated root logs without waiting for management direction, and shipped an automated retry fix',
        'Pushed a complex refactor purely to use modern syntax despite introducing new user-facing latency',
        'Dismissed customer feedback because customer-requested features differed from personal preference',
        'Prioritized internal team convenience over user response time benchmarks'
      ],
      correctAnswer: 0,
      explanation: 'Leaders start with the customer and work backwards. They work vigorously to earn and keep customer trust, paying attention to user friction even without explicit supervision.',
      examples: 'Amazon LP: "Leaders start with the customer and work backwards."',
      constraints: 'Amazon Behavioral Interview format.',
      companies: [getCoId('amazon')].filter(Boolean),
      roles: ['Software Development Engineer', 'QA Engineer'],
      estimatedTimeMinutes: 10
    },
    // 32: OOP: Dynamic Method Dispatch in Polymorphism
    {
      title: 'OOP: Dynamic Method Dispatch in Polymorphism',
      statement: 'Which object-oriented mechanism allows a method call on a parent interface reference to invoke the specific subclass method implementation at runtime?',
      category: 'Core CS',
      subject: 'OOP',
      topic: 'Polymorphism',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'Dynamic Method Dispatch (Virtual Method Table lookup at runtime)',
        'Compile-time macro expansion',
        'Static variable shadowing',
        'Primitive type casting'
      ],
      correctAnswer: 0,
      explanation: 'Dynamic method dispatch uses virtual method tables (vtables) to resolve which overridden method to call based on the concrete instance at runtime, implementing runtime polymorphism.',
      examples: 'Shape s = new Circle(); s.draw(); executes Circle.draw().',
      constraints: 'Java, C++, C#, TypeScript.',
      companies: [getCoId('infosys'), getCoId('tcs')].filter(Boolean),
      roles: ['Systems Engineer', 'Ninja Profile'],
      estimatedTimeMinutes: 8
    },
    // 33: DSA: Optimal Two-Sum Approach
    {
      title: 'DSA: Optimal Two-Sum Approach',
      statement: 'What is the optimal time and space complexity to determine if two elements in an unsorted array sum to a target integer k?',
      category: 'DSA',
      subject: 'DSA',
      topic: 'Arrays',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        'O(n) time and O(n) space using a Hash Map storing visited elements and complements',
        'O(n^2) time and O(1) space with brute force nested loops',
        'O(n log n) time and O(n) space using quicksort without extra storage',
        'O(1) time and O(n^2) space using a 2D adjacency matrix'
      ],
      correctAnswer: 0,
      explanation: 'By checking if (target - num) exists in a hash map while iterating once through the array, we achieve linear O(n) time with O(n) hash table auxiliary space.',
      examples: 'nums = [2, 7, 11, 15], target = 9 -> return indices [0, 1].',
      constraints: 'Array size up to 10^5.',
      companies: [getCoId('google'), getCoId('amazon'), getCoId('microsoft')].filter(Boolean),
      roles: ['Software Engineer', 'Software Development Engineer'],
      estimatedTimeMinutes: 10
    },
    // 34: OS Concurrency: Mutex vs Counting Semaphore
    {
      title: 'OS Concurrency: Mutex vs Counting Semaphore',
      statement: 'What is the essential distinction between a Mutex and a Counting Semaphore in process synchronization?',
      category: 'Core CS',
      subject: 'Operating Systems',
      topic: 'Synchronization',
      difficulty: 'Medium',
      questionType: 'multiple-choice',
      options: [
        'A Mutex enforces strict thread ownership (only the locking thread may unlock it), whereas a Semaphore has an integer counter and can be signaled by any thread',
        'A Semaphore is purely implemented in hardware, while a Mutex is a software construct',
        'A Mutex can only be used on single-core processors',
        'A Counting Semaphore can never exceed a value of 1'
      ],
      correctAnswer: 0,
      explanation: 'A Mutex is a locking mechanism with ownership: the thread that locks it owns it and must release it. A Semaphore is a signaling mechanism representing available resource units, which any thread can post/signal.',
      examples: 'Mutex for protecting critical section; Semaphore for producer-consumer buffer slots.',
      constraints: 'POSIX pthreads / Java Concurrency.',
      companies: [getCoId('google'), getCoId('microsoft')].filter(Boolean),
      roles: ['Site Reliability Engineer', 'Software Engineer'],
      estimatedTimeMinutes: 12
    },
    // 35: Quantitative Aptitude: Percentage Profit with Marked Price
    {
      title: 'Quantitative Aptitude: Percentage Profit with Marked Price',
      statement: 'A shopkeeper marks an item 25% above the cost price and subsequently offers a 10% discount on the marked price. What is the net profit percentage realized?',
      category: 'Aptitude',
      subject: 'Aptitude',
      topic: 'Quantitative',
      difficulty: 'Easy',
      questionType: 'multiple-choice',
      options: [
        '12.5%',
        '15.0%',
        '10.0%',
        '13.5%'
      ],
      correctAnswer: 0,
      explanation: 'Let CP = 100. Marked Price = 100 * 1.25 = 125. Selling Price after 10% discount = 125 - (0.10 * 125) = 112.5. Net profit = (112.5 - 100) / 100 = 12.5%.',
      examples: 'Formula: Profit% = [ (1 + m/100)(1 - d/100) - 1 ] * 100.',
      constraints: 'Standard campus quantitative aptitude screening.',
      companies: [getCoId('tcs'), getCoId('deloitte'), getCoId('infosys')].filter(Boolean),
      roles: ['Ninja Profile', 'Analyst', 'Systems Engineer'],
      estimatedTimeMinutes: 5
    }
  ]
}

/**
 * Returns all mock tests data covering every available company and role, plus general assessments.
 */
export function getTestsData(companyMap, seededQuestions) {
  const getCoId = (code) => companyMap.get(code)?._id || null
  const q = (index) => seededQuestions[index]?._id
  const baseTime = Date.now() - 100000

  return [
    // -------------------------------------------------------------
    // 1. GOOGLE
    // -------------------------------------------------------------
    {
      title: 'Google · Frontend Engineering & Web Performance Assessment',
      description: 'Advanced assessment targeting modern JavaScript event-loop mechanics, React Fiber reconciliation, sliding window algorithms, and networking protocols.',
      company: getCoId('google'),
      role: 'Frontend Engineer',
      category: 'Role Benchmark',
      difficulty: 'Advanced',
      durationMinutes: 40,
      questions: [q(23), q(24), q(0), q(15), q(21), q(9)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },
    {
      title: 'Google · SRE & Distributed Systems Assessment',
      description: 'Rigorous systems engineering test covering distributed circuit breaking, operating system synchronization, page fault handling, deadlocks, and TCP/DNS networking.',
      company: getCoId('google'),
      role: 'Site Reliability Engineer',
      category: 'Technical Core',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [q(25), q(34), q(17), q(18), q(21), q(22)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },
    {
      title: 'Google · Software Engineer Readiness Test',
      description: 'Comprehensive 45-minute technical assessment covering high-frequency algorithmic problem solving, DBMS transactions, OS process scheduling and graph cycles.',
      company: getCoId('google'),
      role: 'Software Engineer',
      category: 'Diagnostic Assessment',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [q(0), q(1), q(4), q(8), q(2), q(7)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 2. MICROSOFT
    // -------------------------------------------------------------
    {
      title: 'Microsoft · Support Engineering Technical Assessment',
      description: 'Diagnostic assessment covering enterprise network troubleshooting, TCP handshakes, DNS resolution, CPU scheduling, and professional verbal comprehension.',
      company: getCoId('microsoft'),
      role: 'Support Engineer',
      category: 'Role Benchmark',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [q(29), q(21), q(22), q(4), q(12)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Microsoft · Data Engineering & Big Data Assessment',
      description: 'Data analytics assessment covering SQL window functions, B+ Tree indexing, relational normalization, NoSQL document modeling, and ACID transactions.',
      company: getCoId('microsoft'),
      role: 'Data Engineer',
      category: 'Technical Core',
      difficulty: 'Intermediate',
      durationMinutes: 35,
      questions: [q(26), q(27), q(3), q(6), q(20), q(2)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },
    {
      title: 'Core CS Checkpoint: DBMS, SQL & Operating Systems',
      description: 'Focused assessment on academic computer science fundamentals frequently tested in campus interviews.',
      company: getCoId('microsoft'),
      role: 'Software Engineer',
      category: 'Subject Drill',
      difficulty: 'Intermediate',
      durationMinutes: 25,
      questions: [q(2), q(3), q(4), q(6), q(7)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 3. AMAZON
    // -------------------------------------------------------------
    {
      title: 'Amazon · Quality Assurance & Automation Assessment',
      description: 'Role-aligned test testing Boundary Value Analysis, SQL queries, OOP encapsulation, logical reasoning syllogisms, and customer-first quality benchmarks.',
      company: getCoId('amazon'),
      role: 'QA Engineer',
      category: 'Role Benchmark',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [q(28), q(3), q(7), q(10), q(31)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Amazon · SDE Algorithmic & Problem-Solving Assessment',
      description: 'High-ownership engineering test evaluating BST lowest common ancestors, 0/1 knapsack dynamic programming, DAG topological sort, and Customer Obsession leadership principles.',
      company: getCoId('amazon'),
      role: 'Software Development Engineer',
      category: 'Diagnostic Assessment',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [q(13), q(14), q(16), q(1), q(31)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 4. ACCENTURE
    // -------------------------------------------------------------
    {
      title: 'Accenture · Cognitive & Technical Screening Test',
      description: 'High-frequency campus screening assessment covering quantitative aptitude, syllogistic logical deduction, work-time math, verbal error spotting, and OOP fundamentals.',
      company: getCoId('accenture'),
      role: 'Associate Software Engineer',
      category: 'Online Assessment',
      difficulty: 'Intermediate',
      durationMinutes: 35,
      questions: [q(5), q(10), q(11), q(12), q(7)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Accenture · Full Stack Diagnostic Assessment',
      description: 'Role-aligned diagnostic covering JavaScript/TypeScript, SQL queries, database transactions and core aptitude fundamentals.',
      company: getCoId('accenture'),
      role: 'Full Stack Developer',
      category: 'Role Benchmark',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [q(2), q(3), q(5), q(6), q(7)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 5. TCS
    // -------------------------------------------------------------
    {
      title: 'TCS · Ninja Foundation Aptitude & Coding Test',
      description: 'TCS NQT-style test testing quantitative speed-distance problems, work-time calculations, syllogisms, verbal grammar, and runtime polymorphism.',
      company: getCoId('tcs'),
      role: 'Ninja Profile',
      category: 'Online Assessment',
      difficulty: 'Foundation',
      durationMinutes: 30,
      questions: [q(5), q(11), q(10), q(12), q(32)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'TCS · Prime Advanced Systems & Algorithmic Assessment',
      description: 'Challenging technical assessment for the TCS Prime hiring band, evaluating consecutive arrays, DAG topological sorting, BST traversal, deadlock prevention, and 3NF normalization.',
      company: getCoId('tcs'),
      role: 'Prime Profile',
      category: 'Advanced Assessment',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [q(0), q(16), q(13), q(17), q(19)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Quantitative & Analytical Aptitude Sprint',
      description: 'Timed speed test simulating campus placement screening assessments.',
      company: getCoId('tcs'),
      role: 'Digital Profile',
      category: 'Aptitude',
      difficulty: 'Foundation',
      durationMinutes: 20,
      questions: [q(5), q(2), q(7)],
      marksPerQuestion: 5,
      negativeMarking: 1,
      totalMarks: 15,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 6. INFOSYS
    // -------------------------------------------------------------
    {
      title: 'Infosys · Systems Engineer Aptitude & CS Fundamentals Test',
      description: 'InfyTQ-inspired campus assessment covering mathematical work-time problems, logical deduction, ACID database transactions, encapsulation, and OOP method dispatch.',
      company: getCoId('infosys'),
      role: 'Systems Engineer',
      category: 'Online Assessment',
      difficulty: 'Foundation',
      durationMinutes: 35,
      questions: [q(11), q(10), q(2), q(7), q(32)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Infosys · Specialist Programmer Advanced DSA Assessment',
      description: 'Elite programming assessment testing 0/1 knapsack dynamic programming, sliding window deques, topological orderings, graph back-edges, and LRU cache structures.',
      company: getCoId('infosys'),
      role: 'Specialist Programmer',
      category: 'Advanced Assessment',
      difficulty: 'Advanced',
      durationMinutes: 45,
      questions: [q(14), q(15), q(16), q(8), q(1)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 7. DELOITTE
    // -------------------------------------------------------------
    {
      title: 'Deloitte · Technology Analyst Case & Aptitude Assessment',
      description: 'Analytical screening test evaluating work-time word problems, syllogisms, SQL business aggregations, second-highest salary queries, and verbal communication.',
      company: getCoId('deloitte'),
      role: 'Analyst',
      category: 'Case & Aptitude',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [q(11), q(10), q(30), q(3), q(12)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    },
    {
      title: 'Deloitte · Technology Consulting & SQL Architecture Assessment',
      description: 'Technology consulting assessment covering business SQL queries, relational 3NF normalization, B+ Tree indexing, HAVING clauses, ACID transactions, and architectural debate resolution.',
      company: getCoId('deloitte'),
      role: 'Technology Consultant',
      category: 'Technical Core',
      difficulty: 'Intermediate',
      durationMinutes: 35,
      questions: [q(30), q(19), q(20), q(6), q(2), q(9)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 24,
      isPublished: true
    },

    // -------------------------------------------------------------
    // 8. GENERAL ASSESSMENTS (Open to all students regardless of company)
    // -------------------------------------------------------------
    {
      title: 'Campus Recruitment Diagnostic: Quantitative & Logical Reasoning Benchmark',
      description: 'Standard campus placement screening drill covering quantitative train pacing, work-time calculations, syllogisms, and verbal subject-verb agreement.',
      company: null,
      role: 'Software Engineer',
      category: 'Aptitude Benchmark',
      difficulty: 'Foundation',
      durationMinutes: 25,
      questions: [q(5), q(10), q(11), q(12)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 16,
      isPublished: true
    },
    {
      title: 'Comprehensive Computer Science Fundamentals Benchmark',
      description: 'Cross-company technical diagnostic covering ACID transaction atomicity, CPU process scheduling, OOP encapsulation, TCP handshake reliability, and optimal Two-Sum time complexity.',
      company: null,
      role: 'Software Engineer',
      category: 'Technical Core',
      difficulty: 'Intermediate',
      durationMinutes: 30,
      questions: [q(2), q(4), q(7), q(21), q(33)],
      marksPerQuestion: 4,
      negativeMarking: 1,
      totalMarks: 20,
      isPublished: true
    }
  ].map((t, idx) => ({
    ...t,
    createdAt: new Date(baseTime + idx * 2000),
    updatedAt: new Date(baseTime + idx * 2000)
  }))
}

/**
 * Synchronizes questions and mock tests to the active database without deleting user progress or attempts.
 */
export async function syncAssessmentsToDatabase() {
  const companies = await Company.find().lean()
  if (!companies || companies.length === 0) {
    return { success: false, message: 'No companies found to sync.' }
  }

  const companyMap = new Map(companies.map(c => [c.code, c]))
  const rawQuestions = getQuestionsData(companyMap)

  // 1. Upsert questions based on title
  const seededQuestions = []
  for (const qData of rawQuestions) {
    let existing = await Question.findOne({ title: qData.title })
    if (!existing) {
      existing = await Question.create(qData)
    } else {
      // Keep existing record up-to-date with company and role mappings
      existing.companies = qData.companies
      existing.roles = qData.roles
      existing.category = qData.category
      existing.subject = qData.subject
      existing.topic = qData.topic
      existing.options = qData.options
      existing.correctAnswer = qData.correctAnswer
      existing.explanation = qData.explanation
      await existing.save()
    }
    seededQuestions.push(existing)
  }

  // 2. Upsert mock tests based on title and company
  const rawTests = getTestsData(companyMap, seededQuestions)
  const seededAllTests = []
  for (const tData of rawTests) {
    let existingTest = await Test.findOne({
      title: tData.title,
      company: tData.company || null
    })

    if (!existingTest) {
      existingTest = await Test.create(tData)
    } else {
      existingTest.questions = tData.questions
      existingTest.role = tData.role
      existingTest.category = tData.category
      existingTest.difficulty = tData.difficulty
      existingTest.durationMinutes = tData.durationMinutes
      existingTest.marksPerQuestion = tData.marksPerQuestion
      existingTest.negativeMarking = tData.negativeMarking
      existingTest.totalMarks = tData.totalMarks
      existingTest.isPublished = true
      await existingTest.save()
    }
    seededAllTests.push(existingTest)
  }

  return {
    success: true,
    totalQuestions: seededQuestions.length,
    totalTests: seededAllTests.length
  }
}
