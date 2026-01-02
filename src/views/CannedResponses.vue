<script setup>
import { onMounted } from 'vue'
import { useCannedResponseStore } from '@/stores/cannedResponse'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import DashboardLayout from '@/components/DashboardLayout.vue'
import CannedResponsesManager from '@/components/CannedResponsesManager.vue'

const cannedResponseStore = useCannedResponseStore()
const ticketStore = useTicketStore()
const authStore = useAuthStore()

// Check if user is CSKH/Admin
const isStaff = authStore.isCsKH

onMounted(async () => {
  if (isStaff) {
    await ticketStore.fetchCategories()
  }
})
</script>

<template>
  <DashboardLayout>
    <!-- Redirect if not staff -->
    <div v-if="!isStaff" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Truy cập bị từ chối</h3>
        <p class="text-slate-500">Chỉ CSKH và Admin mới có thể truy cập trang này.</p>
      </div>
    </div>

    <!-- Canned Responses Manager for staff -->
    <CannedResponsesManager v-else />
  </DashboardLayout>
</template>
