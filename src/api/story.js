// 故事相关 API
import { request, createRequestConfig } from './config.js'

/**
 * 获取故事列表（从JSON文件）
 */
export async function getStories(params = {}) {
  const { category, page = 1, size = 10 } = params
  
  // 构建查询参数
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  queryParams.append('page', page)
  queryParams.append('size', size)
  
  const config = createRequestConfig('GET', `/api/stories/json?${queryParams.toString()}`, null)
  
  const response = await request(`/api/stories/json?${queryParams.toString()}`, config)
  // FastAPI可能直接返回StoryListResponse对象，也可能包装在data中
  // StoryListResponse包含: { stories: [], total: int, page: int, size: int }
  if (response && response.stories) {
    return response
  }
  return response.data || response
}


/**
 * 获取故事详情（从JSON文件）
 */
export async function getStoryById(id) {
  const config = createRequestConfig('GET', `/api/stories/json/${id}`, null)
  
  const response = await request(`/api/stories/json/${id}`, config)
  // FastAPI 直接返回 StoryDetailResponse 对象，不是包装在 data 中
  return response.data || response
}


/**
 * 获取故事的JSON文件路径
 * @param {string|number} storyId - 故事ID
 */
export async function getStoryPath(storyId) {
  const config = createRequestConfig('GET', `/api/stories/${storyId}/path`, null)
  
  const response = await request(`/api/stories/${storyId}/path`, config)
  return response.data || response
}

