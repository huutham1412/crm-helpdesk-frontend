<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Props nhận từ component con (title của trang)
const props = defineProps({
  title: String,
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// Reactive state: Điều khiển sidebar mở/đóng trên mobile
const sidebarOpen = ref(false)

// Reactive state: Điều khiển sidebar thu nhỏ/mở rộng trên desktop
const sidebarCollapsed = ref(false)

// Reactive state: Điều khiển user dropdown
const userDropdownOpen = ref(false)

// Computed property: Danh sách menu chính (dashboard, tickets, new ticket)
// Static data được computed để có thể filter theo role
const menuItems = computed(() => [
  {
    name: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    path: '/dashboard',
    roles: ['Admin', 'CSKH', 'User'],
    color: 'text-violet-500',
  },
  {
    name: 'Tickets',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    path: '/tickets',
    roles: ['Admin', 'CSKH', 'User'],
    color: 'text-blue-500',
  },
  {
    name: 'Tạo Ticket',
    icon: 'M12 4v16m8-8H4',
    path: '/tickets/create',
    roles: ['Admin', 'CSKH', 'User'],
    color: 'text-emerald-500',
    highlight: true, // Đánh dấu là menu quan trọng
  },
])

// Computed property: Danh sách menu admin (users, categories)
// Chỉ hiển thị với user có role Admin
const adminMenuItems = computed(() => [
  {
    name: 'Users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    path: '/users',
    roles: ['Admin'],
    color: 'text-amber-500',
  },
  {
    name: 'Categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    path: '/categories',
    roles: ['Admin'],
    color: 'text-pink-500',
  },
])

// Computed property: Lọc menu chính theo role của user hiện tại
// Tự động cập nhật khi authStore.user.roles thay đổi
const filteredMenuItems = computed(() => {
  return menuItems.value.filter(item =>
    item.roles.some(role => authStore.user?.roles?.includes(role))
  )
})

// Computed property: Lọc menu admin theo role của user hiện tại
const filteredAdminMenuItems = computed(() => {
  return adminMenuItems.value.filter(item =>
    item.roles.some(role => authStore.user?.roles?.includes(role))
  )
})

// Hàm kiểm tra xem menu item có đang active không (dùng để highlight)
// Kiểm tra exact match hoặc prefix match (cho nested routes)
const isActive = (path) => {
  if (path === route.path) return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

// Computed property: Lấy viết tắt tên user (ví dụ: "Nguyen Van A" -> "NA")
const userInitials = computed(() => {
  const name = authStore.userName || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Handler: Xử lý đăng xuất
const handleLogout = async () => {
  await authStore.logout()
  toast.success('Đã đăng xuất')
  router.push('/login') // Điều hướng về trang login
}

// Handler: Toggle user dropdown
const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value
}

// Computed property: Menu items cho user dropdown
const userDropdownItems = computed(() => [
  {
    label: 'Thông tin cá nhân',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    action: () => router.push('/profile')
  },
  {
    label: 'Đổi mật khẩu',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 011-1V7a1 1 0 011-1h3a1 1 0 011 1v2.586a1 1 0 001.293.707',
    action: () => router.push('/change-password')
  },
  {
    label: 'Đăng xuất',
    icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    action: handleLogout,
    danger: true
  }
])

// Handler: Đóng dropdown khi click ra ngoài
const handleClickOutside = (event) => {
  const dropdown = document.getElementById('user-dropdown-container')
  if (dropdown && !dropdown.contains(event.target)) {
    userDropdownOpen.value = false
  }
}

// Lifecycle hooks: Đăng ký/hủy click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Mobile sidebar backdrop - chỉ hiện khi sidebar mở trên mobile, z-index thấp hơn sidebar -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="sidebarOpen = false"
      ></div>
    </Transition>

    <div class="flex">
      <!-- Sidebar -->
      <aside
        :class="[
          'fixed lg:sticky top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-20' : 'w-72'
        ]"
      >
        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span v-show="!sidebarCollapsed" class="font-bold text-xl text-slate-900 truncate">CRM Helpdesk</span>
          </div>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Collapse Button (Desktop) -->
        <div class="hidden lg:flex justify-end px-4 py-2">
          <button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Main Menu -->
          <div>
            <p v-if="!sidebarCollapsed" class="px-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            <div class="space-y-1">
              <router-link
                v-for="item in filteredMenuItems"
                :key="item.path"
                :to="item.path"
                @click="sidebarOpen = false"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                :class="[
                  isActive(item.path)
                    ? item.highlight
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : item.highlight
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                ]"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  :class="[
                    isActive(item.path)
                      ? 'bg-white/20'
                      : item.highlight
                        ? 'bg-emerald-100'
                        : 'bg-slate-100'
                  ]"
                >
                  <svg class="w-5 h-5" :class="isActive(item.path) ? 'text-white' : item.color" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                  </svg>
                </div>
                <span v-show="!sidebarCollapsed" class="font-medium truncate">{{ item.name }}</span>
                <span v-if="item.highlight && !sidebarCollapsed && !isActive(item.path)" class="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800">
                  New
                </span>
              </router-link>
            </div>
          </div>

          <!-- Admin Menu -->
          <div v-if="filteredAdminMenuItems.length > 0">
            <p v-if="!sidebarCollapsed" class="px-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
            <div v-else class="h-px bg-slate-200 mb-3"></div>
            <div class="space-y-1">
              <router-link
                v-for="item in filteredAdminMenuItems"
                :key="item.path"
                :to="item.path"
                @click="sidebarOpen = false"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                :class="[
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                ]"
              >
                <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  :class="[
                    isActive(item.path) ? 'bg-white/20' : 'bg-slate-100'
                  ]"
                >
                  <svg class="w-5 h-5" :class="isActive(item.path) ? 'text-white' : item.color" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                  </svg>
                </div>
                <span v-show="!sidebarCollapsed" class="font-medium truncate">{{ item.name }}</span>
              </router-link>
            </div>
          </div>
        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-slate-100">
          <div class="flex items-center gap-3 p-2 rounded-xl"
            :class="[
              sidebarCollapsed ? 'justify-center' : 'hover:bg-slate-100'
            ]"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {{ userInitials }}
            </div>
            <div v-show="!sidebarCollapsed" class="min-w-0 flex-1 overflow-hidden">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ authStore.userName }}</p>
              <p class="text-xs text-slate-500 truncate">{{ authStore.user?.email }}</p>
            </div>
          </div>

          <!-- Logout Button (shown when collapsed) -->
          <button
            v-if="sidebarCollapsed"
            @click="handleLogout"
            class="mt-3 w-full flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Đăng xuất"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-h-screen">
        <!-- Top Header -->
        <header class="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div class="flex items-center justify-between h-16 px-4 lg:px-8">
            <!-- Left -->
            <div class="flex items-center gap-4">
              <button
                @click="sidebarOpen = true"
                class="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <nav class="hidden sm:flex items-center text-sm">
                <router-link to="/dashboard" class="text-slate-500 hover:text-slate-700">Dashboard</router-link>
                <svg class="w-4 h-4 text-slate-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span class="font-medium text-slate-900">{{ props.title || route.meta?.title || route.name }}</span>
              </nav>
            </div>

            <!-- Right -->
            <div class="flex items-center gap-3 relative">
              <!-- Notifications -->
              <button class="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
              </button>

              <!-- User Dropdown (Desktop) -->
              <div class="hidden sm:block relative">
                <button
                  @click="toggleUserDropdown"
                  class="flex items-center gap-3 p-1.5 pr-4 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {{ userInitials }}
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-medium text-slate-900">{{ authStore.userName }}</p>
                    <p class="text-xs text-slate-500">{{ authStore.user?.roles?.[0] || 'User' }}</p>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 transition-transform" :class="userDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <Transition
                  enter-active-class="transition ease-out duration-200"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-150"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="userDropdownOpen"
                    class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50"
                  >
                    <div
                      v-for="item in userDropdownItems"
                      :key="item.label"
                      @click="item.action(); userDropdownOpen = false"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      :class="item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'"
                    >
                      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                      </svg>
                      <span class="font-medium">{{ item.label }}</span>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Mobile logout -->
              <button
                @click="handleLogout"
                class="sm:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                title="Đăng xuất"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-8">
          <div class="max-w-7xl mx-auto">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
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
