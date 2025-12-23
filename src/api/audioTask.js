// 音频任务相关 API
import { createRequestConfig, API_BASE_URL } from './config.js'

/**
 * 基于ID创建音频生成任务
 * @param {Object} data - 请求数据
 * @param {number} data.story_id - 故事ID
 * @param {number} data.user_id - 用户ID
 * @param {number} data.role_id - 角色ID
 * @param {string} [data.task_name] - 任务名称（可选）
 * @returns {Promise<Object>} 任务响应，包含 task_id
 */
export async function createGenerationTaskByIds(data) {
  const config = createRequestConfig('POST', '/api/generate_by_ids', data, false)
  
  const response = await fetch(`${API_BASE_URL}/api/generate_by_ids`, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.detail || '创建生成任务失败'
    throw new Error(errorMessage)
  }
  
  return await response.json()
}

/**
 * 获取任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 任务状态信息
 */
export async function getTaskStatus(taskId) {
  const config = createRequestConfig('GET', `/api/task/${taskId}`, null, false)
  
  const response = await fetch(`${API_BASE_URL}/api/task/${taskId}`, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.detail || '获取任务状态失败'
    throw new Error(errorMessage)
  }
  
  return await response.json()
}
