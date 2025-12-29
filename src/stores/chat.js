import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // Unread message counts per ticket
  const unreadCounts = ref({})

  // Online users tracking
  const onlineUsers = ref(new Set())

  // Increment unread count for a ticket
  const incrementUnread = (ticketId) => {
    unreadCounts.value[ticketId] = (unreadCounts.value[ticketId] || 0) + 1
  }

  // Clear unread count for a ticket
  const clearUnread = (ticketId) => {
    unreadCounts.value[ticketId] = 0
  }

  // Get total unread count across all tickets
  const totalUnread = () => {
    return Object.values(unreadCounts.value).reduce((sum, count) => sum + count, 0)
  }

  // Get unread count for specific ticket
  const getUnread = (ticketId) => {
    return unreadCounts.value[ticketId] || 0
  }

  // Mark user as online
  const setUserOnline = (userId) => {
    onlineUsers.value.add(userId)
  }

  // Mark user as offline
  const setUserOffline = (userId) => {
    onlineUsers.value.delete(userId)
  }

  // Check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.value.has(userId)
  }

  return {
    unreadCounts,
    onlineUsers,
    incrementUnread,
    clearUnread,
    totalUnread,
    getUnread,
    setUserOnline,
    setUserOffline,
    isUserOnline
  }
})
