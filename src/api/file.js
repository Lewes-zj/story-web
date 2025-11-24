// 文件相关 API
import { API_BASE_URL } from './config.js'
import { getToken } from '../utils/auth.js'

/**
 * 上传录音文件
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = getToken()
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (!response.ok) {
      let errorMessage = '上传失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // 如果无法解析JSON，使用状态文本
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    // 返回数据可能是直接的响应对象，也可能是包装在data字段中
    return data.data || data
  } catch (error) {
    console.error('上传文件错误:', error)
    throw error
  }
}

/**
 * 获取音频文件 URL
 */
export function getAudioUrl(fileId) {
  return `${API_BASE_URL}/api/files/audio/${fileId}`
}

