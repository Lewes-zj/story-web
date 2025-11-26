// 用户有声故事书相关 API
import { createRequestConfig, API_BASE_URL, handleResponse } from './config.js'

/**
 * 获取用户有声故事书列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.size - 每页数量，默认10
 */
export async function getUserStoryBooks(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page)
  if (params.size) queryParams.append('size', params.size)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/api/user_story_books?${queryString}` : '/api/user_story_books'
  
  const config = createRequestConfig('GET', url, null, true)
  const response = await fetch(`${API_BASE_URL}${url}`, config)
  return await handleResponse(response)
}

