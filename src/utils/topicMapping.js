// Mapping between question subjects/topics and verified Preparation Hub topic IDs
export const TOPIC_MAPPING_RULES = [
  { matchTerms: ['graph', 'bfs', 'dfs', 'shortest path', 'dijkstra', 'topological'], hubTopicId: 'dsa-graphs' },
  { matchTerms: ['tree', 'bst', 'binary tree', 'lca', 'traversal'], hubTopicId: 'dsa-trees-bst' },
  { matchTerms: ['dynamic programming', 'dp', 'knapsack', 'memoization'], hubTopicId: 'dsa-dynamic-programming' },
  { matchTerms: ['array', 'string', 'two-pointer', 'sliding window', 'hash', 'hashing', 'hashmap', 'lru'], hubTopicId: 'dsa-arrays-strings' },
  { matchTerms: ['linked list', 'linkedlist', 'pointer'], hubTopicId: 'dsa-linked-lists' },
  { matchTerms: ['dbms', 'transaction', 'acid', 'indexing', 'normalization'], hubTopicId: 'core-dbms-sql' },
  { matchTerms: ['sql', 'query', 'join', 'having', 'aggregate', 'salary'], hubTopicId: 'core-dbms-sql' },
  { matchTerms: ['operating system', 'os', 'process scheduling', 'deadlock', 'semaphore', 'mutex', 'cpu', 'paging'], hubTopicId: 'core-os' },
  { matchTerms: ['oop', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'solid'], hubTopicId: 'core-oop' },
  { matchTerms: ['computer network', 'network', 'osi', 'tcp', 'http', 'dns', 'ip'], hubTopicId: 'core-cn' },
  { matchTerms: ['quantitative', 'math', 'time and work', 'speed', 'percentage', 'train'], hubTopicId: 'apti-quantitative' },
  { matchTerms: ['logical', 'reasoning', 'puzzle', 'blood relation', 'coding-decoding', 'syllogism'], hubTopicId: 'apti-logical-reasoning' },
  { matchTerms: ['verbal', 'english', 'grammar', 'comprehension'], hubTopicId: 'apti-verbal-ability' },
  { matchTerms: ['javascript', 'react', 'frontend', 'async', 'hook'], hubTopicId: 'web-javascript-react' },
  { matchTerms: ['node', 'express', 'backend', 'api', 'rest'], hubTopicId: 'web-backend-apis' },
  { matchTerms: ['system design', 'scalability', 'cache', 'redis', 'load balancer', 'microservice'], hubTopicId: 'web-system-design' },
  { matchTerms: ['hr', 'behavioral', 'star', 'leadership', 'interview', 'culture'], hubTopicId: 'hr-star-framework' }
]

export function mapQuestionToHubTopicId(topicName, subjectName = '') {
  const combined = `${topicName || ''} ${subjectName || ''}`.toLowerCase()
  for (const rule of TOPIC_MAPPING_RULES) {
    for (const term of rule.matchTerms) {
      if (combined.includes(term)) {
        return rule.hubTopicId
      }
    }
  }
  return null
}
