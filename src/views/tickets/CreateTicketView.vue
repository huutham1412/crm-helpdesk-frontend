<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTicketStore } from '@/stores/ticket'
import { useToast } from 'vue-toastification'
import DashboardLayout from '@/components/DashboardLayout.vue'

const router = useRouter()
const ticketStore = useTicketStore()
const toast = useToast()

// Reactive state: Lưu trữ dữ liệu form
const form = ref({
  subject: '',
  description: '',
  category_id: '',
  priority: 'medium',
  initial_message: '',
})

const loading = ref(false)
const categories = ref([])

// Lifecycle hook: Fetch categories khi component được mount
onMounted(async () => {
  const result = await ticketStore.fetchCategories()
  if (result.success) {
    categories.value = ticketStore.categories
  }
})

// Computed property: Biến đổi cấu trúc cây categories thành danh sách phẳng
const flattenedCategories = computed(() => {
  const flatten = (cats, level = 0) => {
    let result = []
    for (const cat of cats) {
      result.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flatten(cat.children, level + 1))
      }
    }
    return result
  }
  return flatten(categories.value)
})

const getCategoryLabel = (cat) => {
  const prefix = '— '.repeat(cat.level)
  return prefix + cat.name
}

// Handler: Submit form tạo ticket mới
const handleSubmit = async () => {
  if (!form.value.subject.trim()) {
    toast.error('Vui lòng nhập tiêu đề')
    return
  }
  if (!form.value.description.trim()) {
    toast.error('Vui lòng nhập mô tả')
    return
  }

  loading.value = true

  const result = await ticketStore.createTicket({
    subject: form.value.subject,
    description: form.value.description,
    category_id: form.value.category_id || null,
    priority: form.value.priority,
    initial_message: form.value.initial_message || null,
  })

  loading.value = false

  if (result.success) {
    toast.success('Tạo ticket thành công!')
    router.push(`/tickets/${result.ticket.id}`)
  } else {
    toast.error(result.error || 'Không thể tạo ticket')
  }
}

// Options cho mức độ ưu tiên
const priorityOptions = [
  { value: 'low', label: 'Thấp', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-slate-400 to-slate-500', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  { value: 'medium', label: 'Trung bình', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-blue-400 to-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  { value: 'high', label: 'Cao', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'from-orange-400 to-orange-500', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
  { value: 'urgent', label: 'Khẩn cấp', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-red-400 to-red-500', bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
]
</script>

<template>
  <DashboardLayout>
    <div class="min-h-screen bg-slate-50 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 pt-6 pb-12 px-4 lg:px-8">
      <!-- Header -->
      <div class="max-w-4xl mx-auto mb-8">
        <button
          @click="router.back()"
          class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div class="flex items-start justify-between">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Tạo ticket mới
            </div>
            <h1 class="text-3xl font-bold text-slate-900">Mô tả vấn đề của bạn</h1>
            <p class="text-slate-500 mt-2">Chúng tôi sẽ giúp đỡ bạn ngay khi nhận được thông tin</p>
          </div>
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Subject Card -->
          <div class="card shadow-soft !rounded-3xl overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <label for="subject" class="flex items-center gap-3 text-white">
                <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </span>
                <span class="font-semibold">Tiêu đề ticket</span>
                <span class="text-red-200">*</span>
              </label>
            </div>
            <div class="p-6">
              <input
                id="subject"
                v-model="form.subject"
                type="text"
                placeholder="VD: Không thể đăng nhập vào hệ thống"
                class="input !text-lg !py-4 !rounded-2xl border-2"
                required
              />
            </div>
          </div>

          <!-- Description Card -->
          <div class="card shadow-soft !rounded-3xl overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <label for="description" class="flex items-center gap-3 text-white">
                <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <span class="font-semibold">Mô tả chi tiết</span>
                <span class="text-red-200">*</span>
              </label>
            </div>
            <div class="p-6">
              <textarea
                id="description"
                v-model="form.description"
                rows="5"
                placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải. Cung cấp càng nhiều thông tin càng tốt để chúng tôi có thể hỗ trợ nhanh hơn..."
                class="input !rounded-2xl border-2"
                required
              ></textarea>
              <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mô tả càng chi tiết sẽ giúp giải quyết vấn đề nhanh hơn</span>
              </div>
            </div>
          </div>

          <!-- Category & Priority Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Category Card -->
            <div class="card shadow-soft !rounded-3xl overflow-hidden">
              <div class="bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-3">
                <label class="flex items-center gap-2 text-white text-sm font-semibold">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Danh mục
                </label>
              </div>
              <div class="p-4">
                <select v-model="form.category_id">
                  <option value="">Chọn danh mục</option>
                  <option v-for="cat in flattenedCategories" :key="cat.id" :value="cat.id">
                    {{ getCategoryLabel(cat) }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Priority Card -->
            <div class="card shadow-soft !rounded-3xl overflow-hidden">
              <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
                <label class="flex items-center gap-2 text-white text-sm font-semibold">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Mức độ ưu tiên
                </label>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="option in priorityOptions"
                    :key="option.value"
                    class="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      :value="option.value"
                      v-model="form.priority"
                      class="sr-only"
                    />
                    <div
                      class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all"
                      :class="form.priority === option.value
                        ? `${option.border} ${option.bg} ${option.text} border-current`
                        : 'border-slate-200 hover:border-slate-300 bg-white'"
                    >
                      <div :class="`p-1.5 rounded-lg bg-gradient-to-br ${option.color} text-white`">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="option.icon" />
                        </svg>
                      </div>
                      <span class="text-xs font-medium">{{ option.label }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Initial Message Card (Optional) -->
          <div class="card shadow-soft !rounded-3xl overflow-hidden">
            <div class="bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-4">
              <label for="initial_message" class="flex items-center gap-3 text-white">
                <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                <span class="font-semibold">Tin nhắn bổ sung</span>
                <span class="text-violet-200 font-normal">(tùy chọn)</span>
              </label>
            </div>
            <div class="p-6">
              <textarea
                id="initial_message"
                v-model="form.initial_message"
                rows="3"
                placeholder="Thêm bất kỳ thông tin nào khác mà bạn nghĩ có thể hữu ích..."
                class="input !rounded-2xl border-2"
              ></textarea>
            </div>
          </div>

          <!-- Submit Actions -->
          <div class="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              @click="router.back()"
              class="btn btn-secondary !px-6 !py-3 !rounded-xl"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hủy
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 !px-8 !py-3 !rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
            >
              <svg
                v-if="loading"
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ loading ? 'Đang tạo...' : 'Tạo Ticket' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>
