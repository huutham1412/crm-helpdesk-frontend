<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { adminService } from '@/api/admin'
import DashboardLayout from '@/components/DashboardLayout.vue'
import UserFormModal from '@/components/admin/UserFormModal.vue'
import RoleAssignModal from '@/components/admin/RoleAssignModal.vue'

const toast = useToast()
const authStore = useAuthStore()

// State
const users = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
})
const loading = ref(false)
const search = ref('')
const filterRole = ref('')
const selectedUser = ref(null)

// Modals
const showUserModal = ref(false)
const showRoleModal = ref(false)
const modalMode = ref('create') // 'create' or 'edit'

// Fetch users
const fetchUsers = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      per_page: pagination.value.per_page,
    }
    if (search.value) params.search = search.value
    if (filterRole.value) params.role = filterRole.value

    const response = await adminService.getUsers(params)
    users.value = response.data.data.data
    pagination.value = {
      current_page: response.data.data.current_page,
      last_page: response.data.data.last_page,
      per_page: response.data.data.per_page,
      total: response.data.data.total,
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách người dùng')
  } finally {
    loading.value = false
  }
}

// Search handler
const handleSearch = () => {
  fetchUsers(1)
}

// Open create modal
const openCreateModal = () => {
  selectedUser.value = null
  modalMode.value = 'create'
  showUserModal.value = true
}

// Open edit modal
const openEditModal = (user) => {
  selectedUser.value = user
  modalMode.value = 'edit'
  showUserModal.value = true
}

// Open role assign modal
const openRoleModal = (user) => {
  selectedUser.value = user
  showRoleModal.value = true
}

// Toggle user status
const toggleStatus = async (user) => {
  if (user.id === authStore.user?.id) {
    toast.error('Không thể thay đổi trạng thái tài khoản của bạn')
    return
  }
  try {
    await adminService.toggleUserStatus(user.id)
    toast.success('Cập nhật trạng thái thành công')
    fetchUsers(pagination.value.current_page)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
  }
}

// Delete user
const deleteUser = async (user) => {
  if (user.id === authStore.user?.id) {
    toast.error('Không thể xóa tài khoản của bạn')
    return
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?`)) {
    return
  }
  try {
    await adminService.deleteUser(user.id)
    toast.success('Xóa người dùng thành công')
    fetchUsers(pagination.value.current_page)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi xóa người dùng')
  }
}

// Handle user saved
const handleUserSaved = () => {
  showUserModal.value = false
  fetchUsers(pagination.value.current_page)
}

// Handle roles assigned
const handleRolesAssigned = () => {
  showRoleModal.value = false
  fetchUsers(pagination.value.current_page)
}

// Role badge color
const getRoleBadgeColor = (role) => {
  const colors = {
    Admin: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    CSKH: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    User: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
  }
  return colors[role] || 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
}

// Status badge
const getStatusBadge = (user) => {
  if (user.is_active === false || user.is_active === 0) {
    return 'bg-slate-100 text-slate-600'
  }
  return 'bg-green-100 text-green-700'
}

const getStatusText = (user) => {
  if (user.is_active === false || user.is_active === 0) {
    return 'Không hoạt động'
  }
  return 'Hoạt động'
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <DashboardLayout title="Quản lý người dùng">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p class="text-slate-500 mt-1">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Thêm người dùng
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              class="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        </div>
        <div class="sm:w-48">
          <select
            v-model="filterRole"
            @change="fetchUsers(1)"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="CSKH">CSKH</option>
            <option value="User">User</option>
          </select>
        </div>
        <button
          @click="handleSearch"
          class="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
        >
          Tìm kiếm
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Người dùng</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vai trò</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngày tạo</th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-12 text-center">
                <div class="inline-flex items-center gap-3 text-slate-500">
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tải...
                </div>
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                Không tìm thấy người dùng nào
              </td>
            </tr>
            <tr v-else v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {{ user.name?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">{{ user.name }}</p>
                    <p class="text-sm text-slate-500">{{ user.email }}</p>
                    <p v-if="user.phone" class="text-xs text-slate-400">{{ user.phone }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="role in (user.roles || [])"
                    :key="typeof role === 'object' ? role.name : role"
                    class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                    :class="getRoleBadgeColor(typeof role === 'object' ? role.name : role)"
                  >
                    {{ typeof role === 'object' ? role.name : role }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  :class="getStatusBadge(user)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="user.is_active ? 'bg-green-500' : 'bg-slate-400'"></span>
                  {{ getStatusText(user) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">
                {{ new Date(user.created_at).toLocaleDateString('vi-VN') }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openRoleModal(user)"
                    class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Gán vai trò"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(user)"
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="toggleStatus(user)"
                    class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    :title="user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'"
                  >
                    <svg v-if="user.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    @click="deleteUser(user)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.last_page > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <p class="text-sm text-slate-600">
          Hiển thị {{ (pagination.current_page - 1) * pagination.per_page + 1 }} đến {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} của {{ pagination.total }} người dùng
        </p>
        <div class="flex gap-2">
          <button
            @click="fetchUsers(pagination.current_page - 1)"
            :disabled="pagination.current_page === 1"
            class="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          <button
            @click="fetchUsers(pagination.current_page + 1)"
            :disabled="pagination.current_page === pagination.last_page"
            class="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      </div>
    </div>

    <!-- User Form Modal -->
    <UserFormModal
      v-if="showUserModal"
      :show="showUserModal"
      :mode="modalMode"
      :user="selectedUser"
      @close="showUserModal = false"
      @saved="handleUserSaved"
    />

    <!-- Role Assign Modal -->
    <RoleAssignModal
      v-if="showRoleModal"
      :show="showRoleModal"
      :user="selectedUser"
      @close="showRoleModal = false"
      @assigned="handleRolesAssigned"
    />
    </div>
  </DashboardLayout>
</template>
