// 角色相关 API
import { request, createRequestConfig } from './config.js'

/**
 * 创建角色
 */
export async function createCharacter(name, fileId = null) {
  const body = { name }
  if (fileId) {
    body.fileId = fileId
  }
  
  const config = createRequestConfig('POST', '/api/characters', body, true)
  
  const response = await request('/api/characters', config)
  return response.data
}

/**
 * 获取用户角色列表
 */
export async function getCharacters() {
  const config = createRequestConfig('GET', '/api/characters', null, true)
  
  const response = await request('/api/characters', config)
  // FastAPI可能直接返回数组，也可能包装在data中
  if (Array.isArray(response)) {
    return response
  }
  return response.data || response
}

/**
 * 获取角色的音频路径
 * @param {string|number} characterId - 角色ID
 */
export async function getCharacterAudio(characterId) {
  const config = createRequestConfig('GET', `/api/characters/${characterId}/audio`, null, true)
  
  const response = await request(`/api/characters/${characterId}/audio`, config)
  return response.data || response
}

