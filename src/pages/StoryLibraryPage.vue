<template>
  <div class="story-library">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h1 class="page-title">故事库</h1>
    </div>

    <!-- 加载中 -->
    <div v-if="loadingCharacters" class="loading-container">
      <div class="loading-content">
        <p class="message">正在加载角色信息...</p>
      </div>
    </div>

    <!-- 未创建角色提示（只在加载完成且确实没有角色时显示） -->
    <div v-else-if="!loadingCharacters && allCharacters.length === 0 && !character" class="no-character">
      <div class="no-character-content">
        <p class="message">请先创建角色</p>
        <p class="sub-message">您还没有创建任何角色</p>
        <button class="btn btn-primary" @click="goToHome">返回首页</button>
      </div>
    </div>

    <!-- 故事分类（有角色时显示） -->
    <div v-else-if="!loadingCharacters && (allCharacters.length > 0 || character)" class="content-container">
      <!-- 角色选择器 -->
      <div v-if="charactersWithAudio.length > 0" class="character-selector-section">
        <div class="character-selector">
          <h3 class="character-selector-title">选择角色生成故事</h3>
          <div class="characters-list">
            <div 
              v-for="char in charactersWithAudio" 
              :key="char.id"
              class="character-item"
              :class="{ active: selectedCharacterId && selectedCharacterId === char.id }"
              @click="selectCharacter(char)"
            >
              <span class="character-icon">🎤</span>
              <span class="character-name-text">{{ char.name }}</span>
              <span v-if="selectedCharacterId && selectedCharacterId === char.id" class="selected-badge">已选择</span>
            </div>
          </div>
          <p v-if="charactersWithAudio.length > 0" class="character-hint">
            当前选择：{{ getSelectedCharacterName() }}
          </p>
          <p v-if="charactersWithoutAudio.length > 0" class="character-warning">
            <span class="warning-icon">⚠️</span>
            有 {{ charactersWithoutAudio.length }} 个角色未上传录音，无法生成故事
          </p>
        </div>
      </div>

      <!-- 没有可用的角色（已上传录音） -->
      <div v-else-if="!loadingCharacters && allCharacters.length > 0 && charactersWithAudio.length === 0" class="no-available-character">
        <div class="no-available-character-content">
          <p class="message">没有可用的角色</p>
          <p class="sub-message">您创建的角色都还没有上传录音，请先返回首页为角色上传录音</p>
          <button class="btn btn-primary" @click="goToHome">返回首页</button>
        </div>
      </div>

      <!-- 如果没有故事，显示提示 -->
      <div v-if="stories.length === 0" class="no-stories">
        <div class="no-stories-content">
          <p class="message">暂无故事数据</p>
          <p class="sub-message">请检查数据库是否有故事数据，或联系管理员添加故事</p>
        </div>
      </div>

      <!-- 故事列表 -->
      <div v-else class="stories-section">
        <div class="stories-grid">
          <div 
            v-for="story in stories" 
            :key="story.id"
            class="story-card"
          >
            <!-- 封面 -->
            <div class="story-cover">
              <span class="cover-icon">📖</span>
            </div>

            <!-- 内容 -->
            <div class="story-content">
              <div class="story-info">
                <h3 class="story-title">{{ story.title }}</h3>
                <p class="story-duration">时长：{{ formatDuration(story.duration) }}</p>
              </div>
              
              <button 
                v-if="isStoryGenerated(story.id)"
                class="btn btn-success play-btn"
                @click="goToListen(story.id)"
              >
                播放
              </button>
              <button 
                v-else
                class="btn btn-primary generate-btn"
                @click="showConfirmDialog(story.id)"
              >
                生成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成确认弹窗 -->
    <div v-if="showConfirm" class="dialog-overlay" @click="showConfirm = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">确认生成</h3>
        </div>
        <div class="dialog-body">
          <div class="confirm-message">
            <p>
              用<span class="character-name">【{{ getSelectedCharacterName() }}】</span>
              的声音生成
              <span class="story-name">《{{ selectedStoryTitle }}》</span>
              ，开始生成后无法取消，请确认。
            </p>
          </div>
          <div class="dialog-actions">
            <button class="btn btn-outline" @click="showConfirm = false">取消</button>
            <button class="btn btn-primary" @click="confirmGenerate" :disabled="loading">确认</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成进度弹窗 -->
    <div v-if="showGeneratingDialog" class="dialog-overlay">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">正在生成</h3>
        </div>
        <div class="dialog-body">
          <div class="generating-message">
            <div class="loading-spinner"></div>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <p class="progress-percentage">{{ progressPercentage }}%</p>
            </div>
            <p class="progress-hint">此过程可能需要较长时间（约10分钟），请耐心等待，不要关闭页面</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果弹窗（成功/失败） -->
    <div v-if="showResultDialog" class="dialog-overlay result-dialog-overlay" @click="showResultDialog = false">
      <div class="dialog-content result-dialog" @click.stop>
        <div class="result-dialog-header">
          <div class="result-icon-wrapper" :class="resultDialogType === 'success' ? 'success-icon' : 'error-icon'">
            <svg v-if="resultDialogType === 'success'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="result-dialog-title" :class="resultDialogType === 'success' ? 'success-title' : 'error-title'">
            {{ resultDialogType === 'success' ? '生成成功' : '生成失败' }}
          </h3>
        </div>
        <div class="result-dialog-body">
          <p class="result-message" :class="resultDialogType === 'success' ? 'success-message' : 'error-message'">
            {{ resultDialogMessage }}
          </p>
        </div>
        <div class="result-dialog-actions">
          <button 
            v-if="resultDialogType === 'success'"
            class="btn btn-primary result-btn-primary" 
            @click="goToListeningPage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            前往畅听页面
          </button>
          <button 
            class="btn" 
            :class="resultDialogType === 'success' ? 'btn-outline' : 'btn-primary'"
            @click="showResultDialog = false"
          >
            {{ resultDialogType === 'success' ? '稍后查看' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '../store.js'
import * as audioTaskApi from '../api/audioTask.js'
import * as characterApi from '../api/character.js'
import * as storyApi from '../api/story.js'
import { clearAuth } from '../utils/auth.js'

export default {
  name: 'StoryLibraryPage',
  setup() {
    const router = useRouter()
    const showConfirm = ref(false)
    const selectedStoryId = ref(null)
    const loading = ref(false)
    const loadingCharacters = ref(false)
    const allCharacters = ref([])
    const charactersWithAudio = ref([])
    const charactersWithoutAudio = ref([])
    const selectedCharacterId = ref(null)
    const checkingAudio = ref(false)
    const generatingProgress = ref('')
    const showGeneratingDialog = ref(false)
    const currentTaskId = ref(null)
    const pollingInterval = ref(null)
    const progressPercentage = ref(0)
    
    // 成功/失败弹窗状态
    const showResultDialog = ref(false)
    const resultDialogType = ref('success') // 'success' | 'error'
    const resultDialogMessage = ref('')
    
    const character = computed(() => store.state.character)
    const stories = computed(() => store.state.stories)
    const user = computed(() => store.state.user)
    const userStoryBooks = computed(() => store.state.userStoryBooks)
    
    // 加载用户角色列表
    const loadUserCharacters = async () => {
      // 如果没有登录，直接返回
      if (!user.value) {
        console.log('用户未登录，跳过加载角色')
        return
      }
      
      try {
        loadingCharacters.value = true
        const response = await characterApi.getCharacters()
        
        // getCharacters已经处理了数据格式，应该直接是数组
        let characters = null
        if (Array.isArray(response)) {
          characters = response
        } else if (response && Array.isArray(response.data)) {
          characters = response.data
        } else if (response && response.list && Array.isArray(response.list)) {
          characters = response.list
        }
        
        console.log('加载角色响应:', response)
        console.log('解析后的角色列表:', characters)
        console.log('allCharacters.value:', allCharacters.value)
        console.log('character.value:', character.value)
        
        if (characters && Array.isArray(characters)) {
          allCharacters.value = characters
          
          // 检查每个角色是否有录音
          await checkCharactersAudio(characters)
          
          // 如果用户有角色，确保store中有角色信息
          if (characters.length > 0) {
            console.log('找到角色，数量:', characters.length)
            // 如果store中没有角色，且有可用角色，设置第一个可用角色
            if (!character.value) {
              if (charactersWithAudio.value.length > 0) {
                console.log('store中没有角色，设置第一个有录音的角色:', charactersWithAudio.value[0])
                store.actions.setCharacter(charactersWithAudio.value[0])
                selectedCharacterId.value = charactersWithAudio.value[0].id
              } else {
                console.log('没有有录音的角色')
                store.actions.setCharacter(characters[0])
              }
            }
            // 如果store中的角色不在列表中，更新为第一个有录音的角色
            else {
              const currentCharInList = characters.find(c => c.id === character.value.id)
              if (!currentCharInList) {
                if (charactersWithAudio.value.length > 0) {
                  console.log('store中的角色不在列表中，更新为第一个有录音的角色:', charactersWithAudio.value[0])
                  store.actions.setCharacter(charactersWithAudio.value[0])
                  selectedCharacterId.value = charactersWithAudio.value[0].id
                }
              } else {
                // 检查当前角色是否有录音
                const hasAudio = charactersWithAudio.value.some(c => c.id === character.value.id)
                if (hasAudio) {
                  selectedCharacterId.value = character.value.id
                  console.log('当前角色有录音，保持当前角色')
                } else if (charactersWithAudio.value.length > 0) {
                  // 当前角色没有录音，切换到第一个有录音的角色
                  console.log('当前角色没有录音，切换到第一个有录音的角色:', charactersWithAudio.value[0])
                  store.actions.setCharacter(charactersWithAudio.value[0])
                  selectedCharacterId.value = charactersWithAudio.value[0].id
                }
              }
            }
          } else {
            console.log('没有找到角色')
            // 如果没有角色，清空store中的角色信息
            allCharacters.value = []
            charactersWithAudio.value = []
            charactersWithoutAudio.value = []
            selectedCharacterId.value = null
            if (character.value) {
              store.actions.setCharacter(null)
            }
          }
        } else {
          console.log('角色数据格式不正确:', response)
          allCharacters.value = []
          charactersWithAudio.value = []
          charactersWithoutAudio.value = []
          selectedCharacterId.value = null
          if (character.value) {
            store.actions.setCharacter(null)
          }
        }
      } catch (error) {
        console.error('加载角色列表失败:', error)
        allCharacters.value = []
        // 如果是token失效，清除认证信息并跳转到首页（登录页面）
        if (error.code === 401 || error.message?.includes('Token无效') || error.message?.includes('Token已过期')) {
          clearAuth()
          store.actions.setUser(null)
          store.actions.setCharacter(null)
          router.push('/')
        }
        // 其他错误时，不清空已有角色，保持当前状态
      } finally {
        loadingCharacters.value = false
      }
    }
    
    // 加载故事列表和角色信息
    onMounted(async () => {
      // 总是从服务器查询最新的角色列表
      await loadUserCharacters()
      
      // 加载故事列表
      if (stories.value.length === 0) {
        try {
          await store.actions.loadStories()
        } catch (error) {
          console.error('加载故事列表失败:', error)
        }
      }

      // 加载用户故事书列表（用于判断故事是否已生成）
      try {
        await store.actions.loadUserStoryBooks()
      } catch (error) {
        console.error('加载用户故事书列表失败:', error)
      }
      
      // 检查localStorage中是否有未完成的任务
      checkAndRestoreTask()
    })
    
    // 清理定时器
    onUnmounted(() => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }
    })
    
    // 检查角色是否有录音
    const checkCharactersAudio = async (characters) => {
      checkingAudio.value = true
      charactersWithAudio.value = []
      charactersWithoutAudio.value = []
      
      for (const char of characters) {
        try {
          const audioInfo = await characterApi.getCharacterAudio(char.id)
          // 如果tts_voice或cosy_voice存在，说明有录音（优先使用tts_voice）
          if (audioInfo && (audioInfo.tts_voice || audioInfo.cosy_voice)) {
            charactersWithAudio.value.push(char)
          } else {
            charactersWithoutAudio.value.push(char)
          }
        } catch (error) {
          console.error(`检查角色 ${char.id} 的音频失败:`, error)
          // 如果查询失败，认为是无录音
          charactersWithoutAudio.value.push(char)
        }
      }
      
      checkingAudio.value = false
      console.log('有录音的角色:', charactersWithAudio.value.length)
      console.log('无录音的角色:', charactersWithoutAudio.value.length)
    }
    
    // 选择角色
    const selectCharacter = (char) => {
      selectedCharacterId.value = char.id
      store.actions.setCharacter(char)
    }
    
    // 获取选中的角色名称
    const getSelectedCharacterName = () => {
      if (!selectedCharacterId.value) return '未选择'
      const selected = charactersWithAudio.value.find(c => c.id === selectedCharacterId.value)
      return selected ? selected.name : '未选择'
    }
    
    const selectedStoryTitle = computed(() => {
      if (!selectedStoryId.value) return ''
      const story = stories.value.find(s => s.id === selectedStoryId.value)
      return story ? story.title : ''
    })

    // 获取已生成的故事书任务（需要同时匹配storyId和roleId）
    const getGeneratedTask = (storyId, roleId = null) => {
      if (!userStoryBooks.value) return null
      
      // 如果没有指定roleId，使用当前选中的角色ID
      const targetRoleId = roleId || selectedCharacterId.value
      if (!targetRoleId) return null
      
      // 注意：确保ID类型一致，storyId和roleId可能是数字或字符串
      return userStoryBooks.value.find(book => 
        String(book.storyId) === String(storyId) && 
        String(book.roleId) === String(targetRoleId)
      )
    }

    // 判断故事是否已生成（针对当前选中的角色）
    const isStoryGenerated = (storyId) => {
      // 如果没有选中角色，返回false
      if (!selectedCharacterId.value) return false
      return !!getGeneratedTask(storyId, selectedCharacterId.value)
    }

    // 跳转到畅听页面播放
    const goToListeningPage = () => {
      showResultDialog.value = false
      router.push('/listen')
    }
    
    const goToListen = (storyId) => {
      // 使用当前选中的角色ID来查找任务
      const task = getGeneratedTask(storyId, selectedCharacterId.value)
      if (task) {
        router.push({ path: '/listen', query: { playTaskId: task.id } })
      }
    }
    
    // 格式化时长：将秒数转换为 "N分N秒" 格式
    const formatDuration = (seconds) => {
      if (!seconds && seconds !== 0) return '未知'
      
      const totalSeconds = Number(seconds)
      if (isNaN(totalSeconds) || totalSeconds < 0) return '未知'
      
      const minutes = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      
      if (minutes === 0) {
        return `${secs}秒`
      } else if (secs === 0) {
        return `${minutes}分`
      } else {
        return `${minutes}分${secs}秒`
      }
    }
    
    const goToHome = () => {
      router.push('/')
    }
    
    const showConfirmDialog = (storyId) => {
      // 如果正在处理中，不允许打开新的确认对话框
      if (loading.value) {
        console.log('正在处理中，请稍候')
        return
      }
      
      // 检查是否选择了角色
      if (!selectedCharacterId.value) {
        alert('请先选择一个角色')
        return
      }
      
      selectedStoryId.value = storyId
      showConfirm.value = true
    }
    
    // localStorage相关
    const TASK_STORAGE_KEY = 'story_generation_task'
    const TASK_TIMEOUT_MS = 30 * 60 * 1000 // 30分钟超时
    
    // 保存任务到localStorage
    const saveTaskToStorage = (taskId, storyId, characterId) => {
      const taskData = {
        taskId,
        storyId,
        characterId,
        timestamp: Date.now()
      }
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(taskData))
      console.log('任务已保存到localStorage:', taskData)
    }
    
    // 从localStorage获取任务
    const getTaskFromStorage = () => {
      const data = localStorage.getItem(TASK_STORAGE_KEY)
      if (!data) return null
      
      try {
        return JSON.parse(data)
      } catch (e) {
        console.error('解析localStorage任务数据失败:', e)
        return null
      }
    }
    
    // 清除localStorage中的任务
    const clearTaskFromStorage = () => {
      localStorage.removeItem(TASK_STORAGE_KEY)
      console.log('已清除localStorage中的任务')
    }
    
    // 开始轮询任务状态
    const startTaskPolling = (taskId) => {
      console.log('开始轮询任务状态:', taskId)
      currentTaskId.value = taskId
      
      // 立即查询一次
      pollTaskStatus(taskId)
      
      // 每5秒轮询一次
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }
      
      pollingInterval.value = setInterval(() => {
        pollTaskStatus(taskId)
      }, 5000)
    }
    
    // 停止轮询
    const stopTaskPolling = () => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
        pollingInterval.value = null
      }
      currentTaskId.value = null
      console.log('已停止轮询')
    }
    
    // 轮询任务状态
    const pollTaskStatus = async (taskId) => {
      try {
        const taskStatus = await audioTaskApi.getTaskStatus(taskId)
        
        // 计算进度百分比
        if (taskStatus.current_step !== undefined && taskStatus.total_steps) {
          // 根据当前步骤计算百分比
          // 如果已完成，显示100%
          if (taskStatus.status === 'completed') {
            progressPercentage.value = 100
          } else {
            // 根据步骤计算：已完成步骤数 / 总步骤数 * 100
            // 当前步骤从1开始，所以已完成步骤数是 current_step - 1
            const completedSteps = Math.max(0, taskStatus.current_step - 1)
            progressPercentage.value = Math.min(99, Math.round((completedSteps / taskStatus.total_steps) * 100))
          }
        } else if (taskStatus.status === 'pending') {
          progressPercentage.value = 0
        } else if (taskStatus.status === 'processing') {
          // 如果没有步骤信息，根据状态估算
          progressPercentage.value = progressPercentage.value > 0 ? progressPercentage.value : 10
        } else if (taskStatus.status === 'completed') {
          progressPercentage.value = 100
        }
        
        console.log('任务状态:', taskStatus.status, '进度百分比:', progressPercentage.value)
        
        // 检查是否完成或失败
        if (taskStatus.status === 'completed') {
          console.log('任务完成！')
          
          // 先设置进度为100%，让用户看到完成状态
          progressPercentage.value = 100
          
          // 延迟一下再关闭进度弹窗并显示成功弹窗
          setTimeout(() => {
            stopTaskPolling()
            clearTaskFromStorage()
            showGeneratingDialog.value = false
            generatingProgress.value = ''
            
            // 显示成功弹窗
            resultDialogType.value = 'success'
            resultDialogMessage.value = '生成成功！请前往畅听页面查看'
            showResultDialog.value = true
            
            // 刷新用户故事书列表
            store.actions.loadUserStoryBooks().catch(error => {
              console.error('刷新故事书列表失败:', error)
            })
          }, 500) // 延迟500ms，让用户看到100%的进度
          
        } else if (taskStatus.status === 'failed') {
          console.error('任务失败:', taskStatus.error)
          
          // 停止轮询和清理
          stopTaskPolling()
          clearTaskFromStorage()
          showGeneratingDialog.value = false
          generatingProgress.value = ''
          progressPercentage.value = 0
          
          // 显示失败弹窗
          resultDialogType.value = 'error'
          resultDialogMessage.value = taskStatus.error || '未知错误'
          showResultDialog.value = true
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
        
        // 如果是404错误，说明任务可能已被删除
        if (error.message?.includes('404') || error.message?.includes('不存在')) {
          console.warn('任务不存在，停止轮询')
          stopTaskPolling()
          clearTaskFromStorage()
          showGeneratingDialog.value = false
          generatingProgress.value = ''
          progressPercentage.value = 0
          
          // 显示错误弹窗
          resultDialogType.value = 'error'
          resultDialogMessage.value = '任务已不存在，可能已被删除'
          showResultDialog.value = true
        }
        // 其他错误继续轮询，可能是网络问题
      }
    }
    
    // 检查并恢复任务
    const checkAndRestoreTask = () => {
      const taskData = getTaskFromStorage()
      
      if (!taskData) {
        return
      }
      
      // 检查是否超时
      const elapsed = Date.now() - taskData.timestamp
      if (elapsed > TASK_TIMEOUT_MS) {
        console.log('任务已超时，清除localStorage')
        clearTaskFromStorage()
        return
      }
      
      console.log('发现未完成的任务，恢复轮询:', taskData)
      
      // 恢复弹窗和轮询
      showGeneratingDialog.value = true
      progressPercentage.value = 0
      startTaskPolling(taskData.taskId)
    }
    
    const confirmGenerate = async () => {
      // 防止重复提交
      if (loading.value) {
        console.log('正在处理中，请勿重复提交')
        return
      }
      
      if (!selectedStoryId.value || !selectedCharacterId.value || !user.value) {
        alert('请先登录并选择角色')
        return
      }
      
      // 确认选中的角色有录音
      const selectedChar = charactersWithAudio.value.find(c => c.id === selectedCharacterId.value)
      if (!selectedChar) {
        alert('请选择一个已上传录音的角色')
        return
      }
      
      try {
        loading.value = true
        showConfirm.value = false
        showGeneratingDialog.value = true
        progressPercentage.value = 0
        
        // 调用新的ID-based API
        const response = await audioTaskApi.createGenerationTaskByIds({
          story_id: selectedStoryId.value,
          user_id: user.value.id,
          role_id: selectedCharacterId.value,
          task_name: `故事${selectedStoryId.value}生成`
        })
        
        console.log('任务创建成功:', response)
        
        const taskId = response.task_id
        
        // 保存到localStorage
        saveTaskToStorage(taskId, selectedStoryId.value, selectedCharacterId.value)
        
        // 开始轮询
        startTaskPolling(taskId)
        
      } catch (error) {
        console.error('创建生成任务失败:', error)
        showGeneratingDialog.value = false
        
        let errorMessage = error.message || '创建任务失败，请重试'
        alert(errorMessage)
      } finally {
        loading.value = false
      }
    }
    
    return {
      character,
      stories,
      selectedStoryTitle,
      showConfirm,
      selectedStoryId,
      loading,
      loadingCharacters,
      allCharacters,
      charactersWithAudio,
      charactersWithoutAudio,
      selectedCharacterId,
      checkingAudio,
      goToHome,
      showConfirmDialog,
      confirmGenerate,
      formatDuration,
      generatingProgress,
      showGeneratingDialog,
      isStoryGenerated,
      goToListen,
      goToListeningPage,
      currentTaskId,
      pollingInterval,
      selectCharacter,
      getSelectedCharacterName,
      showResultDialog,
      resultDialogType,
      resultDialogMessage,
      progressPercentage
    }
  }
}
</script>

<style scoped>
.story-library {
  min-height: calc(100vh - 60px);
  background: #f9fafb;
  padding-bottom: 24px;
}

.page-header {
  background: linear-gradient(to right, #3b82f6, #6366f1);
  color: white;
  padding: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0;
}

.no-character {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.no-character-content {
  text-align: center;
}

.no-character-content .message {
  color: #4b5563;
  margin-bottom: 8px;
  font-size: 16px;
}

.no-character-content .sub-message {
  color: #6b7280;
  margin-bottom: 16px;
  font-size: 14px;
}

.no-stories {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.no-stories-content {
  text-align: center;
}

.no-stories-content .message {
  color: #4b5563;
  margin-bottom: 8px;
  font-size: 16px;
}

.no-stories-content .sub-message {
  color: #6b7280;
  font-size: 14px;
}

.loading-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.loading-content {
  text-align: center;
}

.loading-content .message {
  color: #4b5563;
}

.character-selector-section {
  margin-bottom: 24px;
}

.character-selector {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.character-selector-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.no-available-character {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.no-available-character-content {
  text-align: center;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.no-available-character-content .message {
  color: #4b5563;
  margin-bottom: 8px;
  font-size: 16px;
}

.no-available-character-content .sub-message {
  color: #6b7280;
  margin-bottom: 16px;
  font-size: 14px;
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.character-item:hover {
  background: #f3f4f6;
}

.character-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.character-icon {
  font-size: 18px;
}

.character-name-text {
  flex: 1;
  color: #1f2937;
  font-weight: 500;
}

.selected-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.current-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.character-hint {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.character-warning {
  color: #f59e0b;
  font-size: 14px;
  margin: 12px 0 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.warning-icon {
  font-size: 16px;
}

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.stories-section {
  margin-bottom: 24px;
}

.stories-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.story-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.story-cover {
  width: 100%;
  height: 128px;
  background: linear-gradient(to bottom right, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 36px;
}

.story-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.story-info {
  margin-bottom: 16px;
}

.story-title {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 16px;
}

.story-duration {
  color: #6b7280;
  font-size: 14px;
}

.generate-btn {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border-radius: 6px;
}

/* 弹窗样式 */
.dialog-header {
  padding: 16px 24px 8px;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dialog-body {
  padding: 8px 24px 24px;
}

.confirm-message {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.character-name {
  font-weight: 700;
  color: #3b82f6;
}

.story-name {
  font-weight: 700;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.dialog-actions .btn {
  padding: 12px;
  font-size: 16px;
}

.dialog-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 生成进度对话框样式 */
.generating-message {
  text-align: center;
  padding: 24px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-bar-container {
  width: 100%;
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background-color: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #3b82f6, #6366f1);
  border-radius: 12px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-percentage {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
  text-align: center;
  margin: 0;
}

.progress-hint {
  font-size: 14px;
  color: #6b7280;
  margin-top: 16px;
  line-height: 1.5;
}

/* 结果弹窗样式 */
.result-dialog-overlay {
  backdrop-filter: blur(4px);
  background-color: rgba(0, 0, 0, 0.6);
}

.result-dialog {
  max-width: 420px;
  border-radius: 16px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.result-dialog-header {
  padding: 32px 24px 16px;
  text-align: center;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.result-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.4s ease-out 0.1s both;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-icon-wrapper.success-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.result-icon-wrapper.error-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
}

.result-dialog-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.result-dialog-title.success-title {
  color: #059669;
}

.result-dialog-title.error-title {
  color: #dc2626;
}

.result-dialog-body {
  padding: 8px 24px 24px;
  text-align: center;
}

.result-message {
  font-size: 16px;
  line-height: 1.6;
  padding: 0;
  margin: 0;
  color: #4b5563;
}

.success-message {
  color: #059669;
}

.error-message {
  color: #dc2626;
}

.result-dialog-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
  flex-direction: column;
}

.result-dialog-actions .btn {
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.result-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.result-btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.result-btn-primary:active {
  transform: translateY(0);
}

.result-dialog-actions .btn-outline {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.result-dialog-actions .btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .page-header {
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .content-container {
    padding: 20px;
  }
  
  .category-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .stories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .story-card {
    flex-direction: row;
  }
  
  .story-cover {
    width: 96px;
    height: 96px;
  }
  
  .cover-icon {
    font-size: 40px;
  }
  
  .story-content {
    padding: 16px;
  }
  
  .story-title {
    font-size: 18px;
  }
  
  .generate-btn {
    padding: 10px;
    font-size: 16px;
    width: auto;
  }
  
  .play-btn {
    width: 100%;
    padding: 8px;
    font-size: 14px;
    border-radius: 6px;
    background-color: #10b981; /* Green color for play button */
    color: white;
    border: none;
  }
  
  .play-btn:hover {
    background-color: #059669;
  }

  @media (min-width: 768px) {
    .play-btn {
      padding: 10px;
      font-size: 16px;
      width: auto;
    }
  }
  
  .dialog-actions {
    flex-direction: row;
  }
  
  .result-dialog {
    max-width: 480px;
  }
  
  .result-dialog-actions {
    flex-direction: row;
  }
  
  .result-dialog-actions .btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .stories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>