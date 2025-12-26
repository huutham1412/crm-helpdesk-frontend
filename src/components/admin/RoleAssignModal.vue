<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { adminService } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  show: Boolean,
  user: Object,
})

const emit = defineEmits(['close', 'assigned'])

const toast = useToast()
const authStore = useAuthStore()

// State
const roles = ref([])
const selectedRoles = ref([])
const loading = ref(false)
const fetchingRoles = ref(false)

// Fetch roles
const fetchRoles = async () => {
  fetchingRoles.value = true
  try {
    const response = await adminService.getRolesList()
    roles.value = response.data.data
  } catch (error) {
    console.error('Error fetching roles:', error)
  } finally {
    fetchingRoles.value = false
  }
}

// Get user's current roles
const getUserRoles = () => {
  if (!props.user?.roles) return []
  return props.user.roles.map(r => typeof r === 'object' ? r.name : r)
}

// Watch for show changes
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    fetchRoles()
    selectedRoles.value = getUserRoles()
  }
})

// Toggle role selection
const toggleRole = (roleName) => {
  const index = selectedRoles.value.indexOf(roleName)
  if (index > -1) {
    selectedRoles.value.splice(index, 1)
  } else {
    selectedRoles.value.push(roleName)
  }
}

// Assign roles
const assignRoles = async () => {
  if (selectedRoles.value.length === 0) {
    toast.error('Vui lòng chọn ít nhất một vai trò')
    return
  }

  // Prevent removing all roles from yourself
  if (props.user?.id === authStore.user?.id) {
    const hasAdminRole = selectedRoles.value.includes('Admin')
    if (!hasAdminRole) {
      toast.error('Không thể xóa vai trò Admin khỏi tài khoản của bạn')
      return
    }
  }

  loading.value = true
  try {
    await adminService.assignUserRoles(props.user.id, selectedRoles.value)
    toast.success('Gán vai trò thành công')
    emit('assigned')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi gán vai trò')
  } finally {
    loading.value = false
  }
}

// Close modal
const close = () => {
  emit('close')
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
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Gán vai trò</h2>
              <p v-if="user" class="text-sm text-slate-500 mt-1">{{ user.name }} ({{ user.email }})</p>
            </div>
            <button @click="close" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <p class="text-sm text-slate-600 mb-4">Chọn vai trò cho người dùng:</p>

            <div v-if="fetchingRoles" class="flex items-center justify-center py-8">
              <svg class="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="role in roles"
                :key="role.id"
                @click="toggleRole(role.name)"
                class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="selectedRoles.includes(role.name)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'"
              >
                <div class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors"
                  :class="selectedRoles.includes(role.name)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-slate-300'"
                >
                  <svg v-if="selectedRoles.includes(role.name)" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                  :class="getRoleBadgeColor(role.name)"
                >
                  {{ role.name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
            <button
              @click="close"
              class="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              @click="assignRoles"
              :disabled="loading || selectedRoles.length === 0"
              class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="loading">Đang xử lý...</span>
              <span v-else>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
