<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Nhập tin nhắn...'
  },
  showInternalOption: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send', 'typing-start', 'typing-stop'])

const message = ref('')
const isInternal = ref(false)
let typingTimeout = null

const send = () => {
  if (message.value.trim()) {
    emit('send', {
      message: message.value,
      is_internal: props.showInternalOption ? isInternal.value : false
    })
    message.value = ''
    isInternal.value = false
    stopTyping()
  }
}

// Send on Enter (Shift+Enter for newline)
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

const startTyping = () => {
  emit('typing-start')
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    stopTyping()
  }, 2000)
}

const stopTyping = () => {
  emit('typing-stop')
  clearTimeout(typingTimeout)
}

watch(() => message.value, () => {
  if (message.value) {
    startTyping()
  } else {
    stopTyping()
  }
})

onUnmounted(() => {
  clearTimeout(typingTimeout)
})
</script>

<template>
  <div class="border-t border-slate-200 p-4 bg-white">
    <!-- Internal message option for CSKH -->
    <div v-if="showInternalOption" class="flex items-center mb-2">
      <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          v-model="isInternal"
          type="checkbox"
          class="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
        />
        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Tin nhắn nội bộ (chỉ CSKH thấy)
      </label>
    </div>

    <div class="flex items-end gap-3">
      <!-- Attachment button (for future use) -->
      <button
        class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        title="Đính kèm tệp (sẽ triển khai sau)"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <!-- Message input -->
      <textarea
        v-model="message"
        :disabled="disabled"
        :placeholder="placeholder"
        rows="1"
        @keydown="handleKeydown"
        class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[48px] max-h-32"
      ></textarea>

      <!-- Send button -->
      <button
        @click="send"
        :disabled="disabled || !message.trim()"
        class="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Gửi tin nhắn (Enter)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>

    <p class="text-xs text-slate-400 mt-2">
      Nhấn Enter để gửi, Shift + Enter để xuống dòng
    </p>
  </div>
</template>
