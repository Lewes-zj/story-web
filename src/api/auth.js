// 认证相关 API
import { request, createRequestConfig } from './config.js'

/**
 * 用户注册
 */
export async function register(username, email, password) {
  const config = createRequestConfig('POST', '/api/auth/register', {
    username,
    email,
    password
  })
  
  const response = await request('/api/auth/register', config)
  // 后端直接返回模型，不是 { code, message, data } 格式
  // 如果 response.data 存在则使用，否则直接使用 response
  return response.data || response
}

/**
 * 用户登录
 */
export async function login(username, password) {
  const config = createRequestConfig('POST', '/api/auth/login', {
    username,
    password
  })
  
  const response = await request('/api/auth/login', config)
  // 后端直接返回模型，不是 { code, message, data } 格式
  // 如果 response.data 存在则使用，否则直接使用 response
  return response.data || response
}

/**
 * 用户退出
 */
export async function logout() {
  const config = createRequestConfig('POST', '/api/auth/logout', null, true)
  
  try {
    await request('/api/auth/logout', config)
  } catch (error) {
    // 即使请求失败，也清除本地认证信息
    console.error('Logout error:', error)
  }
}

