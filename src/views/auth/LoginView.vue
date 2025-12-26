<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error('Vui lòng nhập email và mật khẩu')
    return
  }

  loading.value = true

  const result = await authStore.login({
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (result.success) {
    toast.success('Đăng nhập thành công!')
    router.push('/dashboard')
  } else {
    toast.error(result.error || 'Đăng nhập thất bại')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-primary-200/30 blur-3xl"></div>
      <div class="absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full bg-violet-200/30 blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">CRM Helpdesk</h1>
        <p class="text-slate-500 mt-2">Đăng nhập để tiếp tục</p>
      </div>

      <div class="card shadow-soft animate-scale-in">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="email@example.com"
                class="input pl-12"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-2">
              Mật khẩu
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="input pl-12"
                required
                autocomplete="current-password"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span class="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary w-full btn-lg"
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
            <span v-if="!loading">Đăng nhập</span>
            <span v-else>Đang xử lý...</span>
          </button>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-slate-500">Chưa có tài khoản?</span>
          </div>
        </div>

        <router-link
          to="/register"
          class="block w-full text-center py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 font-medium hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
        >
          Đăng ký tài khoản mới
        </router-link>
      </div>

      <p class="text-center text-sm text-slate-500 mt-8">
        © 2024 CRM Helpdesk. All rights reserved.
      </p>
    </div>
  </div>
</template>
