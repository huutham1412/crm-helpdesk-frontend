import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/api/auth'

// Pinia store: Quản lý trạng thái authentication của user
// Sử dụng Composition API style với setup store
export const useAuthStore = defineStore('auth', () => {
  // Reactive state: Thông tin user hiện tại
  const user = ref(null)

  // Reactive state: JWT token để xác thực API requests
  // Khởi tạo từ localStorage để persist qua page refresh
  const token = ref(localStorage.getItem('access_token') || null)

  // Reactive state: Theo dõi trạng thái loading khi gọi API
  const loading = ref(false)

  // Reactive state: Lưu trữ error message nếu có
  const error = ref(null)

  // Computed property: Kiểm tra user đã đăng nhập chưa (token có giá trị)
  const isAuthenticated = computed(() => !!token.value)

  // Computed property: Kiểm tra user có role Admin không
  const isAdmin = computed(() => user.value?.roles?.includes('Admin') || false)

  // Computed property: Kiểm tra user có phải staff (Admin hoặc CSKH) không
  // Dùng để phân quyền truy cập các tính năng quản lý
  const isCsKH = computed(() =>
    user.value?.roles?.some(r => ['Admin', 'CSKH'].includes(r)) || false
  )

  // Computed property: Lấy tên user để hiển thị
  const userName = computed(() => user.value?.name || '')

  // Action: Kiểm tra user có role cụ thể không
  const hasRole = (roleName) => {
    return user.value?.roles?.includes(roleName) || false
  }

  // Action: Kiểm tra user có bất kỳ role nào trong danh sách không
  const hasAnyRole = (roleNames) => {
    if (!user.value?.roles) return false
    return roleNames.some(role => user.value.roles.includes(role))
  }

  // Action: Kiểm tra user có tất cả các roles không
  const hasAllRoles = (roleNames) => {
    if (!user.value?.roles) return false
    return roleNames.every(role => user.value.roles.includes(role))
  }

  // Action: Đăng nhập với credentials
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(credentials)

      const data = response.data.data
      const accessToken = data.token
      const userData = data.user

      // Lưu token vào state và localStorage
      token.value = accessToken
      localStorage.setItem('access_token', accessToken)

      // Transform roles data từ API thành mảng role names
      const rolesArray = userData.roles || []
      const roleNames = Array.isArray(rolesArray)
        ? rolesArray.map(r => r.name || r)
        : []

      // Lưu thông tin user vào state
      user.value = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        roles: roleNames,
      }

      console.log('Login successful, user:', user.value)

      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      error.value = err.response?.data?.message || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Action: Đăng ký user mới
  const register = async (userData) => {
    loading.value = true
    error.value = null
    try {
      const response = await authService.register(userData)
      const data = response.data.data

      // Tự động đăng nhập sau khi đăng ký thành công
      token.value = data.token
      localStorage.setItem('access_token', data.token)

      // Transform roles data
      const rolesArray = data.user.roles || []
      const roleNames = Array.isArray(rolesArray)
        ? rolesArray.map(r => r.name || r)
        : []

      user.value = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        roles: roleNames,
      }

      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Action: Đăng xuất và xóa token
  const logout = async () => {
    try {
      // Gọi API logout để invalidate token trên server
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Luôn xóa token và user data local bất kể API success hay fail
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
    }
  }

  // Action: Fetch thông tin user hiện tại từ API
  // Dùng khi app khởi động để validate token còn hợp lệ không
  const fetchUser = async () => {
    // Không fetch nếu không có token
    if (!token.value) return

    loading.value = true
    try {
      const response = await authService.me()
      const data = response.data.data.user

      // Transform roles data
      const rolesArray = data.roles || []
      const roleNames = Array.isArray(rolesArray)
        ? rolesArray.map(r => r.name || r)
        : []

      user.value = {
        id: data.id,
        name: data.name,
        email: data.email,
        roles: roleNames,
      }
    } catch (err) {
      // Token không hợp lệ hoặc hết hạn -> xóa và redirect về login
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
    } finally {
      loading.value = false
    }
  }

  // Action: Cập nhật thông tin profile user
  const updateProfile = async (profileData) => {
    loading.value = true
    try {
      const response = await authService.updateProfile(profileData)
      // Merge updated data vào user hiện tại
      user.value = {
        ...user.value,
        ...response.data.data.user,
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // Return state và actions để sử dụng trong components
  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isCsKH,
    userName,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
  }
})
