// JWT Token 管理工具

const TOKEN_KEY = 'story_voice_token'
const USER_KEY = 'story_voice_user'

/**
 * 保存 token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取 token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 移除 token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 保存用户信息
 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 获取用户信息
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 移除用户信息
 */
export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

/**
 * 清除所有认证信息
 */
export function clearAuth() {
  removeToken()
  removeUser()
}

