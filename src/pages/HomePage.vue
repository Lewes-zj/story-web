<template>
  <div class="home-page">
    <div class="content-container">
      <!-- 未登录状态 - 显示登录/注册按钮 -->
      <div v-if="!user" class="auth-section">
        <div class="welcome-card">
          <div class="welcome-avatar">
            <span class="avatar-icon">🎙️</span>
          </div>
          <h1 class="app-title">故事语音生成</h1>
          <p class="app-subtitle">用你的声音为孩子讲故事</p>
          <p class="app-instruction">添加角色，例如爸爸、妈妈...</p>
          <div class="auth-buttons">
            <button class="btn btn-primary auth-btn" @click="showLogin = true; errorMessage = ''">
              登录
            </button>
            <button class="btn btn-outline auth-btn" @click="showRegister = true; errorMessage = ''">
              注册
            </button>
          </div>
        </div>
      </div>
      
      <!-- 已登录且已创建角色 -->
      <div v-else-if="character" class="character-section">
        <div class="character-card">
          <div class="character-avatar">
            <span class="avatar-icon">🎤</span>
          </div>
          <h2 class="character-name">{{ character.name }}</h2>
          <p class="success-message">角色已创建成功</p>
          <p class="instruction-text">现在可以前往故事库，用{{ character.name }}的声音生成故事了！</p>
          <button class="btn btn-outline logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
      
      <!-- 已登录但未创建角色 -->
      <div v-else class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-avatar">
            <span class="avatar-icon">🎙️</span>
          </div>
          <h1 class="app-title">欢迎，{{ user.username }}！</h1>
          <p class="app-subtitle">用你的声音为孩子讲故事</p>
          <p class="app-instruction">添加角色，例如爸爸、妈妈...</p>
          <button class="btn btn-primary add-character-btn" @click="showNameDialog = true">
            + 添加角色
          </button>
          <button class="btn btn-outline logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
    </div>

    <!-- 登录弹窗 -->
    <div v-if="showLogin" class="dialog-overlay" @click="showLogin = false; errorMessage = ''">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">登录</h3>
        </div>
        <div class="dialog-body">
          <div v-if="errorMessage && showLogin" class="error-message">
            {{ errorMessage }}
          </div>
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="loginForm.username" type="text" class="form-input" placeholder="请输入用户名"
              @keyup.enter="handleLogin" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="loginForm.password" type="password" class="form-input" placeholder="请输入密码"
              @keyup.enter="handleLogin" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-outline" @click="showLogin = false; errorMessage = ''">取消</button>
            <button class="btn btn-primary" @click="handleLogin">登录</button>
          </div>
          <div class="auth-toggle">
            <button class="text-btn" @click="showLogin = false; showRegister = true; errorMessage = ''">
              没有账号？点击注册
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <div v-if="showRegister" class="dialog-overlay" @click="showRegister = false; errorMessage = ''">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">注册</h3>
        </div>
        <div class="dialog-body">
          <div v-if="errorMessage && showRegister" class="error-message">
            {{ errorMessage }}
          </div>
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="registerForm.username" type="text" class="form-input" placeholder="请输入用户名"
              @keyup.enter="handleRegister" />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="registerForm.email" type="email" class="form-input" placeholder="请输入邮箱"
              @keyup.enter="handleRegister" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="registerForm.password" type="password" class="form-input" placeholder="请输入密码"
              @keyup.enter="handleRegister" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-outline" @click="showRegister = false; errorMessage = ''">取消</button>
            <button class="btn btn-primary" @click="handleRegister">注册</button>
          </div>
          <div class="auth-toggle">
            <button class="text-btn" @click="showRegister = false; showLogin = true; errorMessage = ''">
              已有账号？点击登录
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色名称弹窗 -->
    <div v-if="showNameDialog" class="dialog-overlay" @click="showNameDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">创建角色</h3>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">角色名称（2-6个字）</label>
            <input v-model="characterName" type="text" class="form-input" placeholder="例如：爸爸、妈妈" maxlength="6"
              @keyup.enter="confirmName" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-outline" @click="cancelDialog">取消</button>
            <button class="btn btn-primary" @click="confirmName">确认</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 录音页面 -->
    <RecordingPage v-if="showRecording" :character-name="characterName" @complete="handleRecordingComplete" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '../store.js'
import RecordingPage from '../components/RecordingPage.vue'
import * as authApi from '../api/auth.js'
import * as characterApi from '../api/character.js'
import { setToken, setUser, clearAuth } from '../utils/auth.js'

export default {
  name: 'HomePage',
  components: {
    RecordingPage
  },
  setup() {
    const router = useRouter()
    const showNameDialog = ref(false)
    const showLogin = ref(false)
    const showRegister = ref(false)
    const characterName = ref('')
    const showRecording = ref(false)
    const loading = ref(false)
    const errorMessage = ref('')
    
    const user = computed(() => store.state.user)
    const character = computed(() => store.state.character)
    
    const loginForm = ref({
      username: '',
      password: ''
    })
    
    const registerForm = ref({
      username: '',
      email: '',
      password: ''
    })

    // 加载用户角色
    const loadUserCharacter = async () => {
      if (!user.value) return
      
      try {
        const characters = await characterApi.getCharacters()
        if (characters && characters.length > 0) {
          // 使用第一个角色
          store.actions.setCharacter(characters[0])
        }
      } catch (error) {
        console.error('加载角色失败:', error)
        // 如果是token失效，清除认证信息并显示登录界面
        if (error.code === 401 || error.message?.includes('Token无效') || error.message?.includes('Token已过期')) {
          clearAuth()
          store.actions.setUser(null)
          store.actions.setCharacter(null)
          showLogin.value = true
          errorMessage.value = '登录已过期，请重新登录'
        }
      }
    }

    // 组件挂载时加载角色
    onMounted(() => {
      if (user.value) {
        loadUserCharacter()
      }
    })

    const confirmName = () => {
      if (characterName.value.trim().length < 2 || characterName.value.trim().length > 6) {
        alert('角色名称需要2-6个字')
        return
      }
      showRecording.value = true
      showNameDialog.value = false
    }

    const cancelDialog = () => {
      showNameDialog.value = false
      characterName.value = ''
    }

    const handleRecordingComplete = async (name, audioFile) => {
      try {
        loading.value = true
        errorMessage.value = ''
        
        // 先上传录音文件（如果提供了文件）
        let fileId = null
        if (audioFile) {
          try {
            const { uploadFile } = await import('../api/file.js')
            const uploadResult = await uploadFile(audioFile)
            fileId = uploadResult.id || uploadResult.fileId
            if (!fileId) {
              console.warn('上传成功但未返回文件ID')
            }
          } catch (uploadError) {
            console.error('上传录音文件失败:', uploadError)
            const errorMsg = uploadError.message || '上传录音文件失败'
            // 询问用户是否继续创建角色（不包含录音）
            const shouldContinue = confirm(`${errorMsg}，是否继续创建角色（不包含录音）？`)
            if (!shouldContinue) {
              loading.value = false
              return
            }
            // 即使上传失败，也继续创建角色（但不包含录音）
          }
        }
        
        // 创建角色，传递fileId（如果已上传）
        const character = await characterApi.createCharacter(name, fileId)
        
        // 如果返回的是对象，直接使用；如果是数组，取第一个
        const characterData = Array.isArray(character) ? character[0] : character
        store.actions.setCharacter(characterData)
        
        showRecording.value = false
        characterName.value = ''
        
        // 角色创建成功后，跳转到故事库tab
        router.push('/stories')
      } catch (error) {
        console.error('创建角色失败:', error)
        errorMessage.value = error.message || '创建角色失败，请重试'
        alert(errorMessage.value)
      } finally {
        loading.value = false
      }
    }
    
    // 登录处理
    const handleLogin = async () => {
      if (!loginForm.value.username || !loginForm.value.password) {
        alert('请输入用户名和密码')
        return
      }
      
      try {
        loading.value = true
        errorMessage.value = ''
        
        const response = await authApi.login(loginForm.value.username, loginForm.value.password)
        
        // 保存 token 和用户信息
        if (response.token) {
          setToken(response.token)
        }
        if (response.user) {
          setUser(response.user)
          store.actions.setUser(response.user)
        }
        
        // 加载用户角色
        await loadUserCharacter()
        
        showLogin.value = false
        resetLoginForm()
      } catch (error) {
        console.error('登录失败:', error)
        errorMessage.value = error.message || '登录失败，请检查用户名和密码'
      } finally {
        loading.value = false
      }
    }
    
    // 注册处理
    const handleRegister = async () => {
      if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password) {
        alert('请填写所有字段')
        return
      }
      
      try {
        loading.value = true
        errorMessage.value = ''
        
        const userData = await authApi.register(
          registerForm.value.username,
          registerForm.value.email,
          registerForm.value.password
        )
        
        // 注册成功后自动登录
        const loginResponse = await authApi.login(
          registerForm.value.username,
          registerForm.value.password
        )
        
        // 保存 token 和用户信息
        if (loginResponse.token) {
          setToken(loginResponse.token)
        }
        if (loginResponse.user) {
          setUser(loginResponse.user)
          store.actions.setUser(loginResponse.user)
        }
        
        showRegister.value = false
        resetRegisterForm()
        alert('注册成功！')
      } catch (error) {
        console.error('注册失败:', error)
        errorMessage.value = error.message || '注册失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    // 退出登录
    const handleLogout = async () => {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        clearAuth()
        store.actions.setUser(null)
        store.actions.setCharacter(null)
      }
    }
    
    // 重置表单
    const resetLoginForm = () => {
      loginForm.value.username = ''
      loginForm.value.password = ''
      errorMessage.value = ''
    }
    
    const resetRegisterForm = () => {
      registerForm.value.username = ''
      registerForm.value.email = ''
      registerForm.value.password = ''
      errorMessage.value = ''
    }

    return {
      showNameDialog,
      showLogin,
      showRegister,
      characterName,
      showRecording,
      loading,
      errorMessage,
      user,
      character,
      loginForm,
      registerForm,
      confirmName,
      cancelDialog,
      handleRecordingComplete,
      handleLogin,
      handleRegister,
      handleLogout
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
  padding: 16px;
}

.content-container {
  max-width: 480px;
  margin: 0 auto;
  padding-top: 48px;
}

.auth-section,
.character-section,
.welcome-section {
  text-align: center;
}

.welcome-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
}

.character-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
}

.character-avatar,
.welcome-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(to bottom right, #3b82f6, #6366f1);
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 36px;
  color: white;
}

.character-name {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.success-message {
  color: #4b5563;
  margin-bottom: 24px;
}

.instruction-text,
.app-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 32px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.app-instruction {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 32px;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  border-radius: 12px;
}

.add-character-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 12px;
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

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: left;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.dialog-actions .btn {
  flex: 1;
  padding: 12px;
  font-size: 16px;
}

.auth-toggle {
  text-align: center;
}

.text-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.text-btn:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .home-page {
    padding: 24px;
  }
  
  .content-container {
    padding-top: 64px;
  }
  
  .character-card,
  .welcome-card {
    padding: 32px;
  }
  
  .character-avatar,
  .welcome-avatar {
    width: 96px;
    height: 96px;
  }
  
  .avatar-icon {
    font-size: 40px;
  }
  
  .character-name {
    font-size: 32px;
  }
  
  .app-title {
    font-size: 32px;
  }
  
  .auth-buttons {
    flex-direction: row;
  }
  
  .auth-btn {
    padding: 24px;
    font-size: 20px;
  }
  
  .add-character-btn {
    padding: 24px;
    font-size: 20px;
  }
  
  .dialog-content {
    max-width: 480px;
  }
}
</style>