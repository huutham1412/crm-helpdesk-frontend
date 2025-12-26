<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const terms = ref(false)
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Password strength indicator
const passwordStrength = ref('')

const checkPasswordStrength = (pwd) => {
  if (pwd.length === 0) {
    passwordStrength.value = ''
    return
  }
  if (pwd.length < 6) {
    passwordStrength.value = 'weak'
    return
  }
  let strength = 0
  if (pwd.length >= 8) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++

  if (strength <= 1) passwordStrength.value = 'weak'
  else if (strength <= 2) passwordStrength.value = 'medium'
  else passwordStrength.value = 'strong'
}

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) {
    toast.error('Vui lòng điền đầy đủ thông tin')
    return
  }

  if (password.value !== passwordConfirm.value) {
    toast.error('Mật khẩu xác nhận không khớp')
    return
  }

  if (password.value.length < 6) {
    toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    return
  }

  loading.value = true

  const result = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
    password_confirmation: passwordConfirm.value,
  })

  loading.value = false

  if (result.success) {
    toast.success('Đăng ký thành công!')
    router.push('/dashboard')
  } else {
    toast.error(result.error || 'Đăng ký thất bại')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden py-12">
    <!-- Background Decorations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-[40%] -right-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-200/40 to-pink-200/40 blur-3xl"></div>
      <div class="absolute -bottom-[40%] -left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-200/40 to-violet-200/40 blur-3xl"></div>
      <div class="absolute top-[15%] right-[10%] w-32 h-32 rounded-full bg-pink-200/20 blur-2xl"></div>
      <div class="absolute bottom-[25%] left-[15%] w-40 h-40 rounded-full bg-indigo-200/20 blur-2xl"></div>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-xl shadow-purple-500/30 mb-6 relative overflow-hidden group">
          <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <svg class="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
          CRM Helpdesk
        </h1>
        <p class="text-slate-500 mt-3 text-lg">Tạo tài khoản mới để bắt đầu</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-8">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Name Field -->
          <div class="space-y-2">
            <label for="name" class="block text-sm font-semibold text-slate-700">
              Họ và tên
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div class="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Nguyễn Văn A"
                class="w-full pl-14 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                required
                autocomplete="name"
              />
            </div>
          </div>

          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Email
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div class="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="email@example.com"
                class="w-full pl-14 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Mật khẩu
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div class="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                @input="checkPasswordStrength(password)"
                placeholder="Tối thiểu 6 ký tự"
                class="w-full pl-14 pr-12 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                required
                minlength="6"
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <!-- Password Strength Indicator -->
            <div v-if="password" class="flex gap-1 mt-2">
              <div class="h-1.5 flex-1 rounded-full transition-all duration-300"
                :class="passwordStrength === 'weak' ? 'bg-red-400' : passwordStrength === 'medium' ? 'bg-yellow-400' : passwordStrength === 'strong' ? 'bg-green-400' : 'bg-slate-200'">
              </div>
              <div class="h-1.5 flex-1 rounded-full transition-all duration-300"
                :class="passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-yellow-400' : 'bg-slate-200'">
              </div>
              <div class="h-1.5 flex-1 rounded-full transition-all duration-300"
                :class="passwordStrength === 'strong' ? 'bg-green-400' : 'bg-slate-200'">
              </div>
              <span class="ml-2 text-xs"
                :class="passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-600' : passwordStrength === 'strong' ? 'text-green-600' : 'text-slate-400'">
                {{ passwordStrength === 'weak' ? 'Yếu' : passwordStrength === 'medium' ? 'Trung bình' : passwordStrength === 'strong' ? 'Mạnh' : '' }}
              </span>
            </div>
          </div>

          <!-- Password Confirm Field -->
          <div class="space-y-2">
            <label for="password-confirm" class="block text-sm font-semibold text-slate-700">
              Xác nhận mật khẩu
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div class="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <input
                id="password-confirm"
                v-model="passwordConfirm"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="Nhập lại mật khẩu"
                class="w-full pl-14 pr-12 py-3.5 bg-slate-50/50 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                :class="passwordConfirm && passwordConfirm === password ? 'border-green-300' : 'border-slate-100'"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPasswordConfirm = !showPasswordConfirm"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg v-if="showPasswordConfirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p v-if="passwordConfirm && passwordConfirm === password" class="text-xs text-green-600 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Mật khẩu khớp
            </p>
          </div>

          <!-- Terms Checkbox -->
          <div class="flex items-start gap-3 pt-2">
            <div class="relative flex items-start">
              <input type="checkbox" id="terms" v-model="terms" class="peer sr-only" required />
              <div class="w-5 h-5 mt-0.5 border-2 border-slate-200 rounded-lg peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-pink-500 peer-checked:border-transparent transition-all cursor-pointer"></div>
              <svg class="w-3 h-3 text-white absolute top-[0.625rem] left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <label for="terms" class="text-sm text-slate-600 leading-relaxed cursor-pointer">
              Tôi đồng ý với <a href="#" class="text-purple-600 hover:text-purple-700 font-medium">Điều khoản dịch vụ</a> và <a href="#" class="text-purple-600 hover:text-purple-700 font-medium">Chính sách bảo mật</a>
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-4 px-6 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 mt-2"
          >
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Đăng ký tài khoản
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white/80 backdrop-blur text-slate-500">Đã có tài khoản?</span>
          </div>
        </div>

        <!-- Login Link -->
        <router-link
          to="/login"
          class="group block w-full text-center py-4 px-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:border-purple-300 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Đăng nhập ngay
          </span>
        </router-link>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-slate-400 mt-8">
        © 2024 CRM Helpdesk. Made with <span class="text-red-400">❤</span> for better customer support.
      </p>
    </div>
  </div>
</template>
