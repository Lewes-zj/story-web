import { reactive, readonly } from 'vue'
import { getUser } from './utils/auth.js'
import * as storyApi from './api/story.js'
import * as taskApi from './api/task.js'
import * as userStoryBookApi from './api/userStoryBook.js'
import { getAudioUrl } from './api/file.js'

// 从 localStorage 恢复用户信息
const savedUser = getUser()

// 定义状态结构
const state = reactive({
  user: savedUser,
  character: null,
  tasks: [], // 兼容旧代码，虽然可能不再使用
  userStoryBooks: [], // 新增：用户有声故事书列表
  stories: [],
  loading: {
    stories: false,
    tasks: false,
    userStoryBooks: false
  }
})

// 定义mutations
const mutations = {
  SET_USER(user) {
    state.user = user
  },
  
  SET_CHARACTER(character) {
    state.character = character
  },
  
  SET_STORIES(stories) {
    state.stories = stories
  },
  
  SET_TASKS(tasks) {
    state.tasks = tasks
  },
  
  SET_USER_STORY_BOOKS(books) {
    state.userStoryBooks = books
  },

  ADD_TASK(task) {
    state.tasks.unshift(task) // 添加到数组开头
  },

  ADD_USER_STORY_BOOK(book) {
    state.userStoryBooks.unshift(book)
  },
  
  UPDATE_TASK(taskId, updates) {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      Object.assign(task, updates)
    }
  },
  
  UPDATE_TASK_STATUS(taskId, status, audioUrl) {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = status
      if (audioUrl) {
        task.audioUrl = audioUrl
      }
    }
  },
  
  SET_LOADING(key, value) {
    state.loading[key] = value
  }
}

// 定义actions
const actions = {
  setUser(user) {
    mutations.SET_USER(user)
  },
  
  setCharacter(character) {
    mutations.SET_CHARACTER(character)
  },
  
  async loadStories(params = {}) {
    try {
      mutations.SET_LOADING('stories', true)
      const data = await storyApi.getStories(params)
      
      console.log('故事API返回数据:', data)
      
      // 处理返回的数据格式
      // FastAPI返回格式: { stories: [], total: int, page: int, size: int }
      let stories = []
      if (data) {
        if (Array.isArray(data)) {
          // 直接是数组
          stories = data
        } else if (data.stories && Array.isArray(data.stories)) {
          // StoryListResponse格式
          stories = data.stories
        } else if (data.list && Array.isArray(data.list)) {
          // 其他可能的格式
          stories = data.list
        } else if (data.data && Array.isArray(data.data)) {
          // 包装在data中
          stories = data.data
        }
      }
      
      console.log('解析后的故事列表:', stories)
      mutations.SET_STORIES(stories)
      return stories
    } catch (error) {
      console.error('加载故事列表失败:', error)
      // 发生错误时，设置空数组，避免页面崩溃
      mutations.SET_STORIES([])
      throw error
    } finally {
      mutations.SET_LOADING('stories', false)
    }
  },
  
  async loadTasks(params = {}) {
    try {
      mutations.SET_LOADING('tasks', true)
      const data = await taskApi.getTasks(params)
      
      // 处理返回的数据格式，可能是列表或分页对象
      let tasks = []
      if (data) {
        if (Array.isArray(data)) {
          tasks = data
        } else if (data.list && Array.isArray(data.list)) {
          tasks = data.list
        } else if (data.tasks && Array.isArray(data.tasks)) {
          tasks = data.tasks
        } else if (data.data && Array.isArray(data.data)) {
          tasks = data.data
        }
      }
      
      mutations.SET_TASKS(tasks)
      return tasks
    } catch (error) {
      console.error('加载任务列表失败:', error)
      // 发生错误时，设置空数组，避免页面崩溃
      mutations.SET_TASKS([])
      throw error
    } finally {
      mutations.SET_LOADING('tasks', false)
    }
  },

  async loadUserStoryBooks(params = {}) {
    try {
      mutations.SET_LOADING('userStoryBooks', true)
      const data = await userStoryBookApi.getUserStoryBooks(params)
      
      let books = []
      if (data) {
         if (Array.isArray(data)) {
          books = data
        } else if (data.list && Array.isArray(data.list)) {
          books = data.list
        }
      }
      mutations.SET_USER_STORY_BOOKS(books)
      return books
    } catch (error) {
      console.error('加载用户故事书列表失败:', error)
      mutations.SET_USER_STORY_BOOKS([])
      throw error
    } finally {
      mutations.SET_LOADING('userStoryBooks', false)
    }
  },
  
  addTask(task) {
    mutations.ADD_TASK(task)
  },

  addUserStoryBook(book) {
    mutations.ADD_USER_STORY_BOOK(book)
  },
  
  updateTask(taskId, updates) {
    mutations.UPDATE_TASK(taskId, updates)
  },
  
  updateTaskStatus(taskId, status, audioUrl) {
    mutations.UPDATE_TASK_STATUS(taskId, status, audioUrl)
  },
  
  // 轮询任务状态
  async pollTaskStatus(taskId) {

    try {
      const statusData = await taskApi.getTaskStatus(taskId)
      const status = statusData.status || statusData.data?.status
      
      if (status === 'completed') {
        // 任务完成，获取任务详情以获取音频文件ID
        const taskDetail = await taskApi.getTaskById(taskId)
        const taskData = taskDetail.data || taskDetail
        const audioFileId = taskData.audioFileId || taskData.audio_file_id
        const audioUrl = audioFileId ? getAudioUrl(audioFileId) : null
        
        // 更新任务状态和音频信息
        mutations.UPDATE_TASK(taskId, {
          status: 'completed',
          audioUrl: audioUrl,
          audioFileId: audioFileId
        })
        return true // 任务完成，停止轮询
      } else {
        mutations.UPDATE_TASK_STATUS(taskId, status)
        return false // 继续轮询
      }
    } catch (error) {
      console.error('获取任务状态失败:', error)
      return false
    }
  }
}

// 任务状态轮询管理
let pollingIntervals = new Map()

/**
 * 开始轮询任务状态
 */
export function startPollingTask(taskId) {
  // 如果已经在轮询，先清除
  if (pollingIntervals.has(taskId)) {
    clearInterval(pollingIntervals.get(taskId))
  }
  
  // 开始轮询
  const interval = setInterval(async () => {
    const isCompleted = await actions.pollTaskStatus(taskId)
    if (isCompleted) {
      // 任务完成，停止轮询
      stopPollingTask(taskId)
    }
  }, 3000) // 每3秒轮询一次
  
  pollingIntervals.set(taskId, interval)
}

/**
 * 停止轮询任务状态
 */
export function stopPollingTask(taskId) {
  if (pollingIntervals.has(taskId)) {
    clearInterval(pollingIntervals.get(taskId))
    pollingIntervals.delete(taskId)
  }
}

/**
 * 停止所有轮询
 */
export function stopAllPolling() {
  pollingIntervals.forEach(interval => clearInterval(interval))
  pollingIntervals.clear()
}

// 导出store
export default {
  state: readonly(state),
  actions
}