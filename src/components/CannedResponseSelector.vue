<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCannedResponseStore } from '@/stores/cannedResponse'
import { useToast } from 'vue-toastification'

const props = defineProps({
  ticketId: {
    type: [String, Number],
    required: true,
  },
  ticketData: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select', 'close'])

const toast = useToast()
const cannedResponseStore = useCannedResponseStore()

// Local state
const showDropdown = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const previewMode = ref(false)
const previewData = ref(null)
const loading = ref(false)
const triggerButtonRef = ref(null)
const dropdownPosition = ref({ top: '0px', left: '0px' })

// Click outside handler
const handleClickOutside = (event) => {
  if (showDropdown.value && triggerButtonRef.value && !triggerButtonRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

// Computed
const filteredResponses = computed(() => {
  let filtered = cannedResponseStore.responses

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.content.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(r => r.category_id === parseInt(selectedCategory.value))
  }

  // Sort by usage count (most used first)
  return filtered.sort((a, b) => b.usage_count - a.usage_count)
})

const popularResponses = computed(() => {
  return cannedResponseStore.popularResponses.slice(0, 5)
})

const hasTemplates = computed(() => {
  return cannedResponseStore.responses.length > 0
})

// Methods
const updateDropdownPosition = () => {
  if (showDropdown.value && triggerButtonRef.value) {
    const rect = triggerButtonRef.value.getBoundingClientRect()
    const dropdownWidth = 380
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth

    // Calculate left position (ensure dropdown doesn't overflow right edge)
    let left = rect.left
    if (left + dropdownWidth > windowWidth - 20) {
      left = windowWidth - dropdownWidth - 20
    }
    if (left < 10) left = 10

    // Calculate top position (show below button)
    let top = rect.bottom + 8

    // If dropdown would go below viewport, show above button instead
    const estimatedHeight = 500
    if (top + estimatedHeight > windowHeight - 20) {
      top = rect.top - estimatedHeight - 8
      // Ensure it doesn't go above viewport
      if (top < 10) top = rect.bottom + 8
    }

    dropdownPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
    }
  }
}

const toggleDropdown = async () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    if (!hasTemplates.value) {
      await loadTemplates()
    }
    await nextTick()
    updateDropdownPosition()
  }
}

// Watch for window resize to update position
watch(showDropdown, (isOpen) => {
  if (isOpen) {
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition)
  } else {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition)
  }
})

const loadTemplates = async () => {
  loading.value = true
  try {
    await Promise.all([
      cannedResponseStore.fetchAllActive(),
      cannedResponseStore.fetchPopular(5),
    ])
  } finally {
    loading.value = false
  }
}

const handleSelect = async (response) => {
  // Increment usage count
  await cannedResponseStore.incrementUsage(response.id)

  // Render content with ticket data
  const rendered = renderContent(response.content)

  emit('select', rendered)
  showDropdown.value = false
}

const renderContent = (content) => {
  let rendered = content
  const variables = {
    '{customer_name}': props.ticketData.user?.name || '',
    '{ticket_number}': props.ticketData.ticket_number || '',
    '{category}': props.ticketData.category?.name || '',
    '{cskh_name}': props.ticketData.cskh_name || '',
    '{subject}': props.ticketData.subject || '',
  }

  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(key, value)
  }

  return rendered
}

const handlePreview = async (response) => {
  const result = await cannedResponseStore.previewResponse(response.id, props.ticketId)
  if (result.success) {
    previewData.value = {
      ...response,
      rendered_content: result.data.rendered_content,
    }
    previewMode.value = true
  }
}

const closePreview = () => {
  previewMode.value = false
  previewData.value = null
}

const insertAndClose = () => {
  if (previewData.value) {
    emit('select', previewData.value.rendered_content)
    previewMode.value = false
    showDropdown.value = false
  }
}

// Load templates on mount for better UX and register click outside handler
onMounted(async () => {
  await loadTemplates()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition)
})
</script>

<template>
  <div class="canned-response-selector">
    <!-- Trigger Button -->
    <div class="relative">
      <button
        ref="triggerButtonRef"
        @click="toggleDropdown"
        class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md"
        :class="{ 'ring-2 ring-emerald-300 ring-offset-2': showDropdown }"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-sm font-medium">Template</span>
        <span class="text-xs opacity-80">({{ filteredResponses.length }})</span>
        <svg
          class="w-3.5 h-3.5 transition-transform shrink-0"
          :class="{ 'rotate-180': showDropdown }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Panel - Teleported to body to escape overflow:hidden -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="showDropdown"
            ref="dropdownPanel"
            class="fixed w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-[9999] overflow-hidden"
            :style="dropdownPosition"
            @click.stop
          >
          <!-- Header -->
          <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-slate-900 text-sm">Chọn Template Trả Lời</h3>
              <div class="flex items-center gap-2">
                <a
                  href="/canned-responses"
                  target="_blank"
                  class="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  title="Quản lý templates"
                  @click.stop="showDropdown = false"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572-1.065c-.426-1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37.996.608 2.296.07 2.572 1.065z" />
                  </svg>
                  Quản lý
                </a>
                <button
                  @click="showDropdown = false"
                  class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Search -->
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm template..."
              class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
            >
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="py-8 text-center">
            <div class="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-500 mt-2">Đang tải templates...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredResponses.length === 0" class="py-8 text-center">
            <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm text-slate-500 mb-3">Chưa có template nào</p>
            <a
              href="/canned-responses"
              class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
              @click="showDropdown = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Tạo template đầu tiên
            </a>
          </div>

          <!-- Templates List -->
          <div v-else class="max-h-[320px] overflow-y-auto">
            <!-- Popular Section -->
            <div v-if="!searchQuery && popularResponses.length > 0" class="border-b border-slate-100">
              <div class="px-4 py-2 bg-amber-50 border-b border-amber-100 sticky top-0 z-10">
                <p class="text-xs font-semibold text-amber-700 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  PHỔ BIẾN NHẤT
                </p>
              </div>
              <div class="p-2 space-y-1">
                <button
                  v-for="response in popularResponses"
                  :key="response.id"
                  @click="handleSelect(response)"
                  class="w-full px-3 py-2.5 text-left rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-all group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-800 group-hover:text-emerald-700 truncate">{{ response.title }}</p>
                      <p class="text-xs text-slate-500 truncate mt-0.5">{{ response.content }}</p>
                    </div>
                    <span class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full shrink-0">
                      {{ response.usage_count }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- All Templates -->
            <div class="p-2">
              <div v-if="!searchQuery && popularResponses.length > 0" class="px-2 py-1.5 mb-1">
                <p class="text-xs font-medium text-slate-400">TẤT CẢ TEMPLATES</p>
              </div>
              <div class="space-y-1">
                <div
                  v-for="response in filteredResponses"
                  :key="response.id"
                  class="group"
                >
                  <button
                    @click="handleSelect(response)"
                    class="w-full px-3 py-2.5 text-left rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 active:from-emerald-100 active:to-teal-100 transition-all"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm font-medium text-slate-800 group-hover:text-emerald-700">
                            {{ response.title }}
                          </span>
                          <span v-if="response.category" class="px-1.5 py-0.5 bg-pink-50 text-pink-500 text-xs rounded-full shrink-0">
                            {{ response.category.name }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ response.content }}</p>
                      </div>
                      <button
                        @click.stop="handlePreview(response)"
                        class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all shrink-0 border border-transparent hover:border-emerald-200"
                        title="Xem trước"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p class="text-xs text-slate-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Biến: {customer_name}, {ticket_number}, {category}, {cskh_name}, {subject}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
    </div>

    <!-- Preview Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="previewMode && previewData"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
        @click.self="closePreview"
      >
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 class="font-semibold text-slate-900">{{ previewData.title }}</h3>
            <button
              @click="closePreview"
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-5 max-h-[60vh] overflow-y-auto">
            <div class="mb-4 p-4 bg-slate-100 rounded-xl">
              <p class="text-xs text-slate-500 mb-2 font-medium">Nội dung gốc:</p>
              <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ previewData.content }}</p>
            </div>

            <div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <p class="text-xs text-emerald-600 mb-2 font-medium">Sau khi thay thế biến:</p>
              <p class="text-sm text-slate-800 whitespace-pre-wrap">{{ previewData.rendered_content }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              @click="closePreview"
              class="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Đóng
            </button>
            <button
              @click="insertAndClose"
              class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Chèn vào tin nhắn
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
