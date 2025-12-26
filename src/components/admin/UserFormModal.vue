<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { adminService } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  show: Boolean,
  mode: String, // 'create' or 'edit'
  user: Object,
})

const emit = defineEmits(['close', 'saved'])

const toast = useToast()
const authStore = useAuthStore()

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})

const roles = ref([])
const loading = ref(false)
const fetchingRoles = ref(false)

// Title
const title = computed(() => {
  return props.mode === 'create' ? 'Thêm người dùng mới' : 'Cập nhật người dùng'
})

// Fetch roles for dropdown
const fetchRoles = async () => {
  fetchingRoles.value = true
  try {
    // Use getRoles() instead of getRolesList() - same endpoint as RolesView
    const response = await adminService.getRoles()
    roles.value = response.data?.data || []
  } catch (error) {
    console.error('Error fetching roles:', error)
    roles.value = []
  } finally {
    fetchingRoles.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  }
}

// Watch for user changes (edit mode)
watch(() => props.user, (newUser) => {
  if (newUser && props.mode === 'edit') {
    form.value = {
      name: newUser.name || '',
      email: newUser.email || '',
      phone: newUser.phone || '',
      password: '',
      password_confirmation: '',
    }
  }
}, { immediate: true })

// Watch for show changes
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    fetchRoles()
    if (props.mode === 'create') {
      resetForm()
    }
  }
})

// Submit form
const submit = async () => {
  // Validation
  if (!form.value.name) {
    toast.error('Vui lòng nhập họ tên')
    return
  }
  if (!form.value.email) {
    toast.error('Vui lòng nhập email')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    toast.error('Email không hợp lệ')
    return
  }
  if (props.mode === 'create' && !form.value.password) {
    toast.error('Vui lòng nhập mật khẩu')
    return
  }
  if (form.value.password && form.value.password.length < 6) {
    toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    return
  }
  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    toast.error('Xác nhận mật khẩu không khớp')
    return
  }

  loading.value = true
  try {
    const data = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone || null,
    }
    if (form.value.password) {
      data.password = form.value.password
      data.password_confirmation = form.value.password_confirmation
    }

    if (props.mode === 'create') {
      await adminService.createUser(data)
      toast.success('Thêm người dùng thành công')
    } else {
      await adminService.updateUser(props.user.id, data)
      toast.success('Cập nhật người dùng thành công')
    }
    emit('saved')
  } catch (error) {
    const message = error.response?.data?.message || 'Có lỗi xảy ra'
    const errors = error.response?.data?.errors
    if (errors) {
      Object.values(errors).forEach(err => toast.error(err[0]))
    } else {
      toast.error(message)
    }
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
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Họ và tên *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Nguyễn Văn A"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="email@example.com"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
              <input
                v-model="form.phone"
                type="text"
                placeholder="09xxxxxxxxx"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu <span v-if="mode === 'edit'">(để trống nếu không đổi)</span> *
              </label>
              <input
                v-model="form.password"
                type="password"
                :placeholder="mode === 'edit' ? '••••••••' : 'Tối thiểu 6 ký tự'"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <!-- Password Confirmation -->
            <div v-if="form.password">
              <label class="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu *</label>
              <input
                v-model="form.password_confirmation"
                type="password"
                placeholder="Nhập lại mật khẩu"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
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
              class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="loading">Đang xử lý...</span>
              <span v-else>{{ mode === 'create' ? 'Thêm người dùng' : 'Cập nhật' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
