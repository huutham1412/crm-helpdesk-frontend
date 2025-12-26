<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { adminService } from '@/api/admin'
import DashboardLayout from '@/components/DashboardLayout.vue'
import RoleFormModal from '@/components/admin/RoleFormModal.vue'

const toast = useToast()

// State
const roles = ref([])
const loading = ref(false)
const selectedRole = ref(null)
const showModal = ref(false)
const modalMode = ref('create') // 'create' or 'edit'

// Fetch roles
const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await adminService.getRoles()
    roles.value = response.data.data
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách vai trò')
  } finally {
    loading.value = false
  }
}

// Open create modal
const openCreateModal = () => {
  selectedRole.value = null
  modalMode.value = 'create'
  showModal.value = true
}

// Open edit modal
const openEditModal = (role) => {
  selectedRole.value = role
  modalMode.value = 'edit'
  showModal.value = true
}

// Delete role
const deleteRole = async (role) => {
  if (['Admin', 'CSKH', 'User'].includes(role.name)) {
    toast.error('Không thể xóa vai trò hệ thống')
    return
  }
  if (role.users_count > 0) {
    toast.error('Không thể xóa vai trò đang có người dùng')
    return
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) {
    return
  }
  try {
    await adminService.deleteRole(role.id)
    toast.success('Xóa vai trò thành công')
    fetchRoles()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi xóa vai trò')
  }
}

// Handle role saved
const handleRoleSaved = () => {
  showModal.value = false
  fetchRoles()
}

// Check if system role
const isSystemRole = (roleName) => {
  return ['Admin', 'CSKH', 'User'].includes(roleName)
}

// Get role badge color
const getRoleBadgeColor = (roleName) => {
  const colors = {
    Admin: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    CSKH: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    User: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
  }
  return colors[roleName] || 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <DashboardLayout title="Quản lý vai trò">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Quản lý vai trò</h1>
          <p class="text-slate-500 mt-1">Quản lý các vai trò và quyền hạn trong hệ thống</p>
        </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] transition-all"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Thêm vai trò
      </button>
    </div>

    <!-- Roles Grid -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="inline-flex items-center gap-3 text-slate-500">
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang tải...
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="role in roles"
        :key="role.id"
        class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="getRoleBadgeColor(role.name)">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">{{ role.name }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Guard: {{ role.guard_name }}</p>
            </div>
          </div>
          <span
            v-if="isSystemRole(role.name)"
            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
          >
            Hệ thống
          </span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Số người dùng:</span>
            <span class="font-medium text-slate-900">{{ role.users_count || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Ngày tạo:</span>
            <span class="text-slate-600">{{ new Date(role.created_at).toLocaleDateString('vi-VN') }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            @click="openEditModal(role)"
            :disabled="isSystemRole(role.name)"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isSystemRole(role.name)
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Sửa
          </button>
          <button
            @click="deleteRole(role)"
            :disabled="isSystemRole(role.name) || (role.users_count || 0) > 0"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isSystemRole(role.name) || (role.users_count || 0) > 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-red-50 text-red-600 hover:bg-red-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa
          </button>
        </div>
      </div>

      <!-- Add New Role Card -->
      <div
        @click="openCreateModal"
        class="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all group min-h-[200px]"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="text-sm font-medium text-slate-500 group-hover:text-purple-600 transition-colors">Thêm vai trò mới</span>
      </div>
    </div>

    <!-- Role Form Modal -->
    <RoleFormModal
      v-if="showModal"
      :show="showModal"
      :mode="modalMode"
      :role="selectedRole"
      @close="showModal = false"
      @saved="handleRoleSaved"
    />
    </div>
  </DashboardLayout>
</template>
