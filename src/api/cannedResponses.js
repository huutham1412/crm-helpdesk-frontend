import api from './axios'

/**
 * Canned Responses API Service
 */
export const cannedResponseService = {
  /**
   * Get all canned responses with pagination
   */
  async getAll(params = {}) {
    const response = await api.get('/canned-responses', { params })
    return response.data
  },

  /**
   * Get all active canned responses (for dropdown)
   */
  async getAllActive(params = {}) {
    const response = await api.get('/canned-responses/all', { params })
    return response.data
  },

  /**
   * Get popular canned responses
   */
  async getPopular(params = {}) {
    const response = await api.get('/canned-responses/popular', { params })
    return response.data
  },

  /**
   * Get single canned response
   */
  async getById(id) {
    const response = await api.get(`/canned-responses/${id}`)
    return response.data
  },

  /**
   * Create new canned response
   */
  async create(data) {
    const response = await api.post('/canned-responses', data)
    return response.data
  },

  /**
   * Update canned response
   */
  async update(id, data) {
    const response = await api.put(`/canned-responses/${id}`, data)
    return response.data
  },

  /**
   * Delete canned response
   */
  async delete(id) {
    const response = await api.delete(`/canned-responses/${id}`)
    return response.data
  },

  /**
   * Preview canned response with variables replaced
   */
  async preview(id, ticketId = null) {
    const response = await api.post(`/canned-responses/${id}/preview`, {
      ticket_id: ticketId
    })
    return response.data
  },

  /**
   * Increment usage count
   */
  async incrementUsage(id) {
    const response = await api.post(`/canned-responses/${id}/use`)
    return response.data
  }
}
