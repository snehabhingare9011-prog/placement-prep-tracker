// Comprehensive database of company placement preparation topics, popular websites, and YouTube videos

export const COMPANY_CURRICULUM = {
  // Common topic repository mapped by domain
  topics: [
    // --- 1. APTITUDE & REASONING ---
    {
      id: 'apti-quantitative',
      title: 'Quantitative Aptitude: Time, Work & Percentages',
      pillar: 'Aptitude',
      importance: 'High',
      estimatedHours: '4 hrs',
      description: 'Frequently tested in campus online assessments. Covers work equivalences, speed-distance-time, percentages, and profit & loss.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer', 'Digital Profile', 'Ninja Profile', 'Systems Engineer', 'Analyst'],
      popularWebsites: [
        { title: 'IndiaBIX - Quantitative Aptitude', provider: 'IndiaBIX', url: 'https://www.indiabix.com/aptitude/questions-and-answers/' },
        { title: 'GeeksforGeeks - Placement Aptitude', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/' },
        { title: 'Testbook - Quantitative Formulas & Shortcuts', provider: 'Testbook', url: 'https://testbook.com/aptitude' }
      ],
      youtubeVideos: [
        { title: 'Time and Work Complete Masterclass', channel: 'Feel Free to Learn', duration: '45 mins', url: 'https://www.youtube.com/results?search_query=feel+free+to+learn+time+and+work' },
        { title: 'Quantitative Aptitude Full Course for Placements', channel: 'CareerRide', duration: '2 hrs 15 mins', url: 'https://www.youtube.com/results?search_query=careerride+quantitative+aptitude' }
      ]
    },
    {
      id: 'apti-logical-reasoning',
      title: 'Logical Reasoning: Blood Relations, Coding-Decoding & Puzzles',
      pillar: 'Aptitude',
      importance: 'High',
      estimatedHours: '3 hrs',
      description: 'Critical screening section for Accenture, TCS NQT, Infosys, and Deloitte rounds.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer', 'Digital Profile', 'Ninja Profile', 'Systems Engineer', 'Analyst'],
      popularWebsites: [
        { title: 'IndiaBIX - Logical Reasoning', provider: 'IndiaBIX', url: 'https://www.indiabix.com/logical-reasoning/questions-and-answers/' },
        { title: 'GeeksforGeeks - Puzzles & Logical Tricks', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/puzzles/' }
      ],
      youtubeVideos: [
        { title: 'Logical Reasoning Full Course', channel: 'CareerRide', duration: '1 hr 30 mins', url: 'https://www.youtube.com/results?search_query=careerride+logical+reasoning' },
        { title: 'Syllogism and Deduction Tricks', channel: 'Study Smart', duration: '35 mins', url: 'https://www.youtube.com/results?search_query=study+smart+syllogism' }
      ]
    },
    {
      id: 'apti-verbal-ability',
      title: 'Verbal Ability: Sentence Correction & Comprehension',
      pillar: 'Aptitude',
      importance: 'Medium',
      estimatedHours: '2 hrs',
      description: 'Grammar rules, sentence completion, para jumbles, and reading comprehension.',
      roles: ['Associate Software Engineer', 'Full Stack Developer', 'Analyst', 'Systems Engineer'],
      popularWebsites: [
        { title: 'IndiaBIX - Verbal Ability Questions', provider: 'IndiaBIX', url: 'https://www.indiabix.com/verbal-ability/questions-and-answers/' },
        { title: 'W3Schools - English Grammar & Writing', provider: 'W3Schools', url: 'https://www.w3schools.com/' }
      ],
      youtubeVideos: [
        { title: 'Verbal Ability & Grammar for Campus Placements', channel: 'Unacademy', duration: '1 hr 10 mins', url: 'https://www.youtube.com/results?search_query=verbal+ability+campus+placement' }
      ]
    },

    // --- 2. DATA STRUCTURES & ALGORITHMS (DSA) ---
    {
      id: 'dsa-arrays-strings',
      title: 'Arrays & Strings: Two-Pointer & Sliding Window',
      pillar: 'DSA',
      importance: 'High',
      estimatedHours: '6 hrs',
      description: 'Core algorithmic patterns: two-pointers, sliding window, prefix sums, and frequency hashmaps. Tested in Google, Microsoft, Amazon, and Accenture.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Software Development Engineer', 'Frontend Engineer', 'Digital Profile'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Arrays Data Structure', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/array-data-structure/' },
        { title: 'W3Schools - Python / Java Arrays Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/dsa/dsa_theory_arrays.php' },
        { title: 'NeetCode - Arrays & Hashing Roadmap', provider: 'NeetCode', url: 'https://neetcode.io/roadmap' }
      ],
      youtubeVideos: [
        { title: 'Striver A2Z - Arrays Complete Playlist', channel: 'take U forward', duration: '4 hrs', url: 'https://www.youtube.com/results?search_query=striver+arrays+playlist' },
        { title: 'Sliding Window Technique Explained', channel: 'Aditya Verma', duration: '1 hr 20 mins', url: 'https://www.youtube.com/results?search_query=aditya+verma+sliding+window' }
      ]
    },
    {
      id: 'dsa-linked-lists',
      title: 'Linked Lists: Cycle Detection & Reversals',
      pillar: 'DSA',
      importance: 'Medium',
      estimatedHours: '4 hrs',
      description: 'Singly and doubly linked lists, Floyd fast/slow cycle detection, reversing sublists, and merge operations.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Software Development Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Linked List Data Structure', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/data-structures/linked-list/' },
        { title: 'W3Schools - DSA Linked Lists', provider: 'W3Schools', url: 'https://www.w3schools.com/dsa/dsa_theory_linkedlists.php' }
      ],
      youtubeVideos: [
        { title: 'Linked List Masterclass with Striver', channel: 'take U forward', duration: '2 hrs', url: 'https://www.youtube.com/results?search_query=striver+linked+list' },
        { title: 'Abdul Bari - Linked List Data Structures', channel: 'Abdul Bari', duration: '50 mins', url: 'https://www.youtube.com/results?search_query=abdul+bari+linked+list' }
      ]
    },
    {
      id: 'dsa-trees-bst',
      title: 'Binary Trees & Binary Search Trees (BST)',
      pillar: 'DSA',
      importance: 'High',
      estimatedHours: '7 hrs',
      description: 'DFS & BFS traversals, height/depth computation, Lowest Common Ancestor (LCA), tree serialization, and BST balance.',
      roles: ['Software Engineer', 'Software Development Engineer', 'Full Stack Developer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Binary Tree Tutorial', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/' },
        { title: 'TutorialsPoint - Trees & Traversal Algorithms', provider: 'TutorialsPoint', url: 'https://www.tutorialspoint.com/data_structures_algorithms/tree_data_structure.htm' }
      ],
      youtubeVideos: [
        { title: 'Binary Trees Complete Series', channel: 'take U forward', duration: '3 hrs 30 mins', url: 'https://www.youtube.com/results?search_query=striver+binary+tree' },
        { title: 'Trees Traversal Algorithms', channel: 'Abdul Bari', duration: '1 hr 15 mins', url: 'https://www.youtube.com/results?search_query=abdul+bari+trees' }
      ]
    },
    {
      id: 'dsa-graphs',
      title: 'Graph Algorithms: BFS, DFS & Shortest Path',
      pillar: 'DSA',
      importance: 'High',
      estimatedHours: '8 hrs',
      description: 'Adjacency list representations, cycle detection in directed/undirected graphs, Dijkstra shortest path, and Topological Sort.',
      roles: ['Software Engineer', 'Software Development Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Graph Data Structure and Algorithms', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
        { title: 'NeetCode - Advanced Graphs', provider: 'NeetCode', url: 'https://neetcode.io/roadmap' }
      ],
      youtubeVideos: [
        { title: 'Graph Series by Striver', channel: 'take U forward', duration: '4 hrs', url: 'https://www.youtube.com/results?search_query=striver+graph+series' },
        { title: 'Graph Theory - Dijkstra, BFS, DFS Explained', channel: 'freeCodeCamp', duration: '2 hrs 40 mins', url: 'https://www.youtube.com/results?search_query=freecodecamp+graph+algorithms' }
      ]
    },
    {
      id: 'dsa-dynamic-programming',
      title: 'Dynamic Programming: Memoization & Tabulation',
      pillar: 'DSA',
      importance: 'High',
      estimatedHours: '8 hrs',
      description: 'Overlapping subproblems, 0/1 Knapsack, Longest Common Subsequence (LCS), and grid path optimization.',
      roles: ['Software Engineer', 'Software Development Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Dynamic Programming', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/dynamic-programming/' }
      ],
      youtubeVideos: [
        { title: 'Dynamic Programming Playlist', channel: 'Aditya Verma', duration: '5 hrs', url: 'https://www.youtube.com/results?search_query=aditya+verma+dynamic+programming' },
        { title: 'DP on Strings and Grids', channel: 'take U forward', duration: '3 hrs', url: 'https://www.youtube.com/results?search_query=striver+dp' }
      ]
    },

    // --- 3. CORE COMPUTER SCIENCE ---
    {
      id: 'core-dbms-sql',
      title: 'DBMS: Transactions, ACID Properties & SQL Queries',
      pillar: 'Core CS',
      importance: 'High',
      estimatedHours: '6 hrs',
      description: 'ACID transaction management, isolation levels, Normalization (1NF to BCNF), B-Tree vs Hash indexing, and complex SQL joins/aggregations.',
      roles: ['Full Stack Developer', 'Software Engineer', 'Associate Software Engineer', 'Analyst', 'Systems Engineer', 'Digital Profile'],
      popularWebsites: [
        { title: 'W3Schools - SQL Complete Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/sql/' },
        { title: 'GeeksforGeeks - DBMS Notes for Interview Preparation', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/dbms/' },
        { title: 'JavaTpoint - Database Management System', provider: 'JavaTpoint', url: 'https://www.javatpoint.com/dbms-tutorial' }
      ],
      youtubeVideos: [
        { title: 'DBMS Complete Course for Placements', channel: 'Gate Smashers', duration: '4 hrs', url: 'https://www.youtube.com/results?search_query=gate+smashers+dbms' },
        { title: 'SQL Joins, Indexing and Transactions Explained', channel: 'Chai aur Code', duration: '1 hr 45 mins', url: 'https://www.youtube.com/results?search_query=chai+aur+code+sql' }
      ]
    },
    {
      id: 'core-os',
      title: 'Operating Systems: Process Scheduling & Deadlocks',
      pillar: 'Core CS',
      importance: 'High',
      estimatedHours: '5 hrs',
      description: 'CPU scheduling algorithms (Round Robin, Priority, FCFS), process synchronization (Semaphores, Mutex), Deadlock conditions, and Paging.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer', 'Systems Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Operating Systems Notes', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/operating-systems/' },
        { title: 'TutorialsPoint - Operating System Concepts', provider: 'TutorialsPoint', url: 'https://www.tutorialspoint.com/operating_system/index.htm' }
      ],
      youtubeVideos: [
        { title: 'Operating Systems Full Course in One Shot', channel: 'Gate Smashers', duration: '3 hrs 30 mins', url: 'https://www.youtube.com/results?search_query=gate+smashers+operating+system' },
        { title: 'CPU Scheduling and Synchronization', channel: 'Knowledge Gate', duration: '2 hrs', url: 'https://www.youtube.com/results?search_query=knowledge+gate+operating+system' }
      ]
    },
    {
      id: 'core-oop',
      title: 'Object-Oriented Programming (OOP) & Design Principles',
      pillar: 'Core CS',
      importance: 'High',
      estimatedHours: '4 hrs',
      description: 'The 4 pillars (Encapsulation, Abstraction, Inheritance, Polymorphism), interface design, and SOLID principles.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer', 'Digital Profile', 'Systems Engineer'],
      popularWebsites: [
        { title: 'W3Schools - OOP Concepts (Java/C++)', provider: 'W3Schools', url: 'https://www.w3schools.com/java/java_oop.asp' },
        { title: 'GeeksforGeeks - Object Oriented Programming Concepts', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/' }
      ],
      youtubeVideos: [
        { title: 'OOPs Concepts Complete Video', channel: 'Kunal Kushwaha', duration: '2 hrs 10 mins', url: 'https://www.youtube.com/results?search_query=kunal+kushwaha+oops' },
        { title: 'SOLID Principles with Real Examples', channel: 'freeCodeCamp', duration: '45 mins', url: 'https://www.youtube.com/results?search_query=solid+principles+freecodecamp' }
      ]
    },
    {
      id: 'core-cn',
      title: 'Computer Networks: OSI Model, TCP/IP & HTTP/HTTPS',
      pillar: 'Core CS',
      importance: 'Medium',
      estimatedHours: '4 hrs',
      description: 'The 7-layer OSI model, 3-way TCP handshake, DNS resolution, IP addressing, and client-server architecture.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Computer Network Tutorials', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/' },
        { title: 'MDN Web Docs - Overview of HTTP', provider: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' }
      ],
      youtubeVideos: [
        { title: 'Computer Networks Complete Course', channel: 'Gate Smashers', duration: '3 hrs', url: 'https://www.youtube.com/results?search_query=gate+smashers+computer+networks' }
      ]
    },

    // --- 4. WEB & TECHNICAL FRAMEWORKS ---
    {
      id: 'web-javascript-react',
      title: 'Modern JavaScript & React.js Frontend Architecture',
      pillar: 'Web & Technical',
      importance: 'High',
      estimatedHours: '6 hrs',
      description: 'ES6+ syntax, asynchronous programming (Promises, async/await), React hooks (useState, useEffect, useMemo), and component lifecycle.',
      roles: ['Full Stack Developer', 'Frontend Engineer', 'Associate Software Engineer'],
      popularWebsites: [
        { title: 'W3Schools - JavaScript Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/js/' },
        { title: 'W3Schools - React Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/react/' },
        { title: 'MDN Web Docs - JavaScript Guide', provider: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }
      ],
      youtubeVideos: [
        { title: 'JavaScript Full Course - Chai aur Code', channel: 'Chai aur Code', duration: '6 hrs', url: 'https://www.youtube.com/results?search_query=chai+aur+code+javascript' },
        { title: 'React JS Full Course 2026', channel: 'freeCodeCamp', duration: '4 hrs', url: 'https://www.youtube.com/results?search_query=freecodecamp+react+full+course' }
      ]
    },
    {
      id: 'web-backend-apis',
      title: 'Backend Engineering: Node.js, Express & RESTful APIs',
      pillar: 'Web & Technical',
      importance: 'High',
      estimatedHours: '5 hrs',
      description: 'Express routing, middleware architecture, JWT authentication, error handling, and database integration.',
      roles: ['Full Stack Developer', 'Software Engineer'],
      popularWebsites: [
        { title: 'W3Schools - Node.js Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/nodejs/' },
        { title: 'MDN Web Docs - Express Web Framework', provider: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs' }
      ],
      youtubeVideos: [
        { title: 'Node.js and Express Complete Series', channel: 'Chai aur Code', duration: '3 hrs 40 mins', url: 'https://www.youtube.com/results?search_query=chai+aur+code+backend' }
      ]
    },
    {
      id: 'web-system-design',
      title: 'System Design Basics: Caching, Load Balancing & Scalability',
      pillar: 'Web & Technical',
      importance: 'High',
      estimatedHours: '5 hrs',
      description: 'Horizontal vs vertical scaling, Redis caching strategies, database sharding, and microservices.',
      roles: ['Software Engineer', 'Software Development Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - System Design Tutorial', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/system-design-tutorial/' },
        { title: 'ByteByteGo System Design Blog', provider: 'ByteByteGo', url: 'https://bytebytego.com/' }
      ],
      youtubeVideos: [
        { title: 'System Design for Beginners', channel: 'Gaurav Sen', duration: '1 hr 15 mins', url: 'https://www.youtube.com/results?search_query=gaurav+sen+system+design' },
        { title: 'System Design Interview Concepts', channel: 'ByteByteGo', duration: '45 mins', url: 'https://www.youtube.com/results?search_query=bytebytego+system+design' }
      ]
    },

    // --- 5. HR & BEHAVIORAL ---
    {
      id: 'hr-star-framework',
      title: 'HR & Behavioral: STAR Method & Project Walkthrough',
      pillar: 'HR & Behavioral',
      importance: 'Medium',
      estimatedHours: '3 hrs',
      description: 'Structure interview answers using Situation, Task, Action, Result. Prepare project walkthroughs and leadership conflict resolution stories.',
      roles: ['Software Engineer', 'Full Stack Developer', 'Associate Software Engineer', 'Analyst', 'Systems Engineer'],
      popularWebsites: [
        { title: 'GeeksforGeeks - Common HR Interview Questions', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/common-interview-questions-and-answers/' }
      ],
      youtubeVideos: [
        { title: 'How to Answer Behavioral Interview Questions', channel: 'Jeff Su', duration: '20 mins', url: 'https://www.youtube.com/results?search_query=jeff+su+star+method' },
        { title: 'Campus HR Interview Questions & Answers', channel: 'CareerRide', duration: '35 mins', url: 'https://www.youtube.com/results?search_query=careerride+hr+interview' }
      ]
    }
  ]
}

export function getCurriculumForCompany(company, selectedRoles = []) {
  const roles = selectedRoles.length > 0 ? selectedRoles : (company?.roles || ['Software Engineer'])

  // Filter topics that match any of the selected roles
  const matchedTopics = COMPANY_CURRICULUM.topics.filter(topic => {
    return topic.roles.some(r => roles.includes(r))
  })

  // Group by pillar
  const pillars = {
    Aptitude: matchedTopics.filter(t => t.pillar === 'Aptitude'),
    DSA: matchedTopics.filter(t => t.pillar === 'DSA'),
    'Core CS': matchedTopics.filter(t => t.pillar === 'Core CS'),
    'Web & Technical': matchedTopics.filter(t => t.pillar === 'Web & Technical'),
    'HR & Behavioral': matchedTopics.filter(t => t.pillar === 'HR & Behavioral')
  }

  return {
    companyName: company?.name || 'Target Company',
    selectedRoles: roles,
    totalTopics: matchedTopics.length,
    pillars,
    topics: matchedTopics
  }
}
