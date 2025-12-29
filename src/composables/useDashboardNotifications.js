import { ref } from 'vue'
import echo from '@/echo'
import { useAuthStore } from '@/stores/auth'

export function useDashboardNotifications() {
  const authStore = useAuthStore()
  const notifications = ref([])
  const subscribed = ref(false)

  const subscribe = () => {
    if (subscribed.value || !authStore.isCsKH) return

    // Listen for all ticket updates (staff only)
    echo.channel('dashboard')
      .listen('.ticket.updated', (e) => {
        notifications.value.push({
          id: Date.now() + Math.random(),
          type: 'ticket_updated',
          ticket: e.ticket,
          created_at: new Date()
        })
      })

    // Listen for new tickets
    echo.channel('tickets')
      .listen('.ticket.created', (e) => {
        notifications.value.push({
          id: Date.now() + Math.random(),
          type: 'new_ticket',
          ticket: e.ticket,
          created_at: new Date()
        })
      })

    subscribed.value = true
  }

  const unsubscribe = () => {
    echo.leave('dashboard')
    echo.leave('tickets')
    subscribed.value = false
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const removeNotification = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    subscribed,
    subscribe,
    unsubscribe,
    clearNotifications,
    removeNotification
  }
}
