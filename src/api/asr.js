// ASR语音识别相关 API
import { API_BASE_URL } from './config.js'
import { getToken } from '../utils/auth.js'

/**
 * 识别上传的音频文件
 * @param {File} file - 音频文件
 * @param {string} expectedText - 期望的文本（可选，用于验证）
 * @returns {Promise<{recognizedText: string, confidence: number, validationPassed: boolean, message: string}>}
 */
export async function recognizeAudio(file, expectedText = null) {
  const formData = new FormData()
  formData.append('file', file)
  
  // 如果提供了期望文本，添加到formData
  if (expectedText) {
    formData.append('expected_text', expectedText)
  }
  
  const token = getToken()
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/asr/recognize`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (!response.ok) {
      let errorMessage = '识别失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    // 返回数据可能是直接的响应对象，也可能是包装在data字段中
    return data.data || data
  } catch (error) {
    console.error('ASR识别错误:', error)
    throw error
  }
}

/**
 * 通过文件ID识别音频（文件已上传到服务器）
 * @param {string} fileId - 文件ID
 * @param {string} expectedText - 期望的文本（可选，用于验证）
 * @returns {Promise<{recognizedText: string, confidence: number, validationPassed: boolean, message: string}>}
 */
export async function recognizeAudioByFileId(fileId, expectedText = null) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const body = {
    fileId,
    expectedText
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/asr/recognize-by-file-id`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      let errorMessage = '识别失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return data.data || data
  } catch (error) {
    console.error('ASR识别错误:', error)
    throw error
  }
}

/**
 * 检查ASR服务健康状态
 * @returns {Promise<{status: string, configured: boolean, message: string}>}
 */
export async function checkASRHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/asr/health`)
    
    if (!response.ok) {
      throw new Error('ASR服务不可用')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('检查ASR健康状态错误:', error)
    throw error
  }
}

/**
 * 校验录音内容是否正确（使用FunASR）
 * @param {File} file - 音频文件
 * @param {string} text - 标准文本（可选，如果不提供则使用后端配置的默认文本）
 * @returns {Promise<{success: boolean, data: {text: string, similarity: number, passed: boolean}}>}
 */
export async function verifyAudio(file, text = null) {
  const formData = new FormData()
  formData.append('file', file)
  
  // 如果提供了标准文本，添加到formData
  if (text) {
    formData.append('text', text)
  }
  
  const token = getToken()
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/asr/verify`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (!response.ok) {
      let errorMessage = '校验失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('ASR校验错误:', error)
    throw error
  }
}

