<script setup>
import { ref, computed } from 'vue'
import { useRating } from '@/composables/useRating'
import { useToast } from 'vue-toastification'

const props = defineProps({
  ticketId: { type: Number, required: true }
})

const emit = defineEmits(['rated'])

const toast = useToast()
const { rating, loading, error, fetchRating, submitRating, reset } = useRating(props.ticketId)

const selectedRating = ref(0)
const hoverRating = ref(0)
const comment = ref('')
const submitted = ref(false)
const isHalf = ref(false)

// Valid ratings: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

// Check if already rated
const hasRated = computed(() => !!rating.value)

// Get display stars based on rating value
const getStars = (value) => {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push('full')
    } else if (value >= i - 0.5) {
      stars.push('half')
    } else {
      stars.push('empty')
    }
  }
  return stars
}

// Get stars for display
const displayStars = computed(() => {
  const value = hoverRating.value || selectedRating.value
  return getStars(value)
})

// Handle star click - support half-star
const handleStarClick = (index, event) => {
  const starValue = index + 1

  // Check if click was on left half (for half-star)
  const rect = event.target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const isLeftHalf = x < rect.width / 2

  if (isLeftHalf && starValue > 1) {
    selectedRating.value = starValue - 0.5
  } else {
    selectedRating.value = starValue
  }
}

// Handle star hover
const handleStarHover = (index, event) => {
  const starValue = index + 1

  // Check if hover is on left half (for half-star preview)
  const rect = event.target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const isLeftHalf = x < rect.width / 2

  if (isLeftHalf && starValue > 1) {
    hoverRating.value = starValue - 0.5
  } else {
    hoverRating.value = starValue
  }
}

// Clear hover
const handleStarLeave = () => {
  hoverRating.value = 0
}

// Check if star is filled for hover effect
const isStarFilled = (index) => {
  const value = hoverRating.value || selectedRating.value
  return value >= index + 1
}

// Check if star is half-filled
const isStarHalf = (index) => {
  const value = hoverRating.value || selectedRating.value
  return value >= index + 0.5 && value < index + 1
}

// Submit the rating
const handleSubmit = async () => {
  if (selectedRating.value === 0) {
    toast.error('Vui lòng chọn số sao đánh giá')
    return
  }

  try {
    await submitRating(selectedRating.value, comment.value || null)
    submitted.value = true
    toast.success('Cảm ơn bạn đã đánh giá!', {
      timeout: 5000,
      icon: ''
    })
    emit('rated', rating.value)
  } catch (err) {
    toast.error(error.value || 'Không thể gửi đánh giá. Vui lòng thử lại.')
  }
}

// Format rating for display
const formatRating = (value) => {
  return Number(value).toFixed(1)
}
</script>

<template>
  <div class="rating-form">
    <!-- Already rated display -->
    <div v-if="hasRated || submitted" class="rated-display">
      <div class="rated-stars">
        <span
          v-for="(star, index) in getStars(rating?.rating || 0)"
          :key="index"
          class="star rated"
        >
          <svg v-if="star === 'full'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <svg v-else-if="star === 'half'" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="half-gradient">
                <stop offset="50%" stop-color="currentColor"/>
                <stop offset="50%" stop-color="#e5e7eb"/>
              </linearGradient>
            </defs>
            <path fill="url(#half-gradient)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="#e5e7eb">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </span>
        <span class="rating-value">{{ formatRating(rating?.rating || 0) }}</span>
      </div>
      <p class="thank-you-message">Cảm ơn bạn đã đánh giá!</p>
      <p v-if="rating?.comment" class="rated-comment">{{ rating.comment }}</p>
    </div>

    <!-- Rating form -->
    <div v-else class="rating-input">
      <h3 class="rating-title">Đánh giá chất lượng hỗ trợ</h3>
      <p class="rating-subtitle">Vui lòng chọn số sao để đánh giá trải nghiệm của bạn</p>

      <!-- Star rating input -->
      <div class="stars-container">
        <span
          v-for="index in 5"
          :key="index"
          class="star-wrapper"
          @click="handleStarClick(index - 1, $event)"
          @mousemove="handleStarHover(index - 1, $event)"
          @mouseleave="handleStarLeave"
        >
          <svg
            class="star"
            :class="{
              'filled': isStarFilled(index - 1),
              'half': isStarHalf(index - 1) && !isStarFilled(index - 1),
              'empty': !isStarFilled(index - 1) && !isStarHalf(index - 1)
            }"
            viewBox="0 0 24 24"
          >
            <defs>
              <linearGradient v-if="isStarHalf(index - 1)" id="star-half-gradient">
                <stop offset="50%" stop-color="currentColor"/>
                <stop offset="50%" stop-color="#e5e7eb"/>
              </linearGradient>
            </defs>
            <path
              :fill="isStarHalf(index - 1) && !isStarFilled(index - 1) ? 'url(#star-half-gradient)' : 'currentColor'"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </span>
      </div>

      <!-- Selected rating display -->
      <div v-if="selectedRating > 0" class="selected-rating">
        Bạn chọn: <strong>{{ formatRating(selectedRating) }} sao</strong>
      </div>

      <!-- Comment textarea -->
      <textarea
        v-model="comment"
        class="comment-input"
        placeholder="Nhập bình luận của bạn (không bắt buộc)..."
        rows="3"
        maxlength="1000"
      ></textarea>

      <div class="comment-count">
        {{ comment.length }} / 1000
      </div>

      <!-- Submit button -->
      <button
        class="submit-btn"
        :disabled="loading || selectedRating === 0"
        @click="handleSubmit"
      >
        <span v-if="loading">Đang gửi...</span>
        <span v-else>Gửi đánh giá</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.rating-form {
  padding: 1.5rem;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Rated display */
.rated-display {
  text-align: center;
}

.rated-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.rated-stars .star {
  width: 2rem;
  height: 2rem;
  color: #fbbf24;
}

.rating-value {
  margin-left: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
}

.thank-you-message {
  font-size: 1.125rem;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 0.5rem;
}

.rated-comment {
  color: #6b7280;
  font-style: italic;
}

/* Rating input */
.rating-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin-bottom: 0.5rem;
}

.rating-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.5rem;
}

.stars-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.star-wrapper {
  cursor: pointer;
  position: relative;
}

.star {
  width: 2.5rem;
  height: 2.5rem;
  transition: transform 0.15s ease;
}

.star-wrapper:hover .star {
  transform: scale(1.15);
}

.star.filled {
  color: #fbbf24;
}

.star.half {
  color: #fbbf24;
}

.star.empty {
  color: #e5e7eb;
}

.selected-rating {
  text-align: center;
  color: #374151;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.comment-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
