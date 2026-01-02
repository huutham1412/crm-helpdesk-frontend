import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cannedResponseService } from '@/api/cannedResponses'

// Pinia store: Quản lý canned responses (templates trả lời mẫu)
export const useCannedResponseStore = defineStore('cannedResponse', () => {
  // Reactive state: Danh sách canned responses
  const responses = ref([])

  // Reactive state: Popular responses (most used)
  const popularResponses = ref([])

  // Reactive state: Canned response đang được chỉnh sửa
  const editingResponse = ref(null)

  // Reactive state: Theo dõi trạng thái loading
  const loading = ref(false)

  // Reactive state: Modal visibility
  const showManagerModal = ref(false)

  // Reactive state: Thông tin pagination
  const pagination = ref({
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
  })

  // Action: Fetch danh sách canned responses
  const fetchResponses = async (params = {}) => {
    loading.value = true
    try {
      const response = await cannedResponseService.getAll(params)
      responses.value = response.data
      pagination.value = response.pagination || {}
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Fetch tất cả active responses (cho dropdown)
  const fetchAllActive = async (params = {}) => {
    try {
      const response = await cannedResponseService.getAllActive(params)
      responses.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Fetch popular responses
  const fetchPopular = async (limit = 10) => {
    try {
      const response = await cannedResponseService.getPopular({ limit })
      popularResponses.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Get single response
  const fetchById = async (id) => {
    try {
      const response = await cannedResponseService.getById(id)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Create new canned response
  const createResponse = async (data) => {
    loading.value = true
    try {
      const response = await cannedResponseService.create(data)
      // Thêm vào danh sách
      responses.value.unshift(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Update canned response
  const updateResponse = async (id, data) => {
    loading.value = true
    try {
      const response = await cannedResponseService.update(id, data)
      // Cập nhật trong danh sách
      const index = responses.value.findIndex(r => r.id === id)
      if (index !== -1) {
        responses.value[index] = response.data
      }
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Delete canned response
  const deleteResponse = async (id) => {
    loading.value = true
    try {
      await cannedResponseService.delete(id)
      // Lọc bỏ khỏi danh sách
      responses.value = responses.value.filter(r => r.id !== id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Preview with variables replaced
  const previewResponse = async (id, ticketId = null) => {
    try {
      const response = await cannedResponseService.preview(id, ticketId)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Increment usage count
  const incrementUsage = async (id) => {
    try {
      await cannedResponseService.incrementUsage(id)
      // Cập nhật local count
      const index = responses.value.findIndex(r => r.id === id)
      if (index !== -1) {
        responses.value[index].usage_count++
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Open modal để tạo mới
  const openCreateModal = () => {
    editingResponse.value = null
    showManagerModal.value = true
  }

  // Action: Open modal để edit
  const openEditModal = (response) => {
    editingResponse.value = { ...response }
    showManagerModal.value = true
  }

  // Action: Close modal
  const closeModal = () => {
    editingResponse.value = null
    showManagerModal.value = false
  }

  // Return state và actions
  return {
    responses,
    popularResponses,
    editingResponse,
    loading,
    showManagerModal,
    pagination,
    fetchResponses,
    fetchAllActive,
    fetchPopular,
    fetchById,
    createResponse,
    updateResponse,
    deleteResponse,
    previewResponse,
    incrementUsage,
    openCreateModal,
    openEditModal,
    closeModal,
  }
})
