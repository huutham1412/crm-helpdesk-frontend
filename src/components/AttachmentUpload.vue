<script setup>
import { ref, computed } from 'vue'
import { attachmentService } from '@/api/attachments'
import { useToast } from 'vue-toastification'

const props = defineProps({
  ticketId: { type: Number, required: true },
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref(null)

// Get pending attachments (not yet linked to a message)
const pendingAttachments = computed(() => {
  return props.modelValue
})

// Handle file selection
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)

  for (const file of files) {
    await uploadFile(file)
  }

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Upload single file
const uploadFile = async (file) => {
  // Validate file type
  if (!attachmentService.isValidFileType(file)) {
    toast.error('Loại file không được phép. Các loại được phép: ảnh, PDF, tài liệu, file nén')
    return
  }

  // Validate file size
  const maxSize = attachmentService.getMaxFileSize(file)
  if (file.size > maxSize) {
    toast.error(attachmentService.getFileSizeError(file))
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    const response = await attachmentService.upload(
      props.ticketId,
      file,
      (progress) => {
        uploadProgress.value = progress
      }
    )

    if (response.data.success) {
      const newAttachment = {
        id: response.data.data.id,
        filename: response.data.data.filename,
        url: response.data.data.url,
        size: response.data.data.size,
        type: response.data.data.type,
        extension: response.data.data.extension,
        is_image: response.data.data.is_image
      }

      emit('update:modelValue', [...props.modelValue, newAttachment])
      toast.success('Đã tải lên file thành công')
    }
  } catch (error) {
    console.error('Upload failed:', error)
    const errorMsg = error.response?.data?.message || 'Không thể tải lên file'
    toast.error(errorMsg)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Remove attachment (delete from server)
const removeAttachment = async (attachment) => {
  try {
    await attachmentService.delete(attachment.id)

    emit('update:modelValue',
      props.modelValue.filter(a => a.id !== attachment.id)
    )

    toast.success('Đã xóa file')
  } catch (error) {
    console.error('Delete failed:', error)
    const errorMsg = error.response?.data?.message || 'Không thể xóa file'
    toast.error(errorMsg)
  }
}

// Format file name for display (truncate if too long)
const formatFileName = (filename) => {
  const maxLength = 30
  if (filename.length <= maxLength) return filename

  const extIndex = filename.lastIndexOf('.')
  if (extIndex === -1) return filename.substring(0, maxLength - 3) + '...'

  const ext = filename.substring(extIndex)
  const name = filename.substring(0, extIndex)

  if (name.length > maxLength - ext.length - 3) {
    return name.substring(0, maxLength - ext.length - 3) + '...' + ext
  }

  return filename
}
</script>

<template>
  <div class="attachment-upload">
    <!-- Upload Button -->
    <label
      :class="[
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200',
        'border border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50',
        uploading || disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-100'
          : 'bg-white hover:shadow-sm'
      ]"
    >
      <svg v-if="!uploading" class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <svg v-else class="animate-spin w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span :class="uploading ? 'text-primary-600 font-medium' : 'text-slate-600'">
        {{ uploading ? `Đang tải lên... ${uploadProgress}%` : 'Đính kèm file' }}
      </span>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :disabled="uploading || disabled"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        @change="handleFileSelect"
      />
    </label>

    <!-- Attachment List -->
    <div v-if="pendingAttachments.length > 0" class="mt-3 space-y-2">
      <div
        v-for="attachment in pendingAttachments"
        :key="attachment.id"
        class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <!-- Image Preview -->
          <div v-if="attachment.is_image" class="w-12 h-12 rounded overflow-hidden flex-shrink-0">
            <img :src="attachment.url" class="w-full h-full object-cover" />
          </div>

          <!-- File Icon -->
          <div v-else class="w-12 h-12 rounded bg-slate-200 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate" :title="attachment.filename">
              {{ formatFileName(attachment.filename) }}
            </p>
            <p class="text-xs text-slate-500">{{ attachment.size }}</p>
          </div>
        </div>

        <!-- Remove Button -->
        <button
          @click="removeAttachment(attachment)"
          :disabled="uploading"
          class="p-1 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Xóa"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- File types hint -->
    <p class="text-xs text-slate-400 mt-2">
      Hỗ trợ: Ảnh (JPG, PNG, GIF, WEBP), PDF, tài liệu (DOC, DOCX, XLS, XLSX, TXT), file nén (ZIP, RAR)
    </p>
  </div>
</template>

<style scoped>
.attachment-upload input[type="file"] {
  display: none;
}
</style>
