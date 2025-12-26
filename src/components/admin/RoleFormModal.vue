<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { adminService } from '@/api/admin'

const props = defineProps({
  show: Boolean,
  mode: String, // 'create' or 'edit'
  role: Object,
})

const emit = defineEmits(['close', 'saved'])

const toast = useToast()

// Form state
const form = ref({
  name: '',
})
const loading = ref(false)

// Title
const title = computed(() => {
  return props.mode === 'create' ? 'Thêm vai trò mới' : 'Cập nhật vai trò'
})

// Watch for role changes (edit mode)
watch(() => props.role, (newRole) => {
  if (newRole && props.mode === 'edit') {
    form.value = {
      name: newRole.name || '',
    }
  }
}, { immediate: true })

// Watch for show changes
watch(() => props.show, (isShowing) => {
  if (isShowing && props.mode === 'create') {
    form.value = { name: '' }
  }
})

// Submit form
const submit = async () => {
  // Validation
  if (!form.value.name) {
    toast.error('Vui lòng nhập tên vai trò')
    return
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(form.value.name)) {
    toast.error('Tên vai trò chỉ được chứa chữ cái, số, gạch nối và gạch dưới')
    return
  }

  loading.value = true
  try {
    const data = {
      name: form.value.name,
    }

    if (props.mode === 'create') {
      await adminService.createRole(data)
      toast.success('Thêm vai trò thành công')
    } else {
      await adminService.updateRole(props.role.id, data)
      toast.success('Cập nhật vai trò thành công')
    }
    emit('saved')
  } catch (error) {
    const message = error.response?.data?.message || 'Có lỗi xảy ra'
    toast.error(message)
  } finally {
    loading.value = false
  }
}

// Close modal
const close = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">{{ title }}</h2>
            <button @click="close" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-5">
            <!-- Role Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Tên vai trò *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ví dụ: Manager, Supervisor..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
              <p class="text-xs text-slate-500 mt-2">Tên vai trò chỉ chứa chữ cái, số, gạch nối (-) và gạch dưới (_)</p>
            </div>

            <!-- Info -->
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div class="flex gap-3">
                <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm text-blue-700">
                  <p class="font-medium">Lưu ý về phân quyền</p>
                  <p class="mt-1">Hiện tại hệ thống chỉ quản lý phân quyền theo vai trò (Role-based). Các quyền hạn chi tiết (Permission) sẽ được thêm sau.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
            <button
              @click="close"
              class="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              @click="submit"
              :disabled="loading"
              class="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="loading">Đang xử lý...</span>
              <span v-else>{{ mode === 'create' ? 'Thêm vai trò' : 'Cập nhật' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
