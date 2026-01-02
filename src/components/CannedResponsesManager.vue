<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCannedResponseStore } from '@/stores/cannedResponse'
import { useTicketStore } from '@/stores/ticket'
import { useToast } from 'vue-toastification'

const toast = useToast()
const cannedResponseStore = useCannedResponseStore()
const ticketStore = useTicketStore()

// Local state
const searchQuery = ref('')
const selectedCategory = ref('')
const showDeleteDialog = ref(false)
const deleteTargetId = ref(null)

// Form state
const formData = ref({
  title: '',
  content: '',
  category_id: null,
  is_active: true,
})

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

  return filtered
})

const isEditing = computed(() => !!cannedResponseStore.editingResponse)

const variablesList = computed(() => {
  const content = formData.value.content
  const matches = content.match(/\{[a-zA-Z0-9_]+\}/g)
  return matches ? [...new Set(matches)] : []
})

// Methods
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    category_id: null,
    is_active: true,
  }
}

const handleSubmit = async () => {
  const data = {
    ...formData.value,
    category_id: formData.value.category_id || null,
  }

  let result
  if (isEditing.value) {
    result = await cannedResponseStore.updateResponse(cannedResponseStore.editingResponse.id, data)
  } else {
    result = await cannedResponseStore.createResponse(data)
  }

  if (result.success) {
    toast.success(isEditing.value ? 'Cập nhật template thành công' : 'Tạo template thành công')
    cannedResponseStore.closeModal()
    resetForm()
    await cannedResponseStore.fetchResponses()
  } else {
    toast.error(result.error || 'Có lỗi xảy ra')
  }
}

const handleEdit = (response) => {
  cannedResponseStore.openEditModal(response)
  formData.value = {
    title: response.title,
    content: response.content,
    category_id: response.category_id,
    is_active: response.is_active,
  }
}

const handleDeleteClick = (id) => {
  deleteTargetId.value = id
  showDeleteDialog.value = true
}

const handleDeleteConfirm = async () => {
  const result = await cannedResponseStore.deleteResponse(deleteTargetId.value)
  if (result.success) {
    toast.success('Xóa template thành công')
    showDeleteDialog.value = false
    deleteTargetId.value = null
  } else {
    toast.error(result.error || 'Có lỗi xảy ra')
  }
}

const insertVariable = (variable) => {
  const textarea = document.getElementById('template-content')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = formData.value.content
  const before = text.substring(0, start)
  const after = text.substring(end)
  formData.value.content = before + variable + after
  textarea.focus()
  textarea.setSelectionRange(start + variable.length, start + variable.length)
}

// Available variables
const availableVariables = [
  { key: '{customer_name}', label: 'Tên khách hàng' },
  { key: '{ticket_number}', label: 'Mã ticket' },
  { key: '{category}', label: 'Danh mục' },
  { key: '{cskh_name}', label: 'Tên CSKH' },
  { key: '{subject}', label: 'Tiêu đề ticket' },
]

// Watch for modal close
const onModalClose = () => {
  resetForm()
}

onMounted(async () => {
  await cannedResponseStore.fetchResponses()
  await ticketStore.fetchCategories()
})
</script>

<template>
  <div class="canned-responses-manager">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Template Trả Lời Mẫu</h2>
        <p class="text-sm text-slate-500 mt-1">Quản lý các template trả lời nhanh cho CSKH</p>
      </div>
      <button
        @click="cannedResponseStore.openCreateModal(); resetForm()"
        class="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tạo Mới</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm template..."
          class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        >
      </div>
      <div class="w-48">
        <select
          v-model="selectedCategory"
          class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        >
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in ticketStore.categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Templates List -->
    <div v-if="cannedResponseStore.loading" class="flex items-center justify-center py-12">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="filteredResponses.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-slate-500">Chưa có template nào</p>
      <button
        @click="cannedResponseStore.openCreateModal(); resetForm()"
        class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        Tạo template đầu tiên
      </button>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="response in filteredResponses"
        :key="response.id"
        class="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
        :class="{ 'opacity-60': !response.is_active }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h3 class="font-semibold text-slate-900">{{ response.title }}</h3>
              <span v-if="!response.is_active" class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                Inactive
              </span>
              <span v-if="response.category" class="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">
                {{ response.category.name }}
              </span>
            </div>
            <p class="text-sm text-slate-600 mt-2 line-clamp-2">{{ response.content }}</p>
            <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {{ response.usage_count }} lần dùng
              </span>
              <span>by {{ response.user?.name }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <button
              @click="handleEdit(response)"
              class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDeleteClick(response.id)"
              class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="cannedResponseStore.showManagerModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cannedResponseStore.closeModal()"
      >
        <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              {{ isEditing ? 'Cập Nhật Template' : 'Tạo Template Mới' }}
            </h3>
            <button
              @click="cannedResponseStore.closeModal(); resetForm()"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto flex-1">
            <div class="space-y-5">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Tiêu đề</label>
                <input
                  v-model="formData.title"
                  type="text"
                  placeholder="Ví dụ: Chào hỏi khách hàng"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                >
              </div>

              <!-- Content -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Nội dung</label>
                <textarea
                  id="template-content"
                  v-model="formData.content"
                  rows="6"
                  placeholder="Nhập nội dung template... Sử dụng {customer_name}, {ticket_number} để chèn biến động"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                ></textarea>

                <!-- Variables Helper -->
                <div class="mt-3">
                  <p class="text-xs text-slate-500 mb-2">Click để chèn biến:</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="variable in availableVariables"
                      :key="variable.key"
                      @click="insertVariable(variable.key)"
                      class="px-3 py-1.5 bg-slate-100 hover:bg-primary-100 text-slate-600 hover:text-primary-700 text-xs rounded-lg transition-colors"
                    >
                      {{ variable.key }}
                    </button>
                  </div>
                </div>

                <!-- Detected Variables -->
                <div v-if="variablesList.length > 0" class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="variable in variablesList"
                    :key="variable"
                    class="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full"
                  >
                    {{ variable }}
                  </span>
                </div>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Danh mục (tùy chọn)</label>
                <select
                  v-model="formData.category_id"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                >
                  <option :value="null">Chọn danh mục...</option>
                  <option v-for="cat in ticketStore.categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <!-- Active Toggle -->
              <div class="flex items-center gap-3">
                <input
                  v-model="formData.is_active"
                  type="checkbox"
                  id="is-active"
                  class="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                >
                <label for="is-active" class="text-sm text-slate-700">Kích hoạt template</label>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              @click="cannedResponseStore.closeModal(); resetForm()"
              class="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              @click="handleSubmit"
              :disabled="!formData.title || !formData.content"
              class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isEditing ? 'Cập Nhật' : 'Tạo Mới' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Dialog -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
        @click.self="showDeleteDialog = false"
      >
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Xác nhận xóa</h3>
            <p class="text-slate-500 mb-6">Bạn có chắc muốn xóa template này? Hành động này không thể hoàn tác.</p>
            <div class="flex items-center justify-center gap-3">
              <button
                @click="showDeleteDialog = false"
                class="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                @click="handleDeleteConfirm"
                class="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
              >
                Xóa
              </button>
            </div>
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
