<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const currentIndex = ref(props.initialIndex)

// Update index when initialIndex changes
watch(() => props.initialIndex, (newIndex) => {
  currentIndex.value = newIndex
})

// Watch show prop to handle body scroll
watch(() => props.show, (isShown) => {
  if (isShown) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Close preview
const close = () => {
  emit('close')
}

// Next image
const next = () => {
  currentIndex.value = (currentIndex.value + 1) % props.images.length
}

// Previous image
const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}

// Keyboard navigation
const handleKeydown = (event) => {
  if (!props.show) return

  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowRight':
      next()
      break
    case 'ArrowLeft':
      prev()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Restore body scroll on unmount
  document.body.style.overflow = ''
})

// Current image
const currentImage = ref(null)
watch(currentIndex, () => {
  currentImage.value = props.images[currentIndex.value]
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center" @click.self="close">
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-10 p-2"
        title="Đóng (Esc)"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Previous Button -->
      <button
        v-if="images.length > 1"
        @click="prev"
        class="absolute left-4 text-white hover:text-slate-300 transition-colors z-10 p-2"
        title="Ảnh trước (←)"
      >
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Next Button -->
      <button
        v-if="images.length > 1"
        @click="next"
        class="absolute right-4 text-white hover:text-slate-300 transition-colors z-10 p-2"
        title="Ảnh tiếp theo (→)"
      >
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Image Container -->
      <div class="relative max-h-[80vh] max-w-[90vw] flex items-center justify-center">
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.filename"
          class="max-h-[80vh] max-w-[90vw] object-contain"
        />
      </div>

      <!-- Image Counter -->
      <div v-if="images.length > 1" class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <span class="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
          {{ currentIndex + 1 }} / {{ images.length }}
        </span>
      </div>

      <!-- Image Info -->
      <div v-if="currentImage" class="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
        <p class="font-medium truncate max-w-[200px]" :title="currentImage.filename">
          {{ currentImage.filename }}
        </p>
        <p class="text-slate-300 text-xs">{{ currentImage.size }}</p>
      </div>

      <!-- Thumbnails -->
      <div v-if="images.length > 1" class="absolute bottom-4 right-4 flex gap-2">
        <button
          v-for="(img, index) in images.slice(Math.max(0, currentIndex - 3), currentIndex + 4)"
          :key="img.id"
          @click="currentIndex = index + Math.max(0, currentIndex - 3)"
          :class="[
            'w-12 h-12 rounded overflow-hidden border-2 transition-all',
            currentIndex === index + Math.max(0, currentIndex - 3)
              ? 'border-primary-500 scale-110'
              : 'border-transparent hover:border-slate-500'
          ]"
        >
          <img :src="img.url" class="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
