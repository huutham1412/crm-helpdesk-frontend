<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const router = useRouter()
const ticketStore = useTicketStore()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Lưu trữ các bộ lọc tickets
// Mỗi khi filters.value thay đổi, computed properties dependent sẽ tự động cập nhật
const filters = ref({
  status: '',
  priority: '',
  search: '',
})

// Reactive state: Theo dõi trạng thái loading khi fetch data
const loading = ref(false)

// Computed properties: Tự động lấy tickets từ store
// Khi ticketStore.tickets thay đổi, tickets computed sẽ tự động update
const tickets = computed(() => ticketStore.tickets)
const pagination = computed(() => ticketStore.pagination)

// Hàm fetch danh sách tickets từ API với filters và pagination
const fetchTickets = async (page = 1) => {
  loading.value = true
  const params = {
    page,
    ...filters.value, // Spread filters để merge với page parameter
  }
  const result = await ticketStore.fetchTickets(params)
  loading.value = false

  if (!result.success) {
    toast.error('Không thể tải danh sách tickets')
  }
}

// Handler: Khi filter thay đổi, reset về trang 1 và fetch lại
const handleFilterChange = () => {
  fetchTickets(1)
}

// Handler: Xóa tất cả filters và reload dữ liệu
const clearFilters = () => {
  filters.value = {
    status: '',
    priority: '',
    search: '',
  }
  fetchTickets(1)
}

// Handler: Điều hướng đến trang chi tiết ticket
// Validation: Kiểm tra id tồn tại trước khi điều hướng
const viewTicket = (id) => {
  if (!id) {
    toast.error('Không tìm thấy ticket')
    return
  }
  router.push(`/tickets/${id}`)
}

// Hàm trả về CSS class cho badge trạng thái
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

// Hàm trả về CSS class cho badge ưu tiên
const getPriorityClass = (priority) => {
  const classes = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    urgent: 'badge-urgent',
  }
  return classes[priority] || 'badge-low'
}

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

// Options cho dropdown filter trạng thái
const statusOptions = [
  { value: '', label: 'Tất cả trạng thái', color: 'text-slate-600' },
  { value: 'open', label: 'Mới', color: 'text-blue-600', badge: 'badge-open' },
  { value: 'processing', label: 'Đang xử lý', color: 'text-amber-600', badge: 'badge-processing' },
  { value: 'resolved', label: 'Đã giải quyết', color: 'text-emerald-600', badge: 'badge-resolved' },
  { value: 'closed', label: 'Đã đóng', color: 'text-slate-600', badge: 'badge-closed' },
  { value: 'pending', label: 'Chờ xử lý', color: 'text-orange-600', badge: 'badge-pending' },
]

// Options cho dropdown filter ưu tiên
const priorityOptions = [
  { value: '', label: 'Tất cả ưu tiên', color: 'text-slate-600' },
  { value: 'low', label: 'Thấp', color: 'text-slate-600', badge: 'badge-low' },
  { value: 'medium', label: 'Trung bình', color: 'text-blue-600', badge: 'badge-medium' },
  { value: 'high', label: 'Cao', color: 'text-orange-600', badge: 'badge-high' },
  { value: 'urgent', label: 'Khẩn cấp', color: 'text-red-600', badge: 'badge-urgent' },
]

// Handler: Chuyển đến trang cụ thể trong pagination
// Kiểm tra validate page trong range hợp lệ
const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.last_page) {
    fetchTickets(page)
  }
}

// Computed property: Tạo mảng page numbers để hiển thị pagination UI
// Thuật toán: Hiển thị trang đầu, trang cuối, và các trang xung quanh trang hiện tại
// Ví dụ: [1, '...', 4, 5, 6, '...', 10]
const paginationNumbers = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const delta = 2 // Số trang hiển thị 2 bên trang hiện tại
  const range = []

  // Thêm các trang ở giữa (trung tâm)
  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i)
  }

  // Thêm dấu '...' nếu cần thiết
  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < last - 1) {
    range.push('...')
  }

  // Luôn hiển thị trang đầu và trang cuối
  range.unshift(1)
  if (last > 1) {
    range.push(last)
  }

  return range
})

// Lifecycle hook: Fetch tickets khi component được mount
onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <DashboardLayout>
    <!-- Header -->
    <div class="mb-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Danh sách Tickets</h1>
          <p class="text-slate-500 mt-1">Quản lý và theo dõi tất cả tickets hỗ trợ</p>
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

    <!-- Filters -->
    <div class="card shadow-soft mb-6 animate-slide-up">
      <div class="p-5 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/30">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900">Bộ lọc</h3>
          <button
            v-if="filters.status || filters.priority || filters.search"
            @click="clearFilters"
            class="ml-auto text-sm text-slate-500 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Xóa bộ lọc
          </button>
        </div>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Search -->
          <div class="md:col-span-5">
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                v-model="filters.search"
                @keyup.enter="handleFilterChange"
                type="text"
                placeholder="Tìm kiếm theo mã, tiêu đề..."
                class="input pl-12"
              />
            </div>
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-3">
            <select v-model="filters.status" @change="handleFilterChange">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Priority Filter -->
          <div class="md:col-span-3">
            <select v-model="filters.priority" @change="handleFilterChange">
              <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Search Button -->
          <div class="md:col-span-1">
            <button @click="handleFilterChange" class="btn btn-primary w-full" title="Tìm kiếm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tickets List -->
    <div class="card shadow-soft animate-slide-up" style="animation-delay: 0.1s">
      <!-- Loading -->
      <div v-if="loading && tickets.length === 0" class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
          <div class="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p class="mt-4 text-slate-500">Đang tải danh sách tickets...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="tickets.length === 0" class="text-center py-20">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
          <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-1">Không tìm thấy ticket nào</h3>
        <p class="text-slate-500 mb-4">
          {{ filters.search || filters.status || filters.priority ? 'Thử thay đổi bộ lọc hoặc xóa bộ lọc' : 'Bắt đầu bằng cách tạo ticket đầu tiên của bạn' }}
        </p>
        <router-link
          to="/tickets/create"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo ticket mới
        </router-link>
      </div>

      <!-- Tickets Table -->
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="w-36">Mã ticket</th>
              <th>Tiêu đề & Mô tả</th>
              <th class="w-36">Trạng thái</th>
              <th class="w-32">Ưu tiên</th>
              <th class="w-40">Người tạo</th>
              <th class="w-36">Ngày tạo</th>
              <th class="w-16"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="group cursor-pointer"
              @click="viewTicket(ticket.id)"
            >
              <td>
                <span class="inline-flex items-center font-mono text-sm text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg font-medium">
                  {{ ticket.ticket_number }}
                </span>
              </td>
              <td>
                <div class="max-w-md">
                  <span class="font-medium text-slate-900 group-hover:text-primary-600 transition-colors block">{{ ticket.subject }}</span>
                  <p v-if="ticket.description" class="text-sm text-slate-500 mt-0.5 line-clamp-1">{{ ticket.description }}</p>
                  <div v-if="ticket.category?.name" class="flex items-center gap-1 mt-1">
                    <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span class="text-xs text-slate-500">{{ ticket.category.name }}</span>
                  </div>
                </div>
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
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                    {{ ticket.user?.name?.charAt(0).toUpperCase() || '?' }}
                  </div>
                  <span class="text-sm text-slate-600">{{ ticket.user?.name || '-' }}</span>
                </div>
              </td>
              <td>
                <div class="text-sm text-slate-600">
                  {{ new Date(ticket.created_at).toLocaleDateString('vi-VN') }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </td>
              <td>
                <button
                  @click.stop="viewTicket(ticket.id)"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.last_page > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100">
        <div class="text-sm text-slate-500">
          Hiển thị <span class="font-medium text-slate-900">{{ tickets.length }}</span> trên tổng <span class="font-medium text-slate-900">{{ pagination.total }}</span> tickets
        </div>
        <div class="flex items-center gap-1">
          <!-- Previous -->
          <button
            @click="goToPage(pagination.current_page - 1)"
            :disabled="pagination.current_page === 1"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Page Numbers -->
          <template v-for="(page, index) in paginationNumbers" :key="index">
            <span v-if="page === '...'" class="px-3 py-2 text-slate-400">...</span>
            <button
              v-else
              @click="goToPage(page)"
              class="min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-all"
              :class="page === pagination.current_page
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'text-slate-600 hover:bg-slate-100'"
            >
              {{ page }}
            </button>
          </template>

          <!-- Next -->
          <button
            @click="goToPage(pagination.current_page + 1)"
            :disabled="pagination.current_page === pagination.last_page"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
