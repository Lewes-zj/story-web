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
      <!-- 角色信息显示 -->
      <div v-if="allCharacters.length > 0" class="character-info-section">
        <div class="character-info">
          <h3 class="character-info-title">当前角色</h3>
          <div class="characters-list">
            <div 
              v-for="char in allCharacters" 
              :key="char.id"
              class="character-item"
              :class="{ active: character && character.id === char.id }"
            >
              <span class="character-icon">🎤</span>
              <span class="character-name-text">{{ char.name }}</span>
              <span v-if="character && character.id === char.id" class="current-badge">当前</span>
            </div>
          </div>
          <p v-if="allCharacters.length > 1" class="character-hint">
            您有 {{ allCharacters.length }} 个角色，当前使用：{{ character.name }}
          </p>
        </div>
      </div>

      <!-- 如果没有故事，显示提示 -->
      <div v-if="storiesByCategory.length === 0" class="no-stories">
        <div class="no-stories-content">
          <p class="message">暂无故事数据</p>
          <p class="sub-message">请检查数据库是否有故事数据，或联系管理员添加故事</p>
        </div>
      </div>

      <div v-for="categoryGroup in storiesByCategory" :key="categoryGroup.category" class="category-section">
        <h2 class="category-title">{{ categoryGroup.category }}</h2>
        <div class="stories-grid">
          <div 
            v-for="story in categoryGroup.stories" 
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
              用<span class="character-name">【{{ character.name }}】</span>
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
            <p class="progress-text">{{ generatingProgress || '正在处理，请稍候...' }}</p>
            <p class="progress-hint">此过程可能需要较长时间（约10分钟），请耐心等待，不要关闭页面</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import store, { startPollingTask } from '../store.js'
import * as taskApi from '../api/task.js'
import * as characterApi from '../api/character.js'
import * as storyBookApi from '../api/storyBook.js'
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
    const generatingProgress = ref('')
    const showGeneratingDialog = ref(false)
    
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
          
          // 如果用户有角色，确保store中有角色信息
          if (characters.length > 0) {
            console.log('找到角色，数量:', characters.length)
            // 如果store中没有角色，设置第一个角色
            if (!character.value) {
              console.log('store中没有角色，设置第一个角色:', characters[0])
              store.actions.setCharacter(characters[0])
            }
            // 如果store中的角色不在列表中，更新为第一个角色
            else {
              const currentCharInList = characters.find(c => c.id === character.value.id)
              if (!currentCharInList) {
                console.log('store中的角色不在列表中，更新为第一个角色:', characters[0])
                store.actions.setCharacter(characters[0])
              } else {
                console.log('store中的角色在列表中，保持当前角色')
              }
            }
          } else {
            console.log('没有找到角色')
            // 如果没有角色，清空store中的角色信息
            allCharacters.value = []
            if (character.value) {
              store.actions.setCharacter(null)
            }
          }
        } else {
          console.log('角色数据格式不正确:', response)
          allCharacters.value = []
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
    })
    
    const storiesByCategory = computed(() => {
      console.log('stories.value:', stories.value)
      // 从故事列表中提取所有分类
      if (!stories.value || stories.value.length === 0) {
        return []
      }
      const categories = [...new Set(stories.value.map(s => s.category || '其他'))]
      return categories.map(cat => ({
        category: cat,
        stories: stories.value.filter(s => (s.category || '其他') === cat)
      }))
    })
    
    const selectedStoryTitle = computed(() => {
      if (!selectedStoryId.value) return ''
      const story = stories.value.find(s => s.id === selectedStoryId.value)
      return story ? story.title : ''
    })

    // 获取已生成的故事书任务
    const getGeneratedTask = (storyId) => {
      if (!userStoryBooks.value) return null
      // 注意：确保ID类型一致，storyId可能是数字或字符串
      return userStoryBooks.value.find(book => String(book.storyId) === String(storyId))
    }

    // 判断故事是否已生成
    const isStoryGenerated = (storyId) => {
      return !!getGeneratedTask(storyId)
    }

    // 跳转到畅听页面播放
    const goToListen = (storyId) => {
      const task = getGeneratedTask(storyId)
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
      selectedStoryId.value = storyId
      showConfirm.value = true
    }
    
    const confirmGenerate = async () => {
      // 防止重复提交
      if (loading.value) {
        console.log('正在处理中，请勿重复提交')
        return
      }
      
      if (!selectedStoryId.value || !character.value || !user.value) {
        alert('请先登录并选择角色')
        return
      }
      
      try {
        loading.value = true
        showConfirm.value = false
        showGeneratingDialog.value = true
        generatingProgress.value = '正在获取故事信息...'
        
        // 1. 获取故事路径和详情
        let storyPathResponse, storyDetail
        try {
          [storyPathResponse, storyDetail] = await Promise.all([
            storyApi.getStoryPath(selectedStoryId.value),
            storyApi.getStoryById(selectedStoryId.value)
          ])
        } catch (error) {
          console.error('获取故事信息时出错:', error)
          throw new Error(`获取故事信息失败: ${error.message || '未知错误'}`)
        }
        
        if (!storyDetail) {
          console.error('storyDetail 为空:', storyDetail)
          throw new Error('获取故事信息失败：故事详情为空')
        }
        
        if (!storyPathResponse || !storyPathResponse.story_path) {
          console.error('storyPathResponse 无效:', storyPathResponse)
          throw new Error('获取故事文件路径失败，请检查故事配置')
        }
        
        const storyPath = storyPathResponse.story_path
        const storyText = storyDetail.content || storyDetail.text || '这是一个故事'
        
        generatingProgress.value = '正在获取角色音频信息...'
        
        // 检查 token 是否存在
        const token = localStorage.getItem('story_voice_token')
        if (!token) {
          throw new Error('未登录，请先登录')
        }
        
        // 2. 获取角色的 clean_input_audio 路径
        let audioInfo
        try {
          audioInfo = await characterApi.getCharacterAudio(character.value.id)
        } catch (error) {
          console.error('获取角色音频信息时出错:', error)
          // 如果是认证错误，提供更友好的提示
          if (error.code === 401) {
            throw new Error('登录已过期，请重新登录')
          }
          throw new Error(`获取角色音频信息失败: ${error.message || '未知错误'}`)
        }
        
        if (!audioInfo || !audioInfo.clean_input_audio) {
          throw new Error('角色音频文件不存在，请先为角色上传音频并等待处理完成')
        }
        
        generatingProgress.value = '正在处理情绪向量（第一步，可能需要几分钟）...'
        
        // 3. 第一步：调用处理情绪向量接口
        // 后端会自动从数据库查询 clean_input_audio，并使用固定的文本内容
        let emoVectorResponse
        try {
          emoVectorResponse = await storyBookApi.processEmoVector(
            parseInt(user.value.id),
            parseInt(character.value.id)
          )
        } catch (error) {
          console.error('处理情绪向量时出错:', error)
          // 如果是409冲突错误（重复请求），提供友好提示
          if (error.code === 409 || error.message?.includes('正在处理中')) {
            throw new Error('该请求正在处理中，请勿重复提交')
          }
          throw new Error(`处理情绪向量失败: ${error.message || '未知错误'}`)
        }
        
        if (!emoVectorResponse || !emoVectorResponse.generated_files || emoVectorResponse.generated_files.length === 0) {
          throw new Error('处理情绪向量失败：未生成任何结果')
        }
        
        generatingProgress.value = '情绪向量处理完成，正在生成有声故事书（第二步，可能需要几分钟）...'
        
        // 4. 第二步：调用生成有声故事书接口
        let storyBookResponse
        try {
          storyBookResponse = await storyBookApi.generateStoryBook(
            parseInt(user.value.id),
            parseInt(character.value.id),
            parseInt(selectedStoryId.value),
            storyPath
          )
        } catch (error) {
          console.error('生成有声故事书时出错:', error)
          // 如果是409冲突错误（重复请求），提供友好提示
          if (error.code === 409 || error.message?.includes('正在处理中')) {
            throw new Error('该请求正在处理中，请勿重复提交')
          }
          throw new Error(`生成有声故事书失败: ${error.message || '未知错误'}`)
        }
        
        if (!storyBookResponse || !storyBookResponse.success) {
          throw new Error(storyBookResponse?.message || '生成有声故事书失败')
        }
        
        generatingProgress.value = '生成完成！'
        
        // 5. 等待一下让用户看到完成消息
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        showGeneratingDialog.value = false
        selectedStoryId.value = null
        
        // 显示成功提示
        alert('生成成功！请前往畅听页面查看')
        
        // 可选：跳转到畅听页面
        // router.push('/listen')
      } catch (error) {
        console.error('生成失败:', error)
        showGeneratingDialog.value = false
        
        // 根据错误类型提供不同的提示
        let errorMessage = error.message || '生成失败，请重试'
        if (error.message?.includes('正在处理中')) {
          errorMessage = '该任务正在处理中，请勿重复提交。如果长时间无响应，请刷新页面后重试。'
        } else if (error.message?.includes('超时')) {
          errorMessage = '请求超时，处理可能需要更长时间。请稍后检查任务状态。'
        }
        
        alert(errorMessage)
      } finally {
        // 确保无论成功还是失败，都重置loading状态
        loading.value = false
        generatingProgress.value = ''
      }
    }
    
    return {
      character,
      stories,
      storiesByCategory,
      selectedStoryTitle,
      showConfirm,
      selectedStoryId,
      loading,
      loadingCharacters,
      allCharacters,
      goToHome,
      showConfirmDialog,
      confirmGenerate,
      formatDuration,
      generatingProgress,
      showGeneratingDialog,
      isStoryGenerated,
      goToListen
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

.character-info-section {
  margin-bottom: 24px;
}

.character-info {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.character-info-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
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

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.category-section {
  margin-bottom: 32px;
}

.category-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
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

.progress-text {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 12px;
}

.progress-hint {
  font-size: 14px;
  color: #6b7280;
  margin-top: 16px;
  line-height: 1.5;
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
}

@media (min-width: 1024px) {
  .stories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>