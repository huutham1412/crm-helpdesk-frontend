import api from './axios'

// Auth API functions
// React: export const login = (data) => api.post('/login', data)
export const authService = {
  // Đăng nhập
  login: (credentials) => api.post('/login', credentials),

  // Đăng ký
  register: (userData) => api.post('/register', userData),

  // Đăng xuất
  logout: () => api.post('/logout'),

  // Lấy thông tin user hiện tại
  me: () => api.get('/me'),

  // Làm mới token
  refresh: () => api.post('/refresh'),

  // Cập nhật profile
  updateProfile: (data) => api.put('/profile', data),

  // Đổi mật khẩu
  changePassword: (data) => api.post('/change-password', data),
}
