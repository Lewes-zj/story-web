// API 基础配置

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * 创建请求配置
 */
export function createRequestConfig(method, url, data = null, requiresAuth = false) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // 如果需要认证，添加 token
  if (requiresAuth) {
    const token = localStorage.getItem('story_voice_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }

  // 添加请求体
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data)
  }

  return config
}

/**
 * 解析 FastAPI 422 错误详情
 */
function parseValidationError(detail) {
  if (!Array.isArray(detail) || detail.length === 0) {
    return '参数校验失败'
  }
  
  // 提取所有错误消息
  const errors = detail.map(item => {
    const field = item.loc && item.loc.length > 1 ? item.loc[item.loc.length - 1] : '参数'
    const message = item.msg || '无效的值'
    
    // 字段名映射（中文）
    const fieldMap = {
      'username': '用户名',
      'email': '邮箱',
      'password': '密码',
      'name': '名称'
    }
    
    const fieldName = fieldMap[field] || field
    
    // 提取更友好的错误消息
    if (message.includes('email')) {
      if (message.includes('@-sign')) {
        return '邮箱地址格式不正确，必须包含 @ 符号'
      }
      return '邮箱地址格式不正确'
    }
    
    if (message.includes('required')) {
      return `${fieldName}不能为空`
    }
    
    if (message.includes('string')) {
      return `${fieldName}必须是字符串类型`
    }
    
    // 返回原始消息，但替换字段名
    return message.replace(field, fieldName)
  })
  
  return errors.join('；')
}

/**
 * 处理响应
 */
export async function handleResponse(response) {
  const contentType = response.headers.get('content-type')
  
  // 如果是 JSON 响应
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    
    if (!response.ok) {
      let errorMessage = '请求失败'
      
      // 处理 FastAPI 的 422 验证错误
      if (response.status === 422 && data.detail) {
        errorMessage = parseValidationError(data.detail)
      } 
      // 处理其他错误格式
      else if (data.message) {
        errorMessage = data.message
      } else if (data.detail) {
        // FastAPI 的其他错误可能直接返回 detail 字符串
        errorMessage = typeof data.detail === 'string' ? data.detail : '请求失败'
      }
      
      const error = new Error(errorMessage)
      error.code = data.code || response.status
      error.data = data.data || data.detail
      throw error
    }
    
    return data
  }
  
  // 如果是其他类型（如音频文件），直接返回 response
  if (!response.ok) {
    const error = new Error('请求失败')
    error.code = response.status
    throw error
  }
  
  return response
}

/**
 * 通用请求方法
 */
export async function request(url, config) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config)
    return await handleResponse(response)
  } catch (error) {
    // 如果是 401，清除认证信息
    if (error.code === 401) {
      localStorage.removeItem('story_voice_token')
      localStorage.removeItem('story_voice_user')
    }
    throw error
  }
}

