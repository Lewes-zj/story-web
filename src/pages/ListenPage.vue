<template>
  <div class="listen-page">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h1 class="page-title">畅听</h1>
      <p v-if="character" class="character-info">{{ character.name }}的故事</p>
    </div>

    <!-- 任务列表 -->
    <div class="content-container">
      <div v-if="tasks.length === 0" class="empty-state">
        <div class="empty-icon">🎧</div>
        <p class="empty-text">还没有生成任何故事</p>
        <p class="empty-subtext">前往故事库开始生成吧</p>
      </div>
      
      <div v-else class="tasks-list">
        <div 
          v-for="task in tasks" 
          :key="task.id"
          class="task-card"
        >
          <div class="task-content">
            <!-- 封面 -->
            <div class="task-cover">
              <span class="cover-icon">📖</span>
            </div>

            <!-- 内容 -->
            <div class="task-info">
              <h3 class="task-title">{{ getStoryTitle(task.storyId) }}</h3>
              <div class="task-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span class="task-duration">{{ getStoryDuration(task.storyId) }}</span>
              </div>
              <div class="task-status">
                <!-- 移除状态标签，因为现在只显示已生成的故事 -->
              </div>
            </div>

            <!-- 播放按钮 -->
            <div class="play-button-container">
              <button 
                class="play-button"
                :class="{ playing: isPlaying(task.id) }"
                @click="togglePlay(task.id)"
              >
                <svg v-if="!isPlaying(task.id)" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </button>
            </div>
          </div>

          <!-- 进度条 -->
          <div v-if="isPlaying(task.id)" class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: playingProgress + '%' }"
              ></div>
            </div>
            <p class="progress-text">{{ Math.floor(playingProgress / 100 * 10) }}s / 10s</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮播放器 -->
    <div v-if="playingTaskId && playingStory" class="floating-player">
      <div class="player-content">
        <div class="player-cover">
          <span class="cover-icon">🎵</span>
        </div>
        <div class="player-info">
          <p class="player-title">{{ playingStory.title }}</p>
          <div class="player-progress">
            <div 
              class="progress-bar"
              :style="{ width: playingProgress + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import store from '../store.js'
import * as storyApi from '../api/story.js'
import { getAudioUrl } from '../api/file.js'
import { API_BASE_URL } from '../api/config.js'
import { clearAuth } from '../utils/auth.js'

export default {
  name: 'ListenPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const playingTaskId = ref(null)
    const playingProgress = ref(0)
    const audioElement = ref(null)
    let progressInterval = null
    
    const character = computed(() => store.state.character)
    const tasks = computed(() => store.state.userStoryBooks) // 使用用户故事书列表
    const stories = computed(() => store.state.stories)
    
    // 加载任务列表和故事列表
    onMounted(async () => {
      try {
        // 加载用户故事书列表
        await store.actions.loadUserStoryBooks()
        
        // 如果故事列表为空，加载故事列表
        if (stories.value.length === 0) {
          await store.actions.loadStories()
        }

        // 检查是否需要自动播放
        if (route.query.playTaskId) {
          const taskId = parseInt(route.query.playTaskId)
          const task = tasks.value.find(t => t.id === taskId)
          if (task) {
            // 稍微延迟一下，确保DOM更新完成，体验更好
            setTimeout(() => {
              togglePlay(taskId)
              
              // 滚动到对应的任务卡片
              // 这里我们简单处理，如果能获取到元素的话
              // const el = document.getElementById(`task-${taskId}`)
              // if (el) el.scrollIntoView({ behavior: 'smooth' })
            }, 500)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        // 如果是token失效，清除认证信息并跳转到首页（登录页面）
        if (error.code === 401 || error.message?.includes('Token无效') || error.message?.includes('Token已过期')) {
          clearAuth()
          store.actions.setUser(null)
          store.actions.setCharacter(null)
          router.push('/')
        }
      }
    })
    
    const playingStory = computed(() => {
      if (!playingTaskId.value) return null
      const task = tasks.value.find(t => t.id === playingTaskId.value)
      if (!task) return null
      return stories.value.find(s => String(s.id) === String(task.storyId))
    })
    
    const getStoryTitle = (storyId) => {
      const story = stories.value.find(s => String(s.id) === String(storyId))
      return story ? story.title : '未知故事'
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
    
    const getStoryDuration = (storyId) => {
      const story = stories.value.find(s => String(s.id) === String(storyId))
      return story ? formatDuration(story.duration) : ''
    }
    
    const isPlaying = (taskId) => {
      return playingTaskId.value === taskId
    }
    
    const togglePlay = async (taskId) => {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) return
      
      // 如果正在播放当前任务，则停止
      if (playingTaskId.value === taskId) {
        if (audioElement.value) {
          audioElement.value.pause()
          audioElement.value = null
        }
        playingTaskId.value = null
        playingProgress.value = 0
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        return
      }
      
      // 停止当前播放
      if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value = null
      }
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      
      // 开始播放新任务
      try {
        // 获取音频URL
        let audioUrl = null
        // UserStoryBookItem 结构中是 storyBookPath
        if (task.storyBookPath) {
          if (task.storyBookPath.startsWith('http')) {
            audioUrl = task.storyBookPath
          } else {
            // 处理相对路径，指向后端挂载的静态目录
            // 移除开头的 / (如果有)
            const path = task.storyBookPath.startsWith('/') ? task.storyBookPath.slice(1) : task.storyBookPath
            // 确保 baseUrl 不以 / 结尾
            const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
            audioUrl = `${cleanBaseUrl}/${path}`
          }
        } else if (task.audioUrl) {
           // 兼容旧字段
          audioUrl = task.audioUrl.startsWith('http') 
            ? task.audioUrl 
            : getAudioUrl(task.audioUrl)
        }
        
        if (!audioUrl) {
          alert('音频文件不存在')
          return
        }
        
        // 创建音频元素
        const audio = new Audio(audioUrl)
        audioElement.value = audio
        
        // 更新进度
        audio.addEventListener('timeupdate', () => {
          if (audio.duration) {
            playingProgress.value = (audio.currentTime / audio.duration) * 100
          }
        })
        
        // 播放结束
        audio.addEventListener('ended', () => {
          playingTaskId.value = null
          playingProgress.value = 0
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
          audioElement.value = null
        })
        
        // 错误处理
        audio.addEventListener('error', (e) => {
          console.error('音频播放错误:', e)
          alert('音频播放失败')
          playingTaskId.value = null
          playingProgress.value = 0
          audioElement.value = null
        })
        
        playingTaskId.value = taskId
        playingProgress.value = 0
        
        // 开始播放
        await audio.play()
      } catch (error) {
        console.error('播放音频失败:', error)
        alert('播放音频失败')
        playingTaskId.value = null
        playingProgress.value = 0
        audioElement.value = null
      }
    }
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value = null
      }
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    })
    
    return {
      character,
      tasks,
      playingTaskId,
      playingProgress,
      playingStory,
      getStoryTitle,
      getStoryDuration,
      isPlaying,
      togglePlay
    }
  }
}
</script>

<style scoped>
.listen-page {
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
  text-align: center;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.character-info {
  font-size: 14px;
  color: #bfdbfe;
  margin-top: 4px;
}

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-text {
  color: #4b5563;
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-subtext {
  color: #6b7280;
  font-size: 14px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.task-cover {
  width: 56px;
  height: 56px;
  background: linear-gradient(to bottom right, #3b82f6, #6366f1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-icon {
  font-size: 24px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.task-meta svg {
  color: #6b7280;
}

.task-duration {
  color: #6b7280;
  font-size: 12px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.generating {
  background: #e5e7eb;
  color: #374151;
}

.status-tag.completed {
  background: #dcfce7;
  color: #166534;
}

.play-button-container {
  flex-shrink: 0;
}

.play-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.play-button:hover {
  background: #2563eb;
}

.play-button.playing {
  background: #dc2626;
}

.play-button.playing:hover {
  background: #b91c1c;
}

.progress-container {
  padding: 0 16px 16px;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.5s;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

/* 悬浮播放器 */
.floating-player {
  position: fixed;
  bottom: 70px;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
  z-index: 100;
}

.player-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-cover {
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom right, #3b82f6, #6366f1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.player-cover .cover-icon {
  font-size: 20px;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.player-progress .progress-bar {
  height: 100%;
  background: #3b82f6;
  transition: width 0.5s;
  margin-bottom: 0;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .page-header {
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .character-info {
    font-size: 16px;
  }
  
  .content-container {
    padding: 20px;
  }
  
  .task-content {
    padding: 20px;
  }
  
  .task-cover {
    width: 64px;
    height: 64px;
  }
  
  .cover-icon {
    font-size: 28px;
  }
  
  .task-title {
    font-size: 18px;
  }
  
  .play-button {
    width: 48px;
    height: 48px;
  }
  
  .progress-bar {
    height: 8px;
  }
  
  .floating-player {
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    padding: 20px;
  }
  
  .player-content {
    gap: 16px;
  }
  
  .player-cover {
    width: 48px;
    height: 48px;
  }
  
  .player-cover .cover-icon {
    font-size: 24px;
  }
  
  .player-title {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .player-progress {
    height: 6px;
  }
}
</style>