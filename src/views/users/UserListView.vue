<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const userStore = useUserStore()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Từ khóa tìm kiếm
const search = ref('')

// Reactive state: Filter theo role
const roleFilter = ref('')

// Reactive state: Điều khiển hiển thị modal edit
const showEditModal = ref(false)

// Reactive state: Điều khiển hiển thị modal delete
const showDeleteModal = ref(false)

// Reactive state: User đang được chọn để edit/delete
const selectedUser = ref(null)

// Reactive state: Dữ liệu form edit user
const editForm = ref({
  name: '',
  phone: '',
  role: '',
})

// Computed property: Chỉ Admin mới được quản lý users
const canManageUsers = computed(() => authStore.isAdmin)

// Computed property: Lọc danh sách users theo search và role
// Tự động re-filter khi search.value, roleFilter.value, hoặc userStore.users thay đổi
const filteredUsers = computed(() => {
  let result = userStore.users

  // Filter theo từ khóa (tên hoặc email)
  if (search.value) {
    const keyword = search.value.toLowerCase()
    result = result.filter(u =>
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword)
    )
  }

  // Filter theo role
  if (roleFilter.value) {
    result = result.filter(u => u.roles?.includes(roleFilter.value))
  }

  return result
})

// Hàm fetch danh sách users từ API
const fetchUsers = async () => {
  const result = await userStore.fetchUsers({
    search: search.value,
    role: roleFilter.value,
  })
  if (!result.success) {
    toast.error(result.error || 'Không thể tải danh sách users')
  }
}

// Handler: Mở modal edit và điền dữ liệu user vào form
const openEditModal = (user) => {
  selectedUser.value = user
  editForm.value = {
    name: user.name,
    phone: user.phone || '',
    role: user.roles?.[0] || '', // Lấy role đầu tiên
  }
  showEditModal.value = true
}

// Handler: Mở modal delete xác nhận xóa user
const openDeleteModal = (user) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

// Handler: Cập nhật thông tin user
const handleUpdate = async () => {
  const result = await userStore.updateUser(selectedUser.value.id, {
    name: editForm.value.name,
    phone: editForm.value.phone,
    role: editForm.value.role,
  })

  if (result.success) {
    toast.success('Cập nhật user thành công')
    showEditModal.value = false
    fetchUsers() // Refresh danh sách
  } else {
    toast.error(result.error || 'Không thể cập nhật user')
  }
}

// Handler: Xóa user
const handleDelete = async () => {
  // Security check: Không cho phép xóa chính mình
  if (selectedUser.value.id === authStore.user.id) {
    toast.error('Không thể xóa chính mình')
    return
  }

  const result = await userStore.deleteUser(selectedUser.value.id)
  if (result.success) {
    toast.success('Xóa user thành công')
    showDeleteModal.value = false
    fetchUsers() // Refresh danh sách
  } else {
    toast.error(result.error || 'Không thể xóa user')
  }
}

// Hàm lấy viết tắt tên user (ví dụ: "Nguyen Van A" -> "NA")
const getUserInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Hàm trả về CSS class cho badge role
const getRoleClass = (role) => {
  const classes = {
    Admin: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 border-purple-300',
    CSKH: 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-300',
    User: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300',
  }
  return classes[role] || 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300'
}

// Hàm trả về SVG path icon cho role
const getRoleIcon = (role) => {
  const icons = {
    Admin: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    CSKH: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    User: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  }
  return icons[role] || icons.User
}

// Lifecycle hook: Fetch users khi component được mount
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Quản lý Users</h1>
          <p class="text-slate-500 mt-1">Quản lý tài khoản và phân quyền trong hệ thống</p>
        </div>
        <div class="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>

      <!-- Filters -->
      <div class="card shadow-soft animate-slide-up">
        <div class="p-5 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-900">Bộ lọc</h3>
          </div>
        </div>
        <div class="p-5">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                v-model="search"
                type="text"
                placeholder="Tìm kiếm theo tên, email..."
                class="input pl-12"
                @input="fetchUsers"
              />
            </div>
            <select
              v-model="roleFilter"
              class="input sm:w-48"
              @change="fetchUsers"
            >
              <option value="">Tất cả roles</option>
              <option value="Admin">Admin</option>
              <option value="CSKH">CSKH</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card shadow-soft animate-slide-up" style="animation-delay: 0.1s">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th v-if="canManageUsers" class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td :colspan="canManageUsers ? 5 : 4" class="text-center py-12">
                  <div class="flex flex-col items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p class="text-slate-500">Không tìm thấy user nào</p>
                  </div>
                </td>
              </tr>
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="group"
              >
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium shadow-lg shadow-primary-500/30">
                      {{ getUserInitials(user.name) }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">{{ user.name }}</p>
                      <p class="text-sm text-slate-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    v-for="role in user.roles"
                    :key="role"
                    :class="['badge inline-flex items-center gap-1', getRoleClass(role)]"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getRoleIcon(role)" />
                    </svg>
                    {{ role }}
                  </span>
                </td>
                <td>
                  <span class="text-slate-600">{{ user.phone || '-' }}</span>
                </td>
                <td>
                  <span class="text-sm text-slate-600">{{ new Date(user.created_at).toLocaleDateString('vi-VN') }}</span>
                </td>
                <td v-if="canManageUsers" class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="openEditModal(user)"
                      class="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                      title="Sửa"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      v-if="user.id !== authStore.user?.id"
                      @click="openDeleteModal(user)"
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

        <!-- Pagination -->
        <div v-if="userStore.pagination.last_page > 1" class="flex justify-between items-center px-5 py-4 border-t border-slate-100">
          <p class="text-sm text-slate-500">
            Hiển thị {{ (userStore.pagination.current_page - 1) * userStore.pagination.per_page + 1 }}
            - {{ Math.min(userStore.pagination.current_page * userStore.pagination.per_page, userStore.pagination.total) }}
            / {{ userStore.pagination.total }} users
          </p>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-900">Chỉnh sửa User</h2>
              <button @click="showEditModal = false" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Họ tên</label>
                <input v-model="editForm.name" type="text" class="input w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">SĐT</label>
                <input v-model="editForm.phone" type="text" class="input w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select v-model="editForm.role">
                  <option value="User">User</option>
                  <option value="CSKH">CSKH</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button @click="showEditModal = false" class="btn btn-secondary">
                Hủy
              </button>
              <button @click="handleUpdate" class="btn btn-primary shadow-lg shadow-primary-500/30">
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
              Bạn có chắc muốn xóa user <strong>{{ selectedUser?.name }}</strong>? Hành động này không thể hoàn tác.
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
