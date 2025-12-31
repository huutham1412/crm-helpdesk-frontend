import { ref } from 'vue'
import { ratingService } from '@/api/tickets'

export function useRating(ticketId) {
  const rating = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Fetch rating for a ticket
   */
  const fetchRating = async () => {
    if (!ticketId) return

    loading.value = true
    error.value = null
    try {
      const response = await ratingService.show(ticketId)
      rating.value = response.data.data
    } catch (err) {
      console.error('Error fetching rating:', err)
      error.value = err.response?.data?.message || 'Failed to fetch rating'
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit a rating for a ticket
   */
  const submitRating = async (ratingValue, comment = null) => {
    if (!ticketId) {
      throw new Error('Ticket ID is required')
    }

    // Validate rating value (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
    const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    if (!validRatings.includes(ratingValue)) {
      throw new Error('Rating must be 1-5 in increments of 0.5')
    }

    loading.value = true
    error.value = null
    try {
      const response = await ratingService.create(ticketId, {
        rating: ratingValue,
        comment: comment || undefined,
      })

      rating.value = response.data.data
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit rating'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset rating state
   */
  const reset = () => {
    rating.value = null
    error.value = null
  }

  return {
    rating,
    loading,
    error,
    fetchRating,
    submitRating,
    reset,
  }
}