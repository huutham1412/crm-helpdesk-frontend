import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const DashboardView = () => import('@/views/dashboard/DashboardView.vue')
const TicketListView = () => import('@/views/tickets/TicketListView.vue')
const TicketDetailView = () => import('@/views/tickets/TicketDetailView.vue')
const CreateTicketView = () => import('@/views/tickets/CreateTicketView.vue')
const UserListView = () => import('@/views/users/UserListView.vue')
const CategoryListView = () => import('@/views/categories/CategoryListView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, title: 'Dashboard', description: 'Tổng quan hệ thống' },
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: TicketListView,
      meta: { requiresAuth: true, title: 'Tickets', description: 'Danh sách hỗ trợ' },
    },
    {
      path: '/tickets/create',
      name: 'create-ticket',
      component: CreateTicketView,
      meta: { requiresAuth: true, title: 'Tạo Ticket', description: 'Tạo yêu cầu hỗ trợ mới' },
    },
    {
      path: '/tickets/:id',
      name: 'ticket-detail',
      component: TicketDetailView,
      meta: { requiresAuth: true, title: 'Chi tiết Ticket' },
    },
    {
      path: '/users',
      name: 'users',
      component: UserListView,
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Users', description: 'Quản lý người dùng' },
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoryListView,
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Categories', description: 'Quản lý danh mục' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  const hasToken = !!localStorage.getItem('access_token')
  if (hasToken && !authStore.user) {
    await authStore.fetchUser()
  }

  const isAuthenticated = !!authStore.token && !!authStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin && isAuthenticated && !authStore.isAdmin) {
    next('/dashboard')
    return
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
