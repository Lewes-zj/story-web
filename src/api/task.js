// 任务相关 API
import { request, createRequestConfig } from './config.js'

/**
 * 创建语音生成任务
 */
export async function createTask(storyId, characterId) {
  const config = createRequestConfig('POST', '/api/tasks', {
    storyId,
    characterId
  }, true)
  
  const response = await request('/api/tasks', config)
  return response.data
}

/**
 * 获取任务列表
 */
export async function getTasks(params = {}) {
  const { status, page = 1, size = 10 } = params
  
  // 构建查询参数
  const queryParams = new URLSearchParams()
  if (status) queryParams.append('status', status)
  queryParams.append('page', page)
  queryParams.append('size', size)
  
  const config = createRequestConfig('GET', `/api/tasks?${queryParams.toString()}`, null, true)
  
  const response = await request(`/api/tasks?${queryParams.toString()}`, config)
  return response.data
}

/**
 * 获取任务详情
 */
export async function getTaskById(id) {
  const config = createRequestConfig('GET', `/api/tasks/${id}`, null, true)
  
  const response = await request(`/api/tasks/${id}`, config)
  return response.data
}

/**
 * 获取任务状态
 */
export async function getTaskStatus(id) {
  const config = createRequestConfig('GET', `/api/tasks/${id}/status`, null, true)
  
  const response = await request(`/api/tasks/${id}/status`, config)
  return response.data
}

