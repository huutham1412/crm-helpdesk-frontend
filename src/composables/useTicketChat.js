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
  const subscribe = (onTicketUpdate = null) => {
    if (subscribed.value) return

    channel.value = echo.private(`tickets.${ticketId}`)
      .listen('.new.message', (e) => {
        // Don't add if message already exists (from our own send)
        // OR if message was sent by current user (toOthers() might not work with Reverb)
        const exists = messages.value.some(m => m.id === e.message.id)
        const isMyMessage = e.message.user?.id === authStore.user?.id

        if (!exists && !isMyMessage) {
          messages.value.push(e.message)

          // Auto mark as read when receiving new message (while user is viewing the chat)
          // This enables realtime "seen" status without needing to reopen the ticket
          markAsRead(e.message.id)
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
      .listen('.message.read', (e) => {
        // Update message read status
        const messageIndex = messages.value.findIndex(m => m.id === e.message_id)
        if (messageIndex !== -1 && !messages.value[messageIndex].read_at) {
          messages.value[messageIndex].read_at = e.read_at
          // Force trigger reactivity
          messages.value = [...messages.value]
        }
      })
      .listen('.ticket.updated', (e) => {
        // Handle ticket status changes, assign changes, etc.
        if (onTicketUpdate && e.ticket) {
          onTicketUpdate(e.ticket)
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

  // Mark messages as read
  const markAsRead = async (messageId = null) => {
    if (authStore.user) {
      try {
        // Optimistic update: mark local messages as read first
        const now = new Date().toISOString()
        let hasChanges = false

        if (messageId) {
          // Mark specific message
          const msg = messages.value.find(m => m.id === messageId)
          if (msg && msg.user_id !== authStore.user?.id && !msg.read_at) {
            msg.read_at = now
            hasChanges = true
          }
        } else {
          // Mark all unread messages (not sent by current user)
          messages.value.forEach(msg => {
            if (msg.user_id !== authStore.user?.id && !msg.read_at) {
              msg.read_at = now
              hasChanges = true
            }
          })
        }

        // Force trigger reactivity by creating new array reference
        if (hasChanges) {
          messages.value = [...messages.value]
        }

        // Then call API to persist and notify others
        await api.post(`/tickets/${ticketId}/messages/read`, {
          message_id: messageId
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
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

  // Update message read status locally
  const updateMessageReadStatus = (messageId, readAt) => {
    const messageIndex = messages.value.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      messages.value[messageIndex].read_at = readAt
    }
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
    markAsRead,
    addMessage,
    updateMessageReadStatus
  }
}
