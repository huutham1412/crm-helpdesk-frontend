<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { dashboardService } from '@/api/tickets'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Lưu trữ thống kê tickets
// ref() tạo reactive reference, khi giá trị thay đổi thì Vue sẽ tự động update UI
const stats = ref({
  total_tickets: 0,
  open_tickets: 0,
  processing_tickets: 0,
  resolved_tickets: 0,
  closed_tickets: 0,
  pending_tickets: 0,
})

// Reactive state: Danh sách tickets gần đây
const recentTickets = ref([])

// Reactive state: Theo dõi trạng thái loading
const loading = ref(true)

// Computed property: Tự động tính toán lại khi authStore.isCsKH thay đổi
// Computed properties được cache và chỉ tính lại khi dependencies thay đổi
const isStaff = computed(() => authStore.isCsKH)

// Hàm fetch dữ liệu dashboard từ API
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await dashboardService.statistics()
    const data = response.data.data

    // Cập nhật stats.value để trigger reactivity
    stats.value = {
      total_tickets: data.total_tickets || 0,
      open_tickets: data.open_tickets || 0,
      processing_tickets: data.processing_tickets || 0,
      resolved_tickets: data.resolved_tickets || 0,
      closed_tickets: data.closed_tickets || 0,
      pending_tickets: data.pending_tickets || 0,
    }
    recentTickets.value = data.recent_tickets || []
  } catch (error) {
    toast.error('Không thể tải dữ liệu dashboard')
  } finally {
    loading.value = false
  }
}

// Lifecycle hook: Được gọi sau khi component được mount vào DOM
// Đây là nơi phù hợp để gọi API fetch dữ liệu ban đầu
onMounted(() => {
  fetchDashboardData()
})

// Hàm trả về CSS class tương ứng với trạng thái ticket
const getStatusClass = (status) => {
  const classes = {
    open: 'badge-open',
    processing: 'badge-processing',
    resolved: 'badge-resolved',
    closed: 'badge-closed',
    pending: 'badge-pending',
  }
  return classes[status] || 'badge-closed'
}

// Hàm trả về CSS class tương ứng với mức độ ưu tiên
const getPriorityClass = (priority) => {
  const classes = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    urgent: 'badge-urgent',
  }
  return classes[priority] || 'badge-low'
}

// Hàm trả về lời chào theo thời gian hiện tại
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

// Computed property: Tự động format ngày hiện tại theo tiếng Việt
// Sẽ tự động cập nhật khi component re-render
const currentDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('vi-VN', options)
})

// Mapping trạng thái sang label tiếng Việt
const statusLabels = {
  open: 'Mới',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  pending: 'Chờ xử lý',
}

// Mapping độ ưu tiên sang label tiếng Việt
const priorityLabels = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <div class="mb-8 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ getGreeting() }}, {{ authStore.userName }}!</h1>
          <p class="text-slate-500 mt-1 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ currentDate }}
          </p>
        </div>
        <router-link
          to="/tickets/create"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo Ticket mới
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-64 animate-fade-in">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
        <div class="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p class="mt-4 text-slate-500">Đang tải dữ liệu...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-slide-up">
        <!-- Total Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Tổng</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.total_tickets }}</p>
            <p class="text-violet-100 text-sm mt-1">Tất cả tickets</p>
          </div>
        </div>

        <!-- Open Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Mới</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.open_tickets }}</p>
            <p class="text-blue-100 text-sm mt-1">Đang mở</p>
          </div>
        </div>

        <!-- Processing Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Đang xử lý</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.processing_tickets }}</p>
            <p class="text-amber-100 text-sm mt-1">Đang xử lý</p>
          </div>
        </div>

        <!-- Pending Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Chờ</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.pending_tickets }}</p>
            <p class="text-orange-100 text-sm mt-1">Chờ xử lý</p>
          </div>
        </div>

        <!-- Resolved Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Xong</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.resolved_tickets }}</p>
            <p class="text-emerald-100 text-sm mt-1">Đã giải quyết</p>
          </div>
        </div>

        <!-- Closed Tickets -->
        <div class="relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative p-5 text-white">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Đóng</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.closed_tickets }}</p>
            <p class="text-slate-200 text-sm mt-1">Đã đóng</p>
          </div>
        </div>
      </div>

      <!-- Recent Tickets -->
      <div class="card shadow-soft animate-slide-up" style="animation-delay: 0.1s">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/30">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Tickets gần đây</h2>
                <p class="text-sm text-slate-500">Các ticket được cập nhật gần nhất</p>
              </div>
            </div>
            <router-link
              to="/tickets"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors px-4 py-2 rounded-xl hover:bg-primary-50"
            >
              Xem tất cả
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
        </div>

        <div class="card-body">
          <!-- Empty State -->
          <div v-if="recentTickets.length === 0" class="text-center py-16">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
              <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-1">Chưa có ticket nào</h3>
            <p class="text-slate-500 mb-4">Bắt đầu bằng cách tạo ticket hỗ trợ đầu tiên</p>
            <router-link
              to="/tickets/create"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Tạo ticket ngay
            </router-link>
          </div>

          <!-- Tickets List -->
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-24">Mã ticket</th>
                  <th>Tiêu đề</th>
                  <th class="w-32">Trạng thái</th>
                  <th class="w-32">Ưu tiên</th>
                  <th class="w-24">Ngày tạo</th>
                  <th class="w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ticket in recentTickets"
                  :key="ticket.id"
                  class="group cursor-pointer"
                >
                  <td>
                    <span class="inline-flex items-center font-mono text-sm text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg font-medium">
                      {{ ticket.ticket_number }}
                    </span>
                  </td>
                  <td>
                    <router-link :to="`/tickets/${ticket.id}`" class="block">
                      <span class="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">{{ ticket.subject }}</span>
                      <p v-if="ticket.category_name" class="text-sm text-slate-500 mt-0.5">{{ ticket.category_name }}</p>
                    </router-link>
                  </td>
                  <td>
                    <span :class="['badge', getStatusClass(ticket.status)]">
                      {{ statusLabels[ticket.status] || ticket.status }}
                    </span>
                  </td>
                  <td>
                    <span :class="['badge', getPriorityClass(ticket.priority)]">
                      {{ priorityLabels[ticket.priority] || ticket.priority }}
                    </span>
                  </td>
                  <td>
                    <span class="text-sm text-slate-600">{{ ticket.created_at }}</span>
                  </td>
                  <td>
                    <router-link
                      :to="`/tickets/${ticket.id}`"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Actions (for empty state or as secondary section) -->
      <div v-if="recentTickets.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style="animation-delay: 0.2s">
        <!-- Quick Action 1: New Ticket -->
        <router-link
          to="/tickets/create"
          class="card p-5 group hover:shadow-soft transition-all hover:-translate-y-1 border-2 border-dashed border-slate-200 hover:border-primary-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Tạo Ticket mới</h3>
              <p class="text-sm text-slate-500">Gửi yêu cầu hỗ trợ</p>
            </div>
          </div>
        </router-link>

        <!-- Quick Action 2: View All Tickets -->
        <router-link
          to="/tickets"
          class="card p-5 group hover:shadow-soft transition-all hover:-translate-y-1 border-2 border-dashed border-slate-200 hover:border-blue-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Danh sách Tickets</h3>
              <p class="text-sm text-slate-500">Xem tất cả tickets</p>
            </div>
          </div>
        </router-link>

        <!-- Quick Action 3: Categories (if staff) -->
        <router-link
          v-if="isStaff"
          to="/categories"
          class="card p-5 group hover:shadow-soft transition-all hover:-translate-y-1 border-2 border-dashed border-slate-200 hover:border-pink-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Danh mục</h3>
              <p class="text-sm text-slate-500">Quản lý danh mục</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </DashboardLayout>
</template>
