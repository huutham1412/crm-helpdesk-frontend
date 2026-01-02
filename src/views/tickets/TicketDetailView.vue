<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { useTicketChat } from '@/composables/useTicketChat'
import { useRating } from '@/composables/useRating'
import { attachmentService } from '@/api/attachments'
import { userService } from '@/api/tickets'
import DashboardLayout from '@/components/DashboardLayout.vue'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import RatingForm from '@/components/RatingForm.vue'
import CannedResponseSelector from '@/components/CannedResponseSelector.vue'

const route = useRoute()
const router = useRouter()
const ticketStore = useTicketStore()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state: Lưu trữ thông tin ticket hiện tại
const ticket = ref(null)

// Reactive state: Danh sách tin nhắn của ticket
const messages = ref([])

// Reactive state: Theo dõi trạng thái loading
const loading = ref(true)

// Reactive state: Theo dõi trạng thái đang gửi tin nhắn
const sendingMessage = ref(false)

// Reactive state: Nội dung tin nhắn mới (two-way binding với v-model)
const newMessage = ref('')

// Template ref: Tham chiếu đến DOM element của container tin nhắn
const messagesContainer = ref(null)

// Realtime chat composable
const {
  messages: realtimeMessages,
  loading: messagesLoading,
  typingUsers,
  subscribed,
  loadMessages,
  subscribe,
  unsubscribe,
  sendTyping,
  markAsRead,
  addMessage: addRealtimeMessage
} = useTicketChat(route.params.id)

// Rating composable
const { rating: ticketRating, fetchRating } = useRating(route.params.id)

// Watch realtime messages and sync with local messages
watch(realtimeMessages, (newMessages) => {
  messages.value = Array.isArray(newMessages) ? newMessages : []
  nextTick(() => scrollToBottom())
}, { deep: true })

// Computed property: Kiểm tra user có phải là staff (Admin/CSKH) không
const isStaff = computed(() => authStore.isCsKH)

// Computed property: Chỉ staff mới được cập nhật ticket
const canUpdate = computed(() => isStaff.value)

// Computed property: Chỉ staff mới được assign ticket
const canAssign = computed(() => isStaff.value)

// Computed property: Chỉ staff mới được gửi internal message
const canSendInternal = computed(() => isStaff.value)

// Computed property: Show rating form for closed tickets that haven't been rated yet (only for regular users)
const showRatingForm = computed(() => {
  return !isStaff.value && ticket.value?.status === 'closed' && !ticketRating.value
})

// Handle rating submitted
const handleRatingSubmitted = (newRating) => {
  ticketRating.value = newRating
}

// Reactive state: Status dropdown hiển/ẩn
const showStatusDropdown = ref(false)

// Reactive state: Assign dropdown hiển/ẩn
const showAssignDropdown = ref(false)

// Reactive state: Danh sách CSKH để assign
const cskhList = ref([])

// Reactive state: Đang load CSKH list
const loadingCskh = ref(false)

// Hàm kiểm tra tin nhắn có phải của user hiện tại không
const isMyMessage = (message) => {
  // Tin nhắn hệ thống không hiển thị bên phải hay trái
  if (message.message_type === 'system') return false

  const currentUserId = authStore.user?.id
  const messageUserId = message.user?.id

  // User thường: chỉ tin của mình hiển thị bên phải
  if (!isStaff.value) {
    return messageUserId === currentUserId
  }

  // CSKH/Admin: tin của mình hiển thị bên phải
  return messageUserId === currentUserId
}

// Hàm fetch thông tin ticket và danh sách tin nhắn
const fetchData = async () => {
  loading.value = true
  const ticketId = route.params.id // Lấy ticket ID từ URL

  // Fetch chi tiết ticket từ API
  const ticketResult = await ticketStore.fetchTicket(ticketId)
  if (ticketResult.success) {
    ticket.value = ticketStore.currentTicket
    // Get messages from ticket data
    if (ticket.value?.messages) {
      messages.value = ticket.value.messages
      // Also init realtime messages
      realtimeMessages.value = ticket.value.messages
    }
  } else {
    toast.error('Không thể tải thông tin ticket')
    router.push('/tickets')
    return
  }

  // Fetch rating (if ticket is closed)
  if (ticket.value?.status === 'closed') {
    await fetchRating()
  }

  // Subscribe to realtime updates with callback for ticket changes
  subscribe((updatedTicket) => {
    if (updatedTicket) {
      const oldStatus = ticket.value?.status
      ticket.value = updatedTicket

      // If status changed to closed, fetch rating data
      if (oldStatus !== 'closed' && updatedTicket.status === 'closed') {
        fetchRating()
      }

      // Show toast notification for status changes
      if (oldStatus !== updatedTicket.status) {
        toast.success(`Trạng thái ticket đã thay đổi thành ${statusLabels[updatedTicket.status] || updatedTicket.status}`)
      }
    }
  })

  // Mark all unread messages as read
  markAsRead()

  loading.value = false

  // nextTick: Đợi DOM cập nhật xong rồi mới scroll
  nextTick(() => {
    scrollToBottom()
  })
}

// Hàm scroll container tin nhắn xuống dưới cùng
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Hàm gửi tin nhắn mới
const sendMessage = async (data = null) => {
  const messageContent = data?.message || newMessage.value

  // Validate: Có nội dung tin nhắn hoặc có file đính kèm
  if (!messageContent.trim() && pendingAttachments.value.length === 0) return

  sendingMessage.value = true
  const ticketId = route.params.id

  const payload = {
    message: messageContent,
  }

  // Add attachment IDs if any
  if (pendingAttachments.value.length > 0) {
    payload.attachment_ids = pendingAttachments.value.map(a => a.id)
  }

  // Add is_internal flag for staff
  const isInternal = data?.is_internal || (data === null && isInternalMessage.value)
  if (canSendInternal.value && isInternal) {
    payload.is_internal = true
    // Reset internal checkbox after sending
    if (data === null) isInternalMessage.value = false
  }

  const result = await ticketStore.sendMessage(ticketId, payload)

  sendingMessage.value = false

  if (result.success) {
    // Chỉ thêm vào realtimeMessages, watch sẽ sync sang messages
    if (result.message) {
      realtimeMessages.value.push(result.message)
    }
    // Xóa nội dung input và pending attachments sau khi gửi thành công
    newMessage.value = ''
    pendingAttachments.value = []
    // Scroll xuống để hiển thị tin nhắn mới
    nextTick(() => scrollToBottom())
  } else {
    toast.error(result.error || 'Không thể gửi tin nhắn')
  }
}

// Hàm mở preview ảnh
const openImagePreview = (attachments, initialIndex = 0) => {
  const images = attachments.filter(a => a.is_image)
  if (images.length === 0) return

  previewImages.value = images
  previewInitialIndex.value = initialIndex
  showImagePreview.value = true
}

// Hàm lấy icon cho file attachment
const getFileIcon = (attachment) => {
  return attachmentService.getFileIcon(attachment.type)
}

// Typing indicator logic
let typingTimer = null
const handleInput = () => {
  // Auto-resize textarea
  const textarea = document.querySelector('textarea[v-model]')
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  // Send typing indicator
  sendTyping()

  // Clear existing timer and set new one to send "stopped typing" after 2 seconds
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    // Send stopped typing (is_typing: false)
    sendTyping(false)
  }, 2000)
}

// Hàm cập nhật trạng thái ticket
const updateStatus = async (status) => {
  const ticketId = route.params.id
  const result = await ticketStore.updateTicket(ticketId, { status })
  if (result.success) {
    // Cập nhật ticket info từ store
    ticket.value = ticketStore.currentTicket
    toast.success('Cập nhật trạng thái thành công')
    // Thêm tin nhắn system để log sự thay đổi trạng thái
    messages.value.push({
      id: Date.now(),
      message: `Trạng thái đã thay đổi thành ${statusLabels[status] || status}`,
      message_type: 'system',
      created_at: new Date().toISOString(),
    })
    nextTick(() => scrollToBottom())
  } else {
    toast.error(result.error || 'Không thể cập nhật trạng thái')
  }
}

// Hàm fetch danh sách CSKH
const fetchCskhList = async () => {
  loadingCskh.value = true
  try {
    const response = await userService.cskhList()
    cskhList.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch CSKH list:', error)
  } finally {
    loadingCskh.value = false
  }
}

// Hàm gán ticket cho CSKH
const assignTicket = async (userId) => {
  const ticketId = route.params.id
  const result = await ticketStore.assignTicket(ticketId, userId)
  if (result.success) {
    ticket.value = ticketStore.currentTicket
    showAssignDropdown.value = false
    const assignedUser = cskhList.value.find(u => u.id === userId)
    toast.success(`Đã gán ticket cho ${assignedUser?.name || 'CSKH'}`)
    // Thêm tin nhắn system để log
    messages.value.push({
      id: Date.now(),
      message: `Ticket đã được gán cho ${assignedUser?.name || 'CSKH'}`,
      message_type: 'system',
      created_at: new Date().toISOString(),
    })
    nextTick(() => scrollToBottom())
  } else {
    toast.error(result.error || 'Không thể gán ticket')
  }
}

// Hàm bỏ gán ticket
const unassignTicket = async () => {
  const ticketId = route.params.id
  const result = await ticketStore.assignTicket(ticketId, null)
  if (result.success) {
    ticket.value = ticketStore.currentTicket
    showAssignDropdown.value = false
    toast.success('Đã bỏ gán ticket')
    messages.value.push({
      id: Date.now(),
      message: 'Ticket đã được bỏ gán',
      message_type: 'system',
      created_at: new Date().toISOString(),
    })
    nextTick(() => scrollToBottom())
  } else {
    toast.error(result.error || 'Không thể bỏ gán ticket')
  }
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

// Options cho dropdown select trạng thái
const statusOptions = [
  { value: 'open', label: 'Mới', color: 'bg-blue-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { value: 'processing', label: 'Đang xử lý', color: 'bg-amber-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543-.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { value: 'pending', label: 'Chờ xử lý', color: 'bg-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'resolved', label: 'Đã giải quyết', color: 'bg-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'closed', label: 'Đã đóng', color: 'bg-slate-500', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728a9 9 0 01-2.828 2.828m-14.857 2.828a9 9 0 010-2.828-2.828m14.857-12.728a9 9 0 012.828-2.828' },
]

// Hàm lấy viết tắt tên user (ví dụ: "Nguyen Van A" -> "NA")
const getUserInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Hàm format thời gian hiển thị (relatively)
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

// Hàm format ngày giờ đầy đủ
const formatFullDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Hàm format thời gian đã xem
const formatReadTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `Đã xem ${diffMins} phút trước`
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 24) return `Đã xem ${diffHours} giờ trước`
  return `Đã xem ${new Date(dateString).toLocaleDateString('vi-VN')}`
}

// Hàm kiểm tra xem có nên hiển thị read receipt không
const shouldShowReadReceipt = (message) => {
  // Chỉ hiển thị read receipt cho tin nhắn của mình (không phải tin nhắn hệ thống)
  if (!message || message.message_type === 'system') return false
  if (!isMyMessage(message)) return false
  // Chỉ hiển thị khi đã có read_at
  return !!message.read_at
}

// Reactive state: Message đang được hover để hiển thị thời gian đầy đủ
const hoveredMessageId = ref(null)

// Reactive state: Internal message option
const isInternalMessage = ref(false)

// Handle canned response template selection
const handleTemplateSelect = (content) => {
  // Insert content at cursor position or append to end
  const textarea = document.querySelector('textarea[v-model]')
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = newMessage.value
    const before = text.substring(0, start)
    const after = text.substring(end)

    // Add newline if there's existing content
    const separator = before && !before.endsWith('\n') ? '\n' : ''
    newMessage.value = before + separator + content + after

    // Set cursor after inserted content
    nextTick(() => {
      const newPosition = before.length + separator.length + content.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    })
  } else {
    newMessage.value = content
  }
}

// Reactive state: Pending attachments (uploaded but not yet sent with message)
const pendingAttachments = ref([])

// Reactive state: Image preview modal
const showImagePreview = ref(false)
const previewImages = ref([])
const previewInitialIndex = ref(0)

// Lifecycle hook: Fetch dữ liệu khi component được mount
onMounted(() => {
  fetchData()
  // Fetch CSKH list cho staff
  if (isStaff.value) {
    fetchCskhList()
  }
})

// Cleanup: Unsubscribe from realtime updates when component unmounts
onUnmounted(() => {
  unsubscribe()
})
</script>

<template>
  <DashboardLayout>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 pt-6 pb-8 px-4 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="relative">
          <div class="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
          <div class="absolute top-0 left-0 w-20 h-20 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p class="mt-6 text-slate-500 font-medium">Đang tải thông tin ticket...</p>
      </div>

      <!-- Ticket Content -->
      <div v-else-if="ticket" class="max-w-6xl mx-auto space-y-6">
        <!-- Ticket Header Card -->
        <div class="card shadow-soft !rounded-3xl animate-fade-in relative z-10">
          <!-- Top Bar with Back & Status -->
          <div class="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <!-- Back Button & Title -->
              <div class="flex items-center gap-4">
                <button
                  @click="router.push('/tickets')"
                  class="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-md transition-all"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="inline-flex items-center font-mono text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 rounded-xl shadow-lg shadow-primary-500/30">
                      {{ ticket.ticket_number }}
                    </span>
                    <span :class="['badge text-sm', getPriorityClass(ticket.priority)]">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {{ priorityLabels[ticket.priority] || ticket.priority }}
                    </span>
                  </div>
                  <h1 class="text-2xl font-bold text-slate-900 mt-1">{{ ticket.subject }}</h1>
                </div>
              </div>

              <!-- Status Dropdown -->
              <div v-if="canUpdate" class="relative">
                <button
                  @click="showStatusDropdown = !showStatusDropdown"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-medium"
                  :class="[
                    showStatusDropdown
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  ]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statusOptions.find(o => o.value === ticket.status)?.icon"" />
                  </svg>
                  <span>{{ statusLabels[ticket.status] || ticket.status }}</span>
                  <svg class="w-4 h-4 transition-transform" :class="showStatusDropdown ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
                  <div v-if="showStatusDropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-[100]">
                    <button
                      v-for="option in statusOptions"
                      :key="option.value"
                      @click="updateStatus(option.value); showStatusDropdown = false"
                      class="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left"
                      :class="ticket.status === option.value ? 'bg-primary-50 text-primary-700' : 'text-slate-700'"
                    >
                      <div :class="['w-7 h-7 rounded-lg flex items-center justify-center text-white', option.color]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="option.icon" />
                        </svg>
                      </div>
                      <span class="font-medium">{{ option.label }}</span>
                      <svg v-if="ticket.status === option.value" class="w-4 h-4 ml-auto text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- Static Status (non-staff) -->
              <div v-else>
                <span :class="['badge text-sm', getStatusClass(ticket.status)]">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ statusLabels[ticket.status] || ticket.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Ticket Info Grid -->
          <div class="p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Created By -->
              <div class="flex items-center gap-3 p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border border-violet-200">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/30">
                  {{ getUserInitials(ticket.user?.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-violet-600 font-medium">Người tạo</p>
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ ticket.user?.name || '-' }}</p>
                </div>
              </div>

              <!-- Assigned To -->
              <div class="relative">
                <div
                  v-if="canAssign"
                  @click="showAssignDropdown = !showAssignDropdown"
                  class="flex items-center gap-3 p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-emerald-600 font-medium">Người xử lý</p>
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ ticket.assigned_to?.name || 'Chưa gán' }}</p>
                  </div>
                  <svg class="w-4 h-4 text-emerald-500" :class="{ 'rotate-180': showAssignDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div
                  v-else
                  class="flex items-center gap-3 p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200"
                >
                  <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-emerald-600 font-medium">Người xử lý</p>
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ ticket.assigned_to?.name || 'Chưa gán' }}</p>
                  </div>
                </div>

                <!-- Assign Dropdown -->
                <Transition
                  enter-active-class="transition ease-out duration-200"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-150"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div v-if="showAssignDropdown && canAssign" class="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    <div v-if="loadingCskh" class="px-4 py-3 text-sm text-slate-500 text-center">
                      Đang tải...
                    </div>
                    <div v-else-if="cskhList.length === 0" class="px-4 py-3 text-sm text-slate-500 text-center">
                      Không có CSKH
                    </div>
                    <template v-else>
                      <button
                        v-for="cskh in cskhList"
                        :key="cskh.id"
                        @click.stop="assignTicket(cskh.id)"
                        class="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                        :class="ticket.assigned_to?.id === cskh.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'"
                      >
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {{ getUserInitials(cskh.name) }}
                        </div>
                        <span class="font-medium text-sm">{{ cskh.name }}</span>
                        <svg v-if="ticket.assigned_to?.id === cskh.id" class="w-4 h-4 ml-auto text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div class="border-t border-slate-100 my-1"></div>
                      <button
                        v-if="ticket.assigned_to"
                        @click.stop="unassignTicket()"
                        class="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left text-red-600"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span class="font-medium text-sm">Bỏ gán</span>
                      </button>
                    </template>
                  </div>
                </Transition>
              </div>

              <!-- Category -->
              <div class="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border border-pink-200">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-pink-500/30">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-pink-600 font-medium">Danh mục</p>
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ ticket.category?.name || '-' }}</p>
                </div>
              </div>

              <!-- Created Date -->
              <div class="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/30">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-blue-600 font-medium">Ngày tạo</p>
                  <p class="text-sm font-semibold text-slate-900">{{ new Date(ticket.created_at).toLocaleDateString('vi-VN') }}</p>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="ticket.description" class="mt-5 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200">
              <p class="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mô tả chi tiết
              </p>
              <p class="text-slate-700 whitespace-pre-wrap">{{ ticket.description }}</p>
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        <div class="card shadow-soft !rounded-3xl overflow-hidden animate-slide-up" style="animation-delay: 0.1s">
          <!-- Chat Header -->
          <div class="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-white/20 rounded-xl">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div class="text-white">
                <h2 class="font-semibold">Cuộc trò thảo luận</h2>
                <p class="text-primary-100 text-sm">{{ messages.length }} tin nhắn</p>
              </div>
            </div>
          </div>

          <!-- Messages Area -->
          <div
            ref="messagesContainer"
            class="p-6 bg-gradient-to-b from-slate-50/30 to-white min-h-[400px] max-h-[500px] overflow-y-auto scrollbar-thin"
          >
            <!-- Empty State -->
            <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-slate-500">
              <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
                <p class="font-medium text-slate-700">Chưa có tin nhắn nào</p>
                <p class="text-sm">Gửi tin nhắn đầu tiên để bắt đầu thảo luận về vấn đề này</p>
            </div>

            <!-- Messages List -->
            <div v-else class="space-y-4">
              <div
                v-for="message in (Array.isArray(messages) ? messages.filter(m => m && m.id) : [])"
                :key="message.id"
                :class="[
                  'flex gap-3 animate-message-in',
                  isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'
                ]"
                @mouseenter="hoveredMessageId = message.id"
                @mouseleave="hoveredMessageId = null"
              >
                <!-- System Message -->
                <div v-if="message.message_type === 'system'" class="w-full flex justify-center">
                  <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full text-sm text-slate-600 shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="font-medium">{{ message.message }}</span>
                    <span class="text-slate-400 text-xs">{{ formatTimeAgo(message.created_at) }}</span>
                  </div>
                </div>

                <!-- User Message -->
                <template v-else>
                  <!-- Avatar -->
                  <div v-if="!isMyMessage(message)" class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {{ getUserInitials(message.user?.name) }}
                    </div>
                  </div>

                  <!-- Message Bubble -->
                  <div
                    class="max-w-[75%] px-5 py-3 shadow-md"
                    :class="[
                      isMyMessage(message)
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white text-slate-900 rounded-2xl rounded-bl-sm border-2 border-slate-100'
                    ]"
                  >
                    <!-- Sender Name -->
                    <p v-if="!isMyMessage(message)" class="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ message.user?.name }}
                    </p>
                    <!-- Internal Message Badge -->
                    <div v-if="message.is_internal" class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium mb-2">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Nội bộ
                    </div>
                    <!-- Message Content -->
                    <p v-if="message.message" class="whitespace-pre-wrap break-words leading-relaxed">{{ message.message }}</p>

                    <!-- Attachments Display -->
                    <div
                      v-if="message.attachments_data && message.attachments_data.length > 0"
                      class="mt-2 space-y-2"
                    >
                      <div
                        v-for="(attachment, idx) in message.attachments_data"
                        :key="attachment.id"
                        class="inline-block"
                      >
                        <!-- Image Attachment -->
                        <div v-if="attachment.is_image" class="inline-block mr-2 mb-2">
                          <a
                            href="#"
                            @click.prevent="openImagePreview(message.attachments_data, idx)"
                            class="inline-block"
                          >
                            <img
                              :src="attachment.url"
                              :alt="attachment.filename"
                              class="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2"
                              :class="isMyMessage(message) ? 'border-primary-400' : 'border-slate-200'"
                            />
                          </a>
                          <p class="text-xs mt-1 truncate max-w-[200px]" :class="isMyMessage(message) ? 'text-primary-200' : 'text-slate-500'">
                            {{ attachment.filename }}
                          </p>
                        </div>

                        <!-- Non-Image Attachment -->
                        <a
                          v-else
                          :href="attachment.url"
                          download
                          class="inline-flex items-center gap-2 px-3 py-2 mr-2 mb-2 rounded-lg transition-all"
                          :class="isMyMessage(message)
                            ? 'bg-primary-400/30 hover:bg-primary-400/50 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'"
                        >
                          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div class="text-left">
                            <p class="text-sm font-medium truncate max-w-[180px]" :title="attachment.filename">
                              {{ attachment.filename }}
                            </p>
                            <p class="text-xs" :class="isMyMessage(message) ? 'text-primary-200' : 'text-slate-500'">
                              {{ attachment.size }}
                            </p>
                          </div>
                          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    <!-- Time -->
                    <p
                      :class="[
                        'text-xs mt-2 flex items-center gap-1',
                        isMyMessage(message) ? 'text-primary-200' : 'text-slate-400'
                      ]"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span v-if="hoveredMessageId === message.id">{{ formatFullDateTime(message.created_at) }}</span>
                      <span v-else>{{ formatTimeAgo(message.created_at) }}</span>
                    </p>
                    <!-- Read Receipt (chỉ hiển thị cho tin nhắn của mình) -->
                    <p
                      v-if="shouldShowReadReceipt(message)"
                      :class="[
                        'text-xs mt-1 flex items-center gap-1',
                        isMyMessage(message) ? 'text-primary-200' : 'text-slate-400'
                      ]"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ formatReadTime(message.read_at) }}</span>
                    </p>
                  </div>

                  <!-- Avatar (My Message) -->
                  <div v-if="isMyMessage(message)" class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {{ getUserInitials(message.user?.name) }}
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <!-- Disabled for closed tickets -->
          <div v-if="ticket.status !== 'closed'" class="p-5 bg-white border-t border-slate-100">
            <!-- Pending Attachments Preview -->
            <AttachmentUpload
              v-if="ticket"
              v-model="pendingAttachments"
              :ticket-id="ticket.id"
              :disabled="sendingMessage"
            />

            <!-- Internal Message Option (CSKH only) -->
            <div v-if="canSendInternal" class="flex items-center mb-3 px-2">
              <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
                <input
                  v-model="isInternalMessage"
                  type="checkbox"
                  class="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Tin nhắn nội bộ <span class="text-slate-400">(chỉ CSKH thấy)</span></span>
              </label>
            </div>

            <!-- Canned Response Selector (CSKH/Admin only) -->
            <div v-if="canSendInternal" class="mb-3 flex items-center gap-3 px-2">
              <CannedResponseSelector
                :ticket-id="ticket?.id"
                :ticket-data="{ ...ticket, cskh_name: authStore.user?.name }"
                @select="handleTemplateSelect"
              />
            </div>

            <form @submit.prevent="sendMessage" class="flex items-end gap-3">
              <div class="flex-1 relative">
                <!-- Typing indicator above input -->
                <div v-if="typingUsers.length > 0" class="mb-2 flex items-center gap-2 text-sm text-slate-500">
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </div>
                  <span>Đang nhập...</span>
                </div>
                <textarea
                  v-model="newMessage"
                  rows="1"
                  :placeholder="isInternalMessage ? 'Nhập tin nhắn nội bộ...' : 'Nhập tin nhắn...'"
                  class="input resize-none !rounded-2xl !py-3.5 !px-5 border-2 focus:border-primary-500"
                  :class="isInternalMessage ? 'border-amber-300 focus:border-amber-500' : ''"
                  style="min-height: 52px; max-height: 140px;"
                  :disabled="sendingMessage"
                  @keydown.enter.exact.prevent="sendMessage"
                  @input="handleInput"
                ></textarea>
                <div class="absolute right-3 bottom-3 text-xs text-slate-400 hidden sm:block">
                  Nhấn Enter để gửi
                </div>
              </div>
              <button
                type="submit"
                :disabled="sendingMessage || (!newMessage.trim() && pendingAttachments.length === 0)"
                class="p-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg v-if="!sendingMessage" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <svg v-else class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </button>
            </form>
          </div>

          <!-- Closed Ticket Notice -->
          <div v-else class="p-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
            <div class="flex items-center justify-center gap-3 text-slate-600">
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728a9 9 0 01-2.828 2.828m-14.857 2.828a9 9 0 010-2.828-2.828m14.857-12.728a9 9 0 012.828-2.828" />
              </svg>
              <span class="font-medium">Ticket đã đóng, không thể gửi tin nhắn thêm.</span>
            </div>
          </div>

          <!-- Rating Form (for closed tickets, regular users only) - shown inside chat card for visibility -->
          <div v-if="showRatingForm" class="p-5 bg-white border-t border-slate-100">
            <RatingForm
              v-if="ticket"
              :ticket-id="ticket.id"
              @rated="handleRatingSubmitted"
            />
          </div>
        </div>

        <!-- Rating Form for already rated tickets (shown separately) -->
        <div v-if="!isStaff && ticket.status === 'closed' && ticketRating" class="card shadow-soft !rounded-3xl overflow-hidden animate-slide-up" style="animation-delay: 0.2s">
          <div class="p-6 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Cảm ơn bạn đã đánh giá!</h3>
            <p class="text-slate-600">Chúng tôi rất trân trọng phản hồi của bạn.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <ImagePreview
      :images="previewImages"
      :initial-index="previewInitialIndex"
      :show="showImagePreview"
      @close="showImagePreview = false"
    />
  </DashboardLayout>
</template>

<style scoped>
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-message-in {
  animation: message-in 0.3s ease-out;
}

/* Custom scrollbar for messages container */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgb(148 163 184);
}

/* Smooth transitions */
.message-bubble {
  transition: all 0.2s ease;
}
</style>
