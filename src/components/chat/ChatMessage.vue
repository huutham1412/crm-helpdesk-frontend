<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const authStore = useAuthStore()

const isOwn = computed(() => props.message.user?.id === authStore.user?.id)
const isSystem = computed(() => props.message.message_type === 'system')
const isInternal = computed(() => props.message.is_internal === true)

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const getAvatarUrl = (avatar) => {
  if (avatar) return avatar
  return '/default-avatar.png'
}
</script>

<template>
  <!-- System message -->
  <div v-if="isSystem" class="flex justify-center my-2">
    <span class="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
      {{ message.message }}
    </span>
  </div>

  <!-- Internal message indicator -->
  <div v-else-if="isInternal" class="flex justify-center my-2">
    <span class="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
      <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Tin nhắn nội bộ
    </span>
  </div>

  <!-- Regular message -->
  <div v-else :class="['flex mb-4', isOwn ? 'justify-end' : 'justify-start']">
    <div :class="['flex max-w-[80%]', isOwn ? 'flex-row-reverse' : 'flex-row']">
      <!-- Avatar -->
      <img
        :src="getAvatarUrl(message.user?.avatar)"
        :alt="message.user?.name"
        class="w-8 h-8 rounded-full flex-shrink-0"
        :class="isOwn ? 'ml-2' : 'mr-2'"
      />

      <!-- Message content -->
      <div>
        <!-- Sender name (for non-own messages) -->
        <p v-if="!isOwn" class="text-xs text-slate-500 mb-1">
          {{ message.user?.name }}
        </p>

        <!-- Message bubble -->
        <div
          :class="[
            'px-4 py-2 rounded-2xl break-words',
            isOwn
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none'
              : 'bg-slate-100 text-slate-800 rounded-bl-none'
          ]"
        >
          {{ message.message }}
        </div>

        <!-- Timestamp -->
        <p class="text-xs text-slate-400 mt-1" :class="isOwn ? 'text-right' : 'text-left'">
          {{ formatTime(message.created_at) }}
        </p>
      </div>
    </div>
  </div>
</template>
