import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '@/api/users'

// Pinia store: Quản lý users và các operations liên quan
export const useUserStore = defineStore('user', () => {
  // Reactive state: Danh sách users
  const users = ref([])

  // Reactive state: Danh sách CSKH (để assign tickets)
  const cskhList = ref([])

  // Reactive state: Thống kê users
  const statistics = ref(null)

  // Reactive state: Theo dõi trạng thái loading
  const loading = ref(false)

  // Reactive state: Thông tin pagination
  const pagination = ref({
    total: 0,          // Tổng số users
    per_page: 20,      // Số users mỗi trang
    current_page: 1,   // Trang hiện tại
    last_page: 1,      // Trang cuối cùng
  })

  // Action: Fetch danh sách users với filters và pagination
  const fetchUsers = async (params = {}) => {
    loading.value = true
    try {
      const response = await userService.index(params)
      // Lưu danh sách users
      users.value = response.data.data.data
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

  // Action: Fetch thống kê users (cho dashboard)
  const fetchStatistics = async () => {
    try {
      const response = await userService.statistics()
      statistics.value = response.data.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Fetch danh sách CSKH staff
  // Dùng để hiển thị dropdown assign ticket
  const fetchCskhList = async () => {
    try {
      const response = await userService.cskhList()
      cskhList.value = response.data.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  }

  // Action: Cập nhật thông tin user
  const updateUser = async (id, data) => {
    loading.value = true
    try {
      const response = await userService.update(id, data)
      // Tìm và cập nhật user trong danh sách
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = response.data.data.user
      }
      return { success: true, user: response.data.data.user }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update user' }
    } finally {
      loading.value = false
    }
  }

  // Action: Xóa user
  const deleteUser = async (id) => {
    try {
      await userService.delete(id)
      // Lọc bỏ user đã xóa khỏi danh sách
      users.value = users.value.filter(u => u.id !== id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete user' }
    }
  }

  // Return state và actions để sử dụng trong components
  return {
    users,
    cskhList,
    statistics,
    loading,
    pagination,
    fetchUsers,
    fetchStatistics,
    fetchCskhList,
    updateUser,
    deleteUser,
  }
})
