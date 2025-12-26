import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ticketService, categoryService } from '@/api/tickets'

// Pinia store: Quản lý tickets, messages, và categories
export const useTicketStore = defineStore('ticket', () => {
  // Reactive state: Danh sách tickets (dùng cho list view)
  const tickets = ref([])

  // Reactive state: Ticket hiện tại (dùng cho detail view)
  const currentTicket = ref(null)

  // Reactive state: Danh sách tin nhắn của ticket
  const messages = ref([])

  // Reactive state: Danh sách categories (cho dropdown chọn category)
  const categories = ref([])

  // Reactive state: Theo dõi trạng thái loading
  const loading = ref(false)

  // Reactive state: Thông tin pagination
  const pagination = ref({
    total: 0,          // Tổng số tickets
    per_page: 20,      // Số tickets mỗi trang
    current_page: 1,   // Trang hiện tại
    last_page: 1,      // Trang cuối cùng
  })

  // Action: Fetch danh sách tickets với filters và pagination
  const fetchTickets = async (params = {}) => {
    loading.value = true
    try {
      const response = await ticketService.index(params)
      // Lưu danh sách tickets
      tickets.value = response.data.data.data
      // Lưu thông tin pagination
      pagination.value = {
        total: response.data.data.total,
        per_page: response.data.data.per_page,
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Fetch chi tiết một ticket
  const fetchTicket = async (id) => {
    loading.value = true
    try {
      const response = await ticketService.show(id)
      // Lưu ticket hiện tại vào state
      currentTicket.value = response.data.data.ticket
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Tạo ticket mới
  const createTicket = async (data) => {
    loading.value = true
    try {
      const response = await ticketService.create(data)
      // Trả về ticket vừa tạo để component có thể redirect
      return { success: true, ticket: response.data.data.ticket }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to create ticket' }
    } finally {
      loading.value = false
    }
  }

  // Action: Cập nhật ticket (status, priority, etc.)
  const updateTicket = async (id, data) => {
    loading.value = true
    try {
      const response = await ticketService.update(id, data)
      // Cập nhật ticket hiện tại với data mới
      currentTicket.value = response.data.data.ticket
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Gán ticket cho user (assign)
  const assignTicket = async (id, userId) => {
    try {
      const response = await ticketService.assign(id, userId)
      // Cập nhật ticket hiện tại
      currentTicket.value = response.data.data.ticket
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Xóa ticket
  const deleteTicket = async (id) => {
    try {
      await ticketService.delete(id)
      // Lọc bỏ ticket đã xóa khỏi danh sách
      tickets.value = tickets.value.filter(t => t.id !== id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Fetch tin nhắn của một ticket
  const fetchMessages = async (ticketId) => {
    try {
      const response = await ticketService.getMessages(ticketId)
      // Lưu danh sách tin nhắn vào state
      messages.value = response.data.data.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Gửi tin nhắn mới
  const sendMessage = async (ticketId, messageData) => {
    try {
      const response = await ticketService.sendMessage(ticketId, messageData)
      // Thêm tin nhắn mới vào danh sách
      messages.value.push(response.data.data.message)
      return { success: true, message: response.data.data.message }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Fetch danh sách categories (cho dropdown)
  const fetchCategories = async () => {
    try {
      const response = await categoryService.index()
      categories.value = response.data.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Return state và actions để sử dụng trong components
  return {
    tickets,
    currentTicket,
    messages,
    categories,
    loading,
    pagination,
    fetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    assignTicket,
    deleteTicket,
    fetchMessages,
    sendMessage,
    fetchCategories,
  }
})
