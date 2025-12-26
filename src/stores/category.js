import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryService } from '@/api/tickets'

// Pinia store: Quản lý categories và các operations liên quan
export const useCategoryStore = defineStore('category', () => {
  // Reactive state: Danh sách categories (tree structure)
  const categories = ref([])

  // Reactive state: Theo dõi trạng thái loading khi gọi API
  const loading = ref(false)

  // Action: Fetch tất cả categories từ API
  const fetchCategories = async () => {
    loading.value = true
    try {
      const response = await categoryService.index()
      // Lưu danh sách categories vào state
      categories.value = response.data.data
      return { success: true }
    } catch (error) {
      // Trả về error message từ API hoặc message mặc định
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Action: Tạo category mới
  const createCategory = async (data) => {
    loading.value = true
    try {
      const response = await categoryService.create(data)
      // Thêm category mới vào danh sách
      categories.value.push(response.data.data.category)
      return { success: true, category: response.data.data.category }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to create category' }
    } finally {
      loading.value = false
    }
  }

  // Action: Cập nhật category
  const updateCategory = async (id, data) => {
    loading.value = true
    try {
      const response = await categoryService.update(id, data)
      // Tìm và cập nhật category trong danh sách
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data.data.category
      }
      return { success: true, category: response.data.data.category }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update category' }
    } finally {
      loading.value = false
    }
  }

  // Action: Xóa category
  const deleteCategory = async (id) => {
    try {
      await categoryService.delete(id)
      // Lọc bỏ category đã xóa khỏi danh sách
      categories.value = categories.value.filter(c => c.id !== id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete category' }
    }
  }

  // Return state và actions để sử dụng trong components
  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
})
