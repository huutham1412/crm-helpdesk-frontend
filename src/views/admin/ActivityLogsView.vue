<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { adminService } from '@/api/admin'
import DashboardLayout from '@/components/DashboardLayout.vue'

const toast = useToast()
const authStore = useAuthStore()

// State
const logs = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
})
const loading = ref(false)
const search = ref('')

// Filters
const filters = ref({
  user_id: null,
  action: null,
  log_level: null,
  date_from: null,
  date_to: null,
})

// Options
const actionsList = ref([])
const logLevels = ref([
  { value: 'emergency', label: 'Khẩn cấp', color: 'red' },
  { value: 'alert', label: 'Cảnh báo', color: 'red' },
  { value: 'critical', label: 'Nghiêm trọng', color: 'red' },
  { value: 'error', label: 'Lỗi', color: 'red' },
  { value: 'warning', label: 'Cảnh báo', color: 'orange' },
  { value: 'notice', label: 'Thông báo', color: 'blue' },
  { value: 'info', label: 'Thông tin', color: 'gray' },
  { value: 'debug', label: 'Debug', color: 'gray' },
])

const stats = ref({
  total: 0,
  by_action: {},
  by_level: {},
  by_user: [],
})

// Show filters
const showFilters = ref(false)

// Fetch logs
const fetchLogs = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      per_page: pagination.value.per_page,
    }

    if (search.value) params.search = search.value
    if (filters.value.user_id) params.user_id = filters.value.user_id
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.log_level) params.log_level = filters.value.log_level
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to) params.date_to = filters.value.date_to

    const response = await adminService.getActivityLogs(params)
    logs.value = response.data.data.data
    pagination.value = {
      current_page: response.data.data.current_page,
      last_page: response.data.data.last_page,
      per_page: response.data.data.per_page,
      total: response.data.data.total,
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi tải nhật ký')
  } finally {
    loading.value = false
  }
}

// Fetch stats
const fetchStats = async () => {
  try {
    const response = await adminService.getActivityLogStats()
    stats.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

// Fetch options
const fetchOptions = async () => {
  try {
    const response = await adminService.getActivityLogOptions()
    actionsList.value = Object.entries(response.data.data.actions || {}).map(([key, value]) => ({
      value: key,
      label: value,
    }))
  } catch (error) {
    console.error('Failed to fetch options:', error)
  }
}

// Apply filters
const applyFilters = () => {
  fetchLogs(1)
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    user_id: null,
    action: null,
    log_level: null,
    date_from: null,
    date_to: null,
  }
  search.value = ''
  fetchLogs(1)
}

// Export
const exporting = ref(false)
const exportLogs = async () => {
  exporting.value = true
  try {
    const params = {}
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to) params.date_to = filters.value.date_to
    if (filters.value.action) params.action = filters.value.action

    const response = await adminService.exportActivityLogs(params)

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.success('Đã xuất file CSV')
  } catch (error) {
    toast.error('Lỗi khi xuất file')
  } finally {
    exporting.value = false
  }
}

// Clean old logs
const cleaning = ref(false)
const cleanLogs = async () => {
  if (!confirm('Bạn có chắc muốn xóa nhật ký cũ? Hành động này không thể hoàn tác.')) {
    return
  }

  cleaning.value = true
  try {
    const response = await adminService.cleanActivityLogs()
    toast.success(response.data.data.message || 'Đã xóa nhật ký cũ')
    fetchLogs()
    fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi xóa nhật ký')
  } finally {
    cleaning.value = false
  }
}

// Get action label
const getActionLabel = (action) => {
  const found = actionsList.value.find(a => a.value === action)
  return found ? found.label : action
}

// Get log level color
const getLogLevelColor = (level) => {
  const found = logLevels.value.find(l => l.value === level)
  return found ? found.color : 'gray'
}

// Get log level label
const getLogLevelLabel = (level) => {
  const found = logLevels.value.find(l => l.value === level)
  return found ? found.label : level
}

// Get icon for action
const getIcon = (action) => {
  if (action.includes('login')) return 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
  if (action.includes('logout')) return 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
  if (action.includes('user')) return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  if (action.includes('ticket')) return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
  if (action.includes('message')) return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
  if (action.includes('role')) return 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
  if (action.includes('category')) return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
  if (action.includes('escalation')) return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN')
}

// View log details
const selectedLog = ref(null)
const showDetails = ref(false)
const viewDetails = async (log) => {
  try {
    const response = await adminService.getActivityLog(log.id)
    selectedLog.value = response.data.data
    showDetails.value = true
  } catch (error) {
    toast.error('Lỗi khi tải chi tiết')
  }
}

// Pagination
const onPageChange = (page) => {
  fetchLogs(page)
}

// Check if admin
const isAdmin = computed(() => authStore.user?.role === 'Admin')

onMounted(() => {
  fetchLogs()
  fetchStats()
  fetchOptions()
})
</script>

<template>
  <DashboardLayout>
    <div class="px-6 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Nhật ký hoạt động</h1>
        <p class="text-gray-600 mt-1">Theo dõi tất cả hoạt động trong hệ thống</p>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Tổng số nhật ký</div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total.toLocaleString() }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Hôm nay</div>
          <div class="text-2xl font-bold text-blue-600">{{ stats.by_level?.info || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Cảnh báo</div>
          <div class="text-2xl font-bold text-orange-600">{{ stats.by_level?.warning || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Lỗi</div>
          <div class="text-2xl font-bold text-red-600">{{ stats.by_level?.error || 0 }}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <button
            @click="showFilters = !showFilters"
            class="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Bộ lọc
          </button>
          <button
            @click="exportLogs"
            :disabled="exporting"
            class="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ exporting ? 'Đang xuất...' : 'Xuất CSV' }}
          </button>
          <button
            v-if="isAdmin"
            @click="cleanLogs"
            :disabled="cleaning"
            class="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ cleaning ? 'Đang xóa...' : 'Dọn logs cũ' }}
          </button>
        </div>
        <div class="relative">
          <input
            v-model="search"
            @keyup.enter="fetchLogs(1)"
            type="text"
            placeholder="Tìm kiếm..."
            class="pl-10 pr-4 py-2 border rounded-lg w-64"
          />
          <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Filters Panel -->
      <div v-if="showFilters" class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hành động</label>
            <select v-model="filters.action" class="w-full border rounded-lg px-3 py-2">
              <option value="">Tất cả</option>
              <option v-for="action in actionsList" :key="action.value" :value="action.value">
                {{ action.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
            <select v-model="filters.log_level" class="w-full border rounded-lg px-3 py-2">
              <option value="">Tất cả</option>
              <option v-for="level in logLevels" :key="level.value" :value="level.value">
                {{ level.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              v-model="filters.date_from"
              type="date"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              v-model="filters.date_to"
              type="date"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="applyFilters"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng
            </button>
            <button
              @click="resetFilters"
              class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-500 mt-2">Đang tải...</p>
      </div>

      <!-- Logs List -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 cursor-pointer" @click="viewDetails(log)">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(log.created_at) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ log.user?.name || 'System' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                  :class="`bg-${getLogLevelColor(log.log_level)}-100 text-${getLogLevelColor(log.log_level)}-800`">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="getIcon(log.action)" />
                  </svg>
                  {{ getActionLabel(log.action) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                {{ log.description }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {{ log.ip_address || '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <button class="text-blue-600 hover:text-blue-800">Chi tiết</button>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                Không có nhật ký nào
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Hiển thị {{ (pagination.current_page - 1) * pagination.per_page + 1 }}
            đến {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
            trong tổng số {{ pagination.total }} bản ghi
          </div>
          <div class="flex gap-1">
            <button
              @click="onPageChange(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Trước
            </button>
            <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
            <button
              @click="onPageChange(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.last_page"
              class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetails" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showDetails = false">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h3 class="text-lg font-semibold">Chi tiết nhật ký</h3>
          <button @click="showDetails = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="selectedLog" class="p-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span class="text-sm text-gray-500">Thời gian</span>
              <p class="font-medium">{{ formatDate(selectedLog.created_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Người dùng</span>
              <p class="font-medium">{{ selectedLog.user?.name || 'System' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Hành động</span>
              <p class="font-medium">{{ getActionLabel(selectedLog.action) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">IP Address</span>
              <p class="font-medium">{{ selectedLog.ip_address || '-' }}</p>
            </div>
          </div>

          <div class="mb-6">
            <span class="text-sm text-gray-500">Mô tả</span>
            <p class="font-medium">{{ selectedLog.description }}</p>
          </div>

          <!-- Tags -->
          <div v-if="selectedLog.tags?.length" class="mb-6">
            <span class="text-sm text-gray-500">Tags</span>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="tag in selectedLog.tags"
                :key="tag"
                class="px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Changes -->
          <div v-if="selectedLog.details?.length" class="border-t pt-4">
            <h4 class="font-medium mb-3">Các thay đổi</h4>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Trường</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Giá trị cũ</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Giá trị mới</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="detail in selectedLog.details" :key="detail.id">
                  <td class="px-3 py-2 text-sm font-medium">{{ detail.field_name }}</td>
                  <td class="px-3 py-2 text-sm text-red-600">{{ detail.old_value || '-' }}</td>
                  <td class="px-3 py-2 text-sm text-green-600">{{ detail.new_value || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- User Agent -->
          <div v-if="selectedLog.user_agent" class="border-t pt-4">
            <span class="text-sm text-gray-500">User Agent</span>
            <p class="text-sm text-gray-700 break-all">{{ selectedLog.user_agent }}</p>
          </div>
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button @click="showDetails = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
