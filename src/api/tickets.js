import api from './axios'

// Tickets API functions
export const ticketService = {
  // Lấy danh sách tickets
  // React: export const getTickets = (params) => api.get('/tickets', { params })
  index: (params) => api.get('/tickets', { params }),

  // Tạo ticket mới
  create: (data) => api.post('/tickets', data),

  // Lấy chi tiết ticket
  show: (id) => api.get(`/tickets/${id}`),

  // Cập nhật ticket
  update: (id, data) => api.put(`/tickets/${id}`, data),

  // Xóa ticket
  delete: (id) => api.delete(`/tickets/${id}`),

  // Gán ticket cho CSKH
  assign: (id, userId) => api.post(`/tickets/${id}/assign`, { user_id: userId }),

  // Lấy messages của ticket
  getMessages: (ticketId, params) => api.get(`/tickets/${ticketId}/messages`, { params }),

  // Gửi message
  sendMessage: (ticketId, data) => api.post(`/tickets/${ticketId}/messages`, data),
}

// Categories API
export const categoryService = {
  index: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Dashboard API
export const dashboardService = {
  statistics: (days = 30) => api.get('/dashboard/statistics', { params: { days } }),
  analytics: (days = 30) => api.get('/dashboard/analytics', { params: { days } }),
  charts: (type = 'trend', days = 30) => api.get('/dashboard/charts', { params: { type, days } }),
  recentActivity: () => api.get('/dashboard/activity'),
}

// Notifications API
export const notificationService = {
  index: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

// Users API
export const userService = {
  index: (params) => api.get('/users', { params }),
  show: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  cskhList: () => api.get('/users/cskh-list'),
  statistics: () => api.get('/users/statistics'),
}

// Ratings API
export const ratingService = {
  show: (ticketId) => api.get(`/tickets/${ticketId}/rating`),
  create: (ticketId, data) => api.post(`/tickets/${ticketId}/rating`, data),
  cskhStats: (days = 30) => api.get('/ratings/cskh-stats', { params: { days } }),
  myStats: (days = 30) => api.get('/ratings/my-stats', { params: { days } }),
}
