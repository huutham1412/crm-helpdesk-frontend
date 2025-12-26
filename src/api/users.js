import axios from './axios'

export const userService = {
  // List all users (Admin only)
  index: (params = {}) => axios.get('/users', { params }),

  // Get user statistics
  statistics: () => axios.get('/users/statistics'),

  // Get single user
  show: (id) => axios.get(`/users/${id}`),

  // Update user
  update: (id, data) => axios.put(`/users/${id}`, data),

  // Delete user
  delete: (id) => axios.delete(`/users/${id}`),

  // Get CSKH list for dropdown
  cskhList: () => axios.get('/users/cskh-list'),
}
