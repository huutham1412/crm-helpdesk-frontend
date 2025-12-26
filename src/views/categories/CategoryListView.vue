<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const categoryStore = useCategoryStore()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Điều khiển hiển thị modal tạo category
const showCreateModal = ref(false)

// Reactive state: Điều khiển hiển thị modal edit
const showEditModal = ref(false)

// Reactive state: Điều khiển hiển thị modal delete
const showDeleteModal = ref(false)

// Reactive state: Category đang được chọn để edit/delete
const selectedCategory = ref(null)

// Reactive state: Dữ liệu form category
const categoryForm = ref({
  name: '',
  description: '',
  parent_id: null, // null = không có parent (root category)
  is_active: true,
})

// Computed property: Chỉ Admin mới được quản lý categories
const canManageCategories = computed(() => authStore.isAdmin)

// Computed property: Biến đổi cấu trúc cây categories thành danh sách phẳng
// Recursive function để flatten tree structure thành array với level
// Ví dụ: [{id:1, name:'Tech', level:0}, {id:2, name:'Bug', level:1}, ...]
const flattenedCategories = computed(() => {
  const flatten = (categories, level = 0) => {
    let result = []
    for (const cat of categories) {
      result.push({ ...cat, level })
      // Đệ quy: Xử lý children categories
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flatten(cat.children, level + 1))
      }
    }
    return result
  }
  return flatten(categoryStore.categories)
})

// Hàm fetch danh sách categories từ API
const fetchCategories = async () => {
  const result = await categoryStore.fetchCategories()
  if (!result.success) {
    toast.error(result.error || 'Không thể tải danh sách categories')
  }
}

// Handler: Mở modal tạo category mới và reset form
const openCreateModal = () => {
  categoryForm.value = {
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  }
  showCreateModal.value = true
}

// Handler: Mở modal edit và điền dữ liệu category vào form
const openEditModal = (category) => {
  selectedCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    parent_id: category.parent_id || null,
    is_active: category.is_active ?? true, // ?? operator để xử lý null/undefined
  }
  showEditModal.value = true
}

// Handler: Mở modal delete xác nhận xóa category
const openDeleteModal = (category) => {
  selectedCategory.value = category
  showDeleteModal.value = true
}

// Handler: Tạo category mới
const handleCreate = async () => {
  const result = await categoryStore.createCategory(categoryForm.value)
  if (result.success) {
    toast.success('Tạo category thành công')
    showCreateModal.value = false
    fetchCategories() // Refresh danh sách
  } else {
    toast.error(result.error || 'Không thể tạo category')
  }
}

// Handler: Cập nhật category
const handleUpdate = async () => {
  const result = await categoryStore.updateCategory(selectedCategory.value.id, categoryForm.value)
  if (result.success) {
    toast.success('Cập nhật category thành công')
    showEditModal.value = false
    fetchCategories() // Refresh danh sách
  } else {
    toast.error(result.error || 'Không thể cập nhật category')
  }
}

// Handler: Xóa category
const handleDelete = async () => {
  const result = await categoryStore.deleteCategory(selectedCategory.value.id)
  if (result.success) {
    toast.success('Xóa category thành công')
    showDeleteModal.value = false
    fetchCategories() // Refresh danh sách
  } else {
    toast.error(result.error || 'Không thể xóa category')
  }
}

// Hàm trả về class và text cho badge trạng thái
const getStatusBadge = (isActive) => ({
  class: isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300',
  text: isActive ? 'Hoạt động' : 'Đã khóa',
})

// Computed property: Tạo options cho dropdown chọn parent category
// Loại trừ category hiện tại khi edit để tránh tạo circular reference
const parentOptions = computed(() => {
  const options = [{ id: null, name: '-- Không có parent --' }]
  const addOptions = (categories, prefix = '') => {
    for (const cat of categories) {
      // Validation: Không cho phép chọn chính mình làm parent (tránh circular reference)
      if (selectedCategory.value && cat.id === selectedCategory.value.id) continue
      options.push({ id: cat.id, name: prefix + cat.name })
      // Đệ quy để thêm children với indent
      if (cat.children) {
        addOptions(cat.children, prefix + '— ')
      }
    }
  }
  addOptions(categoryStore.categories)
  return options
})

// Lifecycle hook: Fetch categories khi component được mount
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Quản lý Categories</h1>
          <p class="text-slate-500 mt-1">Phân loại và tổ chức các tickets hỗ trợ</p>
        </div>
        <button
          v-if="canManageCategories"
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-medium rounded-xl hover:from-pink-700 hover:to-pink-600 transition-all shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Category
        </button>
      </div>

      <!-- Categories Table -->
      <div class="card shadow-soft animate-slide-up">
        <div class="p-5 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg shadow-pink-500/30">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Danh sách Categories</h3>
              <p class="text-sm text-slate-500">{{ flattenedCategories.length }} danh mục</p>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Số tickets</th>
                <th v-if="canManageCategories" class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="flattenedCategories.length === 0">
                <td :colspan="canManageCategories ? 5 : 4" class="text-center py-12">
                  <div class="flex flex-col items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <p class="text-slate-500">Không tìm thấy category nào</p>
                    <button
                      v-if="canManageCategories"
                      @click="openCreateModal"
                      class="mt-4 text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo category đầu tiên
                    </button>
                  </div>
                </td>
              </tr>
              <tr
                v-for="category in flattenedCategories"
                :key="category.id"
                class="group"
              >
                <td>
                  <div class="flex items-center gap-2">
                    <span
                      v-if="category.level > 0"
                      class="text-slate-300 flex"
                      :style="{ width: category.level * 16 + 'px' }"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span class="font-medium text-slate-900">{{ category.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-sm text-slate-600 max-w-xs truncate block">{{ category.description || '-' }}</span>
                </td>
                <td>
                  <span
                    :class="['badge', getStatusBadge(category.is_active).class]"
                  >
                    {{ getStatusBadge(category.is_active).text }}
                  </span>
                </td>
                <td>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
                    <svg class="w-4 h-4 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {{ category.tickets_count || 0 }}
                  </span>
                </td>
                <td v-if="canManageCategories" class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="openEditModal(category)"
                      class="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                      title="Sửa"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="openDeleteModal(category)"
                      class="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Xóa"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Transition name="fade">
      <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-900">Tạo Category mới</h2>
              <button @click="showCreateModal = false" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Tên *</label>
                <input v-model="categoryForm.name" type="text" class="input w-full" placeholder="VD: Hỗ trợ kỹ thuật" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea v-model="categoryForm.description" class="input w-full" rows="3" placeholder="Mô tả về category"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Category cha</label>
                <select v-model="categoryForm.parent_id">
                  <option v-for="opt in parentOptions" :key="opt.id || 'null'" :value="opt.id">
                    {{ opt.name }}
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="categoryForm.is_active"
                  type="checkbox"
                  id="isActive"
                  class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label for="isActive" class="text-sm text-slate-700">Hoạt động</label>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button @click="showCreateModal = false" class="btn btn-secondary">
                Hủy
              </button>
              <button @click="handleCreate" :disabled="!categoryForm.name" class="btn btn-primary shadow-lg shadow-pink-500/30">
                Tạo
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Edit Modal -->
    <Transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-900">Chỉnh sửa Category</h2>
              <button @click="showEditModal = false" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Tên *</label>
                <input v-model="categoryForm.name" type="text" class="input w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea v-model="categoryForm.description" class="input w-full" rows="3"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Category cha</label>
                <select v-model="categoryForm.parent_id">
                  <option v-for="opt in parentOptions" :key="opt.id || 'null'" :value="opt.id">
                    {{ opt.name }}
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="categoryForm.is_active"
                  type="checkbox"
                  id="editIsActive"
                  class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label for="editIsActive" class="text-sm text-slate-700">Hoạt động</label>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button @click="showEditModal = false" class="btn btn-secondary">
                Hủy
              </button>
              <button @click="handleUpdate" :disabled="!categoryForm.name" class="btn btn-primary shadow-lg shadow-pink-500/30">
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Modal -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
          <div class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="p-3 bg-red-100 rounded-full">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900">Xác nhận xóa</h2>
            </div>
            <p class="text-slate-600 mb-6">
              Bạn có chắc muốn xóa category <strong>{{ selectedCategory?.name }}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div class="flex justify-end gap-3">
              <button @click="showDeleteModal = false" class="btn btn-secondary">
                Hủy
              </button>
              <button @click="handleDelete" class="btn btn-danger shadow-lg shadow-red-500/30">
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </DashboardLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
