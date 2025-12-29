import { ref } from 'vue'
import echo from '@/echo'
import { useAuthStore } from '@/stores/auth'
import { ticketService } from '@/api/tickets'
import api from '@/api/axios'

export function useTicketChat(ticketId) {
  const authStore = useAuthStore()
  const messages = ref([])
  const loading = ref(false)
  const typingUsers = ref([])
  const channel = ref(null)
  const subscribed = ref(false)

  // Load initial messages
  const loadMessages = async () => {
    loading.value = true
    try {
      const response = await ticketService.getMessages(ticketId)
      messages.value = response.data.data || []
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      loading.value = false
    }
  }

  // Listen for new messages
  const subscribe = () => {
    if (subscribed.value) return

    channel.value = echo.private(`tickets.${ticketId}`)
      .listen('.new.message', (e) => {
        // Don't add if message already exists (from our own send)
        const exists = messages.value.some(m => m.id === e.message.id)
        if (!exists) {
          messages.value.push(e.message)
        }
      })
      .listen('.user.typing', (e) => {
        // Handle typing indicator from broadcast event
        if (e.user?.id !== authStore.user?.id) {
          if (e.is_typing) {
            if (!typingUsers.value.includes(e.user.id)) {
              typingUsers.value.push(e.user.id)
            }
            // Remove typing indicator after 3 seconds
            setTimeout(() => {
              typingUsers.value = typingUsers.value.filter(id => id !== e.user.id)
            }, 3000)
          } else {
            typingUsers.value = typingUsers.value.filter(id => id !== e.user.id)
          }
        }
      })

    subscribed.value = true
  }

  // Send typing indicator via API
  const sendTyping = async (isTyping = true) => {
    if (authStore.user) {
      try {
        await api.post(`/tickets/${ticketId}/typing`, {
          is_typing: isTyping
        })
      } catch (error) {
        console.error('Error sending typing indicator:', error)
      }
    }
  }

  // Cleanup
  const unsubscribe = () => {
    if (channel.value) {
      channel.value.leave()
      channel.value = null
      subscribed.value = false
    }
  }

  // Add new message locally (optimistic update)
  const addMessage = (message) => {
    messages.value.push(message)
  }

  return {
    messages,
    loading,
    typingUsers,
    subscribed,
    loadMessages,
    subscribe,
    unsubscribe,
    sendTyping,
    addMessage
  }
}
