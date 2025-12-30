import api from './axios'

// Attachments API functions
export const attachmentService = {
  // Upload attachment to ticket
  upload: (ticketId, file, onProgress = null) => {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }

    return api.post(`/tickets/${ticketId}/attachments`, formData, config)
  },

  // Get all attachments for a ticket
  getTicketAttachments: (ticketId) => {
    return api.get(`/tickets/${ticketId}/attachments`)
  },

  // Get attachment info
  getInfo: (id) => {
    return api.get(`/attachments/${id}`)
  },

  // Delete attachment
  delete: (id) => {
    return api.delete(`/attachments/${id}`)
  },

  // Helper: Check if file is image
  isImage: (file) => {
    return file.type.startsWith('image/')
  },

  // Helper: Check if file is PDF
  isPdf: (file) => {
    return file.type === 'application/pdf'
  },

  // Helper: Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  },

  // Helper: Get file icon class based on type
  getFileIcon: (type) => {
    if (type.startsWith('image/')) return 'fa-image text-purple-500'
    if (type === 'application/pdf') return 'fa-file-pdf text-red-500'
    if (type.includes('word') || type.includes('document')) return 'fa-file-word text-blue-500'
    if (type.includes('excel') || type.includes('sheet')) return 'fa-file-excel text-green-500'
    if (type.includes('zip') || type.includes('rar')) return 'fa-file-zipper text-yellow-500'
    return 'fa-file text-slate-500'
  },

  // Helper: Validate file type
  isValidFileType: (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-zip-compressed'
    ]
    return allowedTypes.includes(file.type)
  },

  // Helper: Get max file size for file type
  getMaxFileSize: (file) => {
    if (file.type.startsWith('image/')) return 5 * 1024 * 1024 // 5MB
    if (file.type === 'application/pdf') return 10 * 1024 * 1024 // 10MB
    if (file.type.includes('word') || file.type.includes('excel') || file.type === 'text/plain') return 10 * 1024 * 1024 // 10MB
    if (file.type.includes('zip') || file.type.includes('rar')) return 20 * 1024 * 1024 // 20MB
    return 10 * 1024 * 1024 // Default 10MB
  },

  // Helper: Get error message for file size
  getFileSizeError: (file) => {
    const maxSize = attachmentService.getMaxFileSize(file)
    const maxSizeMB = maxSize / (1024 * 1024)
    return `Kích thước file quá lớn. Tối đa ${maxSizeMB}MB cho loại file này`
  }
}
