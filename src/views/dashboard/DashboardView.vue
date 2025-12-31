<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { dashboardService, ratingService } from '@/api/tickets'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Lưu trữ thống kê tickets
const stats = ref({
  total_tickets: 0,
  open_tickets: 0,
  resolved_tickets: 0,
  closed_tickets: 0,
  pending_tickets: 0,
})

// Advanced analytics (only for staff)
const analytics = ref({
  performance: null,
  cskh_performance: [],
  monthly_comparison: null,
  sla_stats: null,
  top_categories: [],
})

// Chart data
const chartData = ref({
  trend: {},
  hourly: [],
  daily: [],
  status: {},
  priority: {},
  category: [],
})

// Rating statistics (CSKH only)
const ratingStats = ref({
  average_rating: null,
  total_ratings: 0,
  distribution: { '5_star': 0, '4_star': 0, '3_star': 0, '2_star': 0, '1_star': 0 },
  cskh_staff: [],
})
const ratingLoading = ref(false)

// Reactive state: Danh sách tickets gần đây
const recentTickets = ref([])

// Reactive state: Theo dõi trạng thái loading
const loading = ref(true)
const analyticsLoading = ref(false)

// Selected time period for charts
const selectedPeriod = ref(30)

// Computed property
const isStaff = computed(() => authStore.isCsKH)

// Hàm fetch dữ liệu dashboard từ API
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await dashboardService.statistics(selectedPeriod.value)
    const data = response.data.data

    stats.value = {
      total_tickets: data.total_tickets || 0,
      open_tickets: data.open_tickets || 0,
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

// Hàm fetch advanced analytics (chỉ cho staff)
const fetchAnalytics = async () => {
  if (!isStaff.value) return

  analyticsLoading.value = true
  try {
    const response = await dashboardService.analytics(selectedPeriod.value)
    analytics.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    analyticsLoading.value = false
  }
}

// Hàm fetch chart data
const fetchChartData = async (type = 'trend') => {
  if (!isStaff.value) return

  try {
    const response = await dashboardService.charts(type, selectedPeriod.value)
    chartData.value[type] = response.data.data
  } catch (error) {
    console.error(`Failed to fetch ${type} chart:`, error)
  }
}

// Fetch all chart types
const fetchAllCharts = async () => {
  if (!isStaff.value) return

  await Promise.all([
    fetchChartData('trend'),
    fetchChartData('hourly'),
    fetchChartData('daily'),
    fetchChartData('status'),
    fetchChartData('priority'),
  ])
}

// Handle period change
const onPeriodChange = async (period) => {
  selectedPeriod.value = period
  await fetchDashboardData()
  await fetchAnalytics()
  await fetchAllCharts()
  await fetchRatingStats()
}

// Fetch rating statistics (CSKH only)
const fetchRatingStats = async () => {
  if (!isStaff.value) return

  ratingLoading.value = true
  try {
    const response = await ratingService.cskhStats(selectedPeriod.value)
    ratingStats.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch rating stats:', error)
  } finally {
    ratingLoading.value = false
  }
}

// Lifecycle hook
onMounted(async () => {
  await fetchDashboardData()
  if (isStaff.value) {
    await fetchAnalytics()
    await fetchAllCharts()
    await fetchRatingStats()
  }
})

// Helper functions
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

const getPriorityClass = (priority) => {
  const classes = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    urgent: 'badge-urgent',
  }
  return classes[priority] || 'badge-low'
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

const currentDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('vi-VN', options)
})

const statusLabels = {
  open: 'Mới',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  pending: 'Chờ xử lý',
}

const priorityLabels = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

// Format number with comma
const formatNumber = (num) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

// Format minutes to readable time
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 phút'
  if (minutes < 60) return `${Math.round(minutes)} phút`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}p` : `${hours} giờ`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days} ngày ${remainingHours}h` : `${days} ngày`
}

// Get trend icon
const getTrendIcon = (trend) => {
  return trend === 'up' ? '↑' : '↓'
}

const getTrendClass = (trend) => {
  return trend === 'up' ? 'text-green-600' : 'text-red-600'
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
        <div class="flex items-center gap-3">
          <!-- Period selector (staff only) -->
          <select
            v-if="isStaff"
            v-model="selectedPeriod"
            @change="onPeriodChange(Number($event.target.value))"
            class="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option :value="7">7 ngày qua</option>
            <option :value="30">30 ngày qua</option>
            <option :value="90">90 ngày qua</option>
          </select>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-slide-up">
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

      <!-- Advanced Analytics Section (Staff Only) -->
      <div v-if="isStaff" class="space-y-6 animate-slide-up" style="animation-delay: 0.1s">
        <!-- Performance Metrics & Monthly Comparison -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Performance Metrics -->
          <div class="card shadow-soft">
            <div class="card-header">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Hiệu suất hoạt động</h2>
                  <p class="text-sm text-slate-500">Số liệu hiệu quả {{ selectedPeriod }} ngày qua</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div v-if="analytics.performance" class="space-y-4">
                <!-- Average Tickets per Day -->
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span class="text-slate-700 font-medium">Trung bình ticket/ngày</span>
                  </div>
                  <span class="text-xl font-bold text-slate-900">{{ analytics.performance.avg_tickets_per_day }}</span>
                </div>

                <!-- Resolution Rate -->
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 text-green-600 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span class="text-slate-700 font-medium">Tỷ lệ giải quyết</span>
                  </div>
                  <span class="text-xl font-bold" :class="analytics.performance.resolution_rate >= 70 ? 'text-green-600' : 'text-orange-600'">
                    {{ analytics.performance.resolution_rate }}%
                  </span>
                </div>

                <!-- Avg First Response Time -->
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span class="text-slate-700 font-medium">Thời gian phản hồi đầu</span>
                  </div>
                  <span class="text-xl font-bold text-slate-900">{{ formatDuration(analytics.performance.avg_first_response_time) }}</span>
                </div>

                <!-- Overdue Tickets -->
                <div class="flex items-center justify-between p-4" :class="analytics.performance.overdue_tickets > 0 ? 'bg-red-50' : 'bg-slate-50'">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg" :class="analytics.performance.overdue_tickets > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span class="font-medium">Ticket quá hạn</span>
                  </div>
                  <span class="text-xl font-bold" :class="analytics.performance.overdue_tickets > 0 ? 'text-red-600' : 'text-slate-900'">
                    {{ analytics.performance.overdue_tickets }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-8 text-slate-500">
                Đang tải dữ liệu...
              </div>
            </div>
          </div>

          <!-- Monthly Comparison -->
          <div class="card shadow-soft">
            <div class="card-header">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">So sánh tháng</h2>
                  <p class="text-sm text-slate-500">Tháng này vs tháng trước</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div v-if="analytics.monthly_comparison" class="space-y-6">
                <!-- Current Month -->
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-slate-500">{{ analytics.monthly_comparison.current_month.label }}</p>
                    <p class="text-3xl font-bold text-slate-900">{{ analytics.monthly_comparison.current_month.count }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-slate-500">{{ analytics.monthly_comparison.previous_month.label }}</p>
                    <p class="text-2xl font-semibold text-slate-600">{{ analytics.monthly_comparison.previous_month.count }}</p>
                  </div>
                </div>

                <!-- Change indicator -->
                <div class="flex items-center justify-center p-4 rounded-xl" :class="analytics.monthly_comparison.trend === 'up' ? 'bg-green-50' : 'bg-red-50'">
                  <span class="text-2xl mr-2" :class="getTrendClass(analytics.monthly_comparison.trend)">
                    {{ getTrendIcon(analytics.monthly_comparison.trend) }}
                  </span>
                  <span class="text-lg font-semibold" :class="getTrendClass(analytics.monthly_comparison.trend)">
                    {{ Math.abs(analytics.monthly_comparison.change_percent) }}%
                  </span>
                  <span class="text-slate-600 ml-2">so với tháng trước</span>
                </div>
              </div>
              <div v-else class="text-center py-8 text-slate-500">
                Đang tải dữ liệu...
              </div>
            </div>
          </div>
        </div>

        <!-- SLA Stats & Top Categories -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- SLA Compliance -->
          <div class="card shadow-soft">
            <div class="card-header">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg shadow-rose-500/30">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">SLA Compliance</h2>
                  <p class="text-sm text-slate-500">Tuân thủ thời gian cam kết</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div v-if="analytics.sla_stats" class="space-y-6">
                <!-- Urgent SLA -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-slate-700">Khẩn cấp (&lt; 4h)</span>
                    <span class="text-sm font-semibold" :class="analytics.sla_stats.urgent.sla_rate >= 80 ? 'text-green-600' : 'text-red-600'">
                      {{ analytics.sla_stats.urgent.sla_rate }}%
                    </span>
                  </div>
                  <div class="w-full bg-slate-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      :class="analytics.sla_stats.urgent.sla_rate >= 80 ? 'bg-green-500' : 'bg-red-500'"
                      :style="{ width: analytics.sla_stats.urgent.sla_rate + '%' }"
                    ></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">{{ analytics.sla_stats.urgent.within_sla }}/{{ analytics.sla_stats.urgent.total }} trong SLA</p>
                </div>

                <!-- High SLA -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-slate-700">Cao (&lt; 24h)</span>
                    <span class="text-sm font-semibold" :class="analytics.sla_stats.high.sla_rate >= 80 ? 'text-green-600' : 'text-orange-600'">
                      {{ analytics.sla_stats.high.sla_rate }}%
                    </span>
                  </div>
                  <div class="w-full bg-slate-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      :class="analytics.sla_stats.high.sla_rate >= 80 ? 'bg-green-500' : 'bg-orange-500'"
                      :style="{ width: analytics.sla_stats.high.sla_rate + '%' }"
                    ></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">{{ analytics.sla_stats.high.within_sla }}/{{ analytics.sla_stats.high.total }} trong SLA</p>
                </div>
              </div>
              <div v-else class="text-center py-8 text-slate-500">
                Đang tải dữ liệu...
              </div>
            </div>
          </div>

          <!-- Top Categories -->
          <div class="card shadow-soft">
            <div class="card-header">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/30">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Danh mục phổ biến</h2>
                  <p class="text-sm text-slate-500">Top 5 danh mục nhiều ticket nhất</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div v-if="analytics.top_categories.length > 0" class="space-y-3">
                <div
                  v-for="(cat, index) in analytics.top_categories"
                  :key="cat.name"
                  class="flex items-center gap-3"
                >
                  <span class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                    :class="index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'">
                    {{ index + 1 }}
                  </span>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900">{{ cat.name }}</p>
                    <div class="w-full bg-slate-200 rounded-full h-2 mt-1">
                      <div
                        class="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                        :style="{ width: (cat.count / analytics.top_categories[0].count * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-slate-600">{{ cat.count }}</span>
                </div>
              </div>
              <div v-else class="text-center py-8 text-slate-500">
                Chưa có dữ liệu
              </div>
            </div>
          </div>
        </div>

        <!-- Rating Statistics (CSKH Only) -->
        <div class="card shadow-soft">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Đánh giá từ khách hàng</h2>
                <p class="text-sm text-slate-500">Thống kê đánh giá {{ selectedPeriod }} ngày qua</p>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div v-if="ratingLoading" class="text-center py-8 text-slate-500">
              Đang tải dữ liệu...
            </div>
            <div v-else-if="ratingStats.total_ratings > 0" class="space-y-6">
              <!-- Overall Rating Summary -->
              <div class="flex items-center justify-between p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <div class="flex items-center gap-4">
                  <div class="text-5xl font-bold text-amber-600">
                    {{ ratingStats.average_rating?.toFixed(1) || '-' }}
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Đánh giá trung bình</p>
                    <div class="flex items-center gap-1 mt-1">
                      <svg
                        v-for="i in 5"
                        :key="i"
                        class="w-5 h-5"
                        :class="i <= Math.round(ratingStats.average_rating || 0) ? 'text-amber-400' : 'text-gray-300'"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span class="text-sm text-slate-600 ml-2">{{ ratingStats.total_ratings }} đánh giá</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-slate-500">Tổng số</p>
                  <p class="text-2xl font-bold text-slate-900">{{ ratingStats.total_ratings }}</p>
                </div>
              </div>

              <!-- Rating Distribution & CSKH Staff Table -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Rating Distribution -->
                <div>
                  <h3 class="text-sm font-semibold text-slate-700 mb-4">Phân bố đánh giá</h3>
                  <div class="space-y-3">
                    <div v-for="star in 5" :key="star" class="flex items-center gap-3">
                      <span class="text-sm text-slate-600 w-16">{{ star }} sao</span>
                      <div class="flex-1 bg-slate-100 rounded-full h-3">
                        <div
                          class="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                          :style="{ width: (ratingStats.distribution[star + '_star'] || 0) / (ratingStats.total_ratings || 1) * 100 + '%' }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-slate-700 w-12 text-right">
                        {{ ratingStats.distribution[star + '_star'] || 0 }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- CSKH Staff Leaderboard -->
                <div>
                  <h3 class="text-sm font-semibold text-slate-700 mb-4">Bảng xếp hạng CSKH</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(cskh, index) in ratingStats.cskh_staff.slice(0, 5)"
                      :key="cskh.id"
                      class="flex items-center gap-3 p-3 rounded-xl"
                      :class="index === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'"
                    >
                      <span
                        class="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold"
                        :class="index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'"
                      >
                        {{ index + 1 }}
                      </span>
                      <div class="flex-1">
                        <p class="font-medium text-slate-900">{{ cskh.name }}</p>
                        <div class="flex items-center gap-2 text-sm text-slate-500">
                          <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>{{ cskh.avg_rating?.toFixed(1) || '-' }}</span>
                          <span class="text-slate-400">•</span>
                          <span>{{ cskh.total_ratings }} đánh giá</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 mb-1">Chưa có đánh giá nào</h3>
              <p class="text-slate-500">Khi khách hàng đánh giá, thống kê sẽ hiển thị ở đây</p>
            </div>
          </div>
        </div>

        <!-- CSKH Performance Table -->
        <div class="card shadow-soft">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg shadow-pink-500/30">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Hiệu suất CSKH</h2>
                <p class="text-sm text-slate-500">Xếp hạng theo số ticket đã giải quyết</p>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div v-if="analytics.cskh_performance.length > 0" class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th class="text-center">Được gán</th>
                    <th class="text-center">Đã giải quyết</th>
                    <th class="text-center">Đã đóng</th>
                    <th class="text-center">TB thời gian</th>
                    <th class="text-center">Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cskh, index) in analytics.cskh_performance" :key="cskh.id">
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                          :class="index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'">
                          {{ index + 1 }}
                        </span>
                        <span class="font-medium text-slate-900">{{ cskh.name }}</span>
                      </div>
                    </td>
                    <td class="text-center text-slate-600">{{ cskh.total_assigned }}</td>
                    <td class="text-center">
                      <span class="font-semibold text-green-600">{{ cskh.total_resolved }}</span>
                    </td>
                    <td class="text-center text-slate-600">{{ cskh.total_closed }}</td>
                    <td class="text-center text-slate-900">{{ formatDuration(cskh.avg_resolution_time) }}</td>
                    <td class="text-center">
                      <span class="px-2 py-1 rounded-lg text-sm font-medium"
                        :class="cskh.completion_rate >= 80 ? 'bg-green-100 text-green-700' : cskh.completion_rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
                        {{ cskh.completion_rate }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-8 text-slate-500">
              Chưa có dữ liệu
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tickets -->
      <div class="card shadow-soft animate-slide-up" :style="isStaff ? 'animation-delay: 0.2s' : ''">
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
                      <p v-if="ticket.category" class="text-sm text-slate-500 mt-0.5">{{ ticket.category.name }}</p>
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

      <!-- Quick Actions -->
      <div v-if="recentTickets.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" :style="isStaff ? 'animation-delay: 0.3s' : 'animation-delay: 0.2s'">
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