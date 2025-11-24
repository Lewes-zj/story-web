// 有声故事书相关 API
import { createRequestConfig, API_BASE_URL, handleResponse } from './config.js'

/**
 * 处理情绪向量
 * @param {number} userId - 用户ID
 * @param {number} roleId - 角色ID
 * @param {string} cleanInputAudio - 清理后的输入音频路径
 * @param {string} text - 文本内容
 * @param {number} timeout - 超时时间（毫秒），默认15分钟
 */
export async function processEmoVector(userId, roleId, cleanInputAudio, text, timeout = 15 * 60 * 1000) {
  const config = createRequestConfig('POST', '/emo_vector/process_emo_vector/', {
    user_id: userId,
    role_id: roleId,
    clean_input_audio: cleanInputAudio,
    text: text
  }, true)
  
  // 创建带超时的请求
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    config.signal = controller.signal
    const response = await fetch(`${API_BASE_URL}/emo_vector/process_emo_vector/`, config)
    clearTimeout(timeoutId)
    return await handleResponse(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('请求超时，处理情绪向量可能需要更长时间，请稍后重试')
    }
    throw error
  }
}

/**
 * 生成有声故事书
 * @param {number} userId - 用户ID
 * @param {number} roleId - 角色ID
 * @param {string} storyPath - 故事文件路径
 * @param {boolean} keepTempFiles - 是否保留临时文件
 * @param {number} timeout - 超时时间（毫秒），默认15分钟
 */
export async function generateStoryBook(userId, roleId, storyPath, keepTempFiles = false, timeout = 15 * 60 * 1000) {
  const config = createRequestConfig('POST', '/story_book/generate/', {
    user_id: userId,
    role_id: roleId,
    story_path: storyPath,
    keep_temp_files: keepTempFiles
  }, true)
  
  // 创建带超时的请求
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    config.signal = controller.signal
    const response = await fetch(`${API_BASE_URL}/story_book/generate/`, config)
    clearTimeout(timeoutId)
    return await handleResponse(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('请求超时，生成有声故事书可能需要更长时间，请稍后重试')
    }
    throw error
  }
}

