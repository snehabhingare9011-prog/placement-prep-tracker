import axios from 'axios'

const API_BASE = '/api/v1'

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach JWT token from localStorage to all outgoing requests
client.interceptors.request.use(
  config => {
    const token = localStorage.getItem('hireverse_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Intercept responses for session expiration handling
client.interceptors.response.use(
  response => response.data,
  error => {
    const res = error.response
    if (res && res.status === 401 && !error.config.url.includes('/auth/login')) {
      // Clear expired credentials
      localStorage.removeItem('hireverse_token')
      localStorage.removeItem('hireverse_user')
    }
    const message = res?.data?.message || error.message || 'Network request failed'
    return Promise.reject(new Error(message))
  }
)

export const api = {
  // Authentication
  auth: {
    login: (credentials) => client.post('/auth/login', credentials),
    register: (userData) => client.post('/auth/register', userData),
    getMe: () => client.get('/auth/me'),
    logout: () => client.post('/auth/logout'),
    forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => client.post('/auth/reset-password', { token, newPassword })
  },

  // Users & Students
  users: {
    getMe: () => client.get('/users/me'),
    updateProfile: (data) => client.patch('/users/me', data),
    updatePassword: (passwords) => client.patch('/users/me/password', passwords),
    setTarget: (companyId, role) => client.patch('/users/me/target', { companyId, role }),
    getStudents: (params) => client.get('/users/students', { params }),
    getStudentById: (id) => client.get(`/users/students/${id}`)
  },

  // Companies
  companies: {
    getAll: (params) => client.get('/companies', { params }),
    getById: (id) => client.get(`/companies/${id}`),
    create: (data) => client.post('/companies', data),
    update: (id, data) => client.patch(`/companies/${id}`, data),
    delete: (id) => client.delete(`/companies/${id}`),
    getRoles: (id) => client.get(`/companies/${id}/roles`)
  },

  // Questions & Practice
  questions: {
    getAll: (params) => client.get('/questions', { params }),
    getById: (id) => client.get(`/questions/${id}`),
    recordAttempt: (id, data) => client.post(`/questions/${id}/attempts`, data),
    getHistory: () => client.get('/questions/history'),
    getSaved: () => client.get('/questions/saved'),
    save: (id) => client.post(`/questions/${id}/save`),
    unsave: (id) => client.delete(`/questions/${id}/save`),
    create: (data) => client.post('/questions', data),
    update: (id, data) => client.patch(`/questions/${id}`, data),
    delete: (id) => client.delete(`/questions/${id}`)
  },

  // Mock Tests
  tests: {
    getAll: (params) => client.get('/tests', { params }),
    getById: (id) => client.get(`/tests/${id}`),
    start: (id) => client.post(`/tests/${id}/start`),
    getAttempt: (attemptId) => client.get(`/test-attempts/attempts/${attemptId}`),
    saveAnswers: (attemptId, answers) => client.patch(`/test-attempts/attempts/${attemptId}/answers`, { answers }),
    submit: (attemptId, answers) => client.post(`/test-attempts/attempts/${attemptId}/submit`, { answers }),
    getResults: (attemptId) => client.get(`/test-attempts/attempts/${attemptId}/results`),
    getHistory: () => client.get('/tests/history'),
    getInsights: (params) => client.get('/tests/insights', { params }),
    create: (data) => client.post('/tests', data),
    update: (id, data) => client.patch(`/tests/${id}`, data),
    delete: (id) => client.delete(`/tests/${id}`)
  },

  // Roadmaps
  roadmaps: {
    get: (params) => client.get('/roadmaps', { params }),
    generate: (companyId, role, availableWeeks) => client.post('/roadmaps', { companyId, role, availableWeeks }),
    toggleTask: (roadmapId, taskId) => client.patch(`/roadmaps/${roadmapId}/tasks/${taskId}`)
  },

  // Company Curriculum & Preparation Topics
  curriculum: {
    getAllTopics: () => client.get('/curriculum/all-topics'),
    getByCompany: (companyId, roles) => client.get(`/curriculum/company/${companyId}`, {
      params: { roles: Array.isArray(roles) ? roles.join(',') : roles }
    }),
    getUserProgress: (params) => client.get('/curriculum/user-progress', { params }),
    toggleTopic: (topicId, companyId, role) => client.patch('/curriculum/toggle-topic', { topicId, companyId, role }),
    updateRoles: (roles) => client.patch('/curriculum/roles', { roles })
  },

  // Readiness & Analytics
  readiness: {
    getOverall: (params) => client.get('/readiness', { params }),
    getCompanyReadiness: (companyId, roleId) => client.get(`/readiness/company/${companyId}${roleId ? `/role/${roleId}` : ''}`),
    getStudentAnalytics: (params) => client.get('/readiness/analytics/student', { params })
  },

  // Placement Drives & Announcements
  placement: {
    getDrives: (params) => client.get('/placement/drives', { params }),
    getDriveById: (id) => client.get(`/placement/drives/${id}`),
    applyDrive: (id) => client.post(`/placement/drives/${id}/apply`),
    createDrive: (data) => client.post('/placement/drives', data),
    updateDrive: (id, data) => client.patch(`/placement/drives/${id}`, data),
    getAnnouncements: () => client.get('/placement/announcements'),
    createAnnouncement: (data) => client.post('/placement/announcements', data),
    deleteAnnouncement: (id) => client.delete(`/placement/announcements/${id}`)
  },

  // Admin Workspace
  admin: {
    getOverview: () => client.get('/admin/overview'),
    getUsers: (params) => client.get('/admin/users', { params }),
    updateUser: (id, data) => client.patch(`/admin/users/${id}`, data),
    getAnalytics: () => client.get('/admin/analytics')
  }
}

export default api
