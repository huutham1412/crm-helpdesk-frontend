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
}
