import axios from './axios'

export const adminService = {
  // ==================== USER MANAGEMENT ====================
  // List all users with pagination and filters
  getUsers: (params = {}) => axios.get('/users', { params }),

  // Get single user
  getUser: (id) => axios.get(`/users/${id}`),

  // Create new user
  createUser: (data) => axios.post('/users', data),

  // Update user
  updateUser: (id, data) => axios.put(`/users/${id}`, data),

  // Delete user
  deleteUser: (id) => axios.delete(`/users/${id}`),

  // Assign roles to user
  assignUserRoles: (id, roles) => axios.put(`/users/${id}/roles`, { roles }),

  // Toggle user active status
  toggleUserStatus: (id) => axios.put(`/users/${id}/status`),

  // Get user statistics
  getUserStats: () => axios.get('/users/statistics'),

  // ==================== ROLE MANAGEMENT ====================
  // List all roles
  getRoles: () => axios.get('/roles'),

  // Get single role
  getRole: (id) => axios.get(`/roles/${id}`),

  // Create new role
  createRole: (data) => axios.post('/roles', data),

  // Update role
  updateRole: (id, data) => axios.put(`/roles/${id}`, data),

  // Delete role
  deleteRole: (id) => axios.delete(`/roles/${id}`),

  // Get roles for select dropdown
  getRolesList: () => axios.get('/roles/list'),

  // ==================== ACTIVITY LOGS ====================
  // Get activity logs with filters
  getActivityLogs: (params = {}) => axios.get('/activity-logs', { params }),

  // Get single activity log with details
  getActivityLog: (id) => axios.get(`/activity-logs/${id}`),

  // Get subject history
  getSubjectHistory: (subjectType, subjectId) => axios.get('/activity-logs/subject/history', {
    params: { subject_type: subjectType, subject_id: subjectId }
  }),

  // Get activity log statistics
  getActivityLogStats: (params = {}) => axios.get('/activity-logs/statistics', { params }),

  // Export activity logs
  exportActivityLogs: (params = {}) => axios.get('/activity-logs/export', {
    params,
    responseType: 'blob'
  }),

  // Clean old activity logs
  cleanActivityLogs: () => axios.post('/activity-logs/clean'),

  // Get filter options
  getActivityLogOptions: () => axios.get('/activity-logs/options'),
}
