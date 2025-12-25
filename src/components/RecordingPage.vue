<template>
  <div class="recording-page">
    <div class="content-container">
      <div class="recording-card">
        <!-- 标题 -->
        <h2 class="page-title">{{ characterName }}的声音</h2>
        <p class="page-subtitle">请用给宝宝读故事的语气阅读这段话</p>

        <!-- 阅读文案 -->
        <div class="reading-text">
          <p>{{ RECORDING_TEXT }}</p>
        </div>

        <!-- 录音控制 -->
        <div class="recording-controls">
          <div v-if="!hasRecording">
            <div v-if="!isRecording" class="start-section">
              <button 
                class="btn btn-primary record-btn"
                @click="startRecording"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
                <span>点击开始录音</span>
              </button>
            </div>
            
            <div v-else class="recording-section">
              <div class="recording-status">
                <div class="recording-time">{{ formatTime(recordingTime) }}</div>
                <p class="recording-label">录音中...</p>
              </div>
              <button 
                class="btn btn-primary stop-btn"
                @click="stopRecording"
                :disabled="isUploading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                </svg>
                <span>停止录音</span>
              </button>
            </div>
          </div>
          
          <div v-else class="playback-section">
            <!-- 播放按钮 -->
            <button 
              class="btn btn-primary play-btn"
              :disabled="isPlaying"
              @click="playRecording"
            >
              <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <span>{{ isPlaying ? '播放中...' : '播放录音' }}</span>
            </button>

            <!-- 校验结果 -->
            <div class="result-section">
              <p class="result-label">识别结果：</p>
              <p class="recognized-text">{{ recognizedText }}</p>
            </div>

            <!-- 校验提示 -->
            <div 
              class="validation-message"
              :class="{ 'success': validationPassed, 'error': !validationPassed }"
            >
              {{ validationPassed ? '✓ 校验通过' : '✗ 不一致，请重新录音' }}
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button 
                class="btn btn-outline retry-btn"
                @click="retry"
                :disabled="isUploading"
              >
                重新录音
              </button>
              <button 
                class="btn btn-primary next-btn"
                :disabled="!validationPassed || isUploading"
                @click="next"
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传加载遮罩层 -->
    <div v-if="isUploading" class="upload-overlay">
      <div class="upload-loading">
        <div class="spinner"></div>
        <p class="upload-text">正在上传...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue'
import { verifyAudio } from '../api/asr.js'

export default {
  name: 'RecordingPage',
  props: {
    characterName: {
      type: String,
      required: true
    }
  },
  emits: ['complete'],
  setup(props, { emit }) {
    const RECORDING_TEXT = '床前明月光，疑是地上霜。举头望明月，低头思故乡。这首古诗陪伴我们成长，承载着无数人的美好回忆。'
    
    const isRecording = ref(false)
    const recordingTime = ref(0)
    const hasRecording = ref(false)
    const isPlaying = ref(false)
    const validationPassed = ref(false)
    const recognizedText = ref('')
    const audioBlob = ref(null)
    const audioUrl = ref(null)
    const mediaRecorder = ref(null)
    const audioChunks = ref([])
    const isUploading = ref(false)
    let recordingInterval = null
    
    const startRecording = async () => {
      try {
        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        audioChunks.value = []
        mediaRecorder.value = new MediaRecorder(stream)
        
        mediaRecorder.value.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.value.push(event.data)
          }
        }
        
        mediaRecorder.value.onstop = () => {
          const blob = new Blob(audioChunks.value, { type: 'audio/webm' })
          audioBlob.value = blob
          audioUrl.value = URL.createObjectURL(blob)
          
          // 停止所有音频轨道
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorder.value.start()
        isRecording.value = true
        recordingTime.value = 0
        hasRecording.value = false
        validationPassed.value = false
        recognizedText.value = ''
        
        recordingInterval = setInterval(() => {
          recordingTime.value++
        }, 1000)
      } catch (error) {
        console.error('无法访问麦克风:', error)
        alert('无法访问麦克风，请检查权限设置')
      }
    }
    
    const stopRecording = async () => {
      // 防止重复提交
      if (isUploading.value) {
        console.log('正在处理中，请勿重复提交')
        return
      }
      
      if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop()
      }
      
      isRecording.value = false
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
      
      // 等待录音数据收集完成
      // MediaRecorder的onstop事件会异步触发，我们需要等待audioBlob准备好
      await new Promise((resolve) => {
        if (audioBlob.value) {
          resolve()
        } else {
          // 如果audioBlob还没有准备好，等待一小段时间
          const checkInterval = setInterval(() => {
            if (audioBlob.value) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
          
          // 最多等待3秒
          setTimeout(() => {
            clearInterval(checkInterval)
            resolve()
          }, 3000)
        }
      })
      
      // 如果没有录音数据，直接返回
      if (!audioBlob.value) {
        alert('录音数据为空，请重新录音')
        return
      }
      
      // 显示上传和识别Loading
      isUploading.value = true
      
      try {
        // 创建文件对象
        const file = new File([audioBlob.value], 'recording.webm', { type: 'audio/webm' })
        
        // 调用ASR校验API
        const result = await verifyAudio(file, RECORDING_TEXT)
        
        // 更新识别结果
        if (result.success && result.data) {
          recognizedText.value = result.data.text || ''
          validationPassed.value = result.data.passed || false
          
          // 如果相似度信息可用，可以在控制台输出（可选）
          if (result.data.similarity !== undefined) {
            console.log(`识别相似度: ${(result.data.similarity * 100).toFixed(2)}%`)
          }
        } else {
          // API返回失败
          recognizedText.value = '识别失败，请重试'
          validationPassed.value = false
        }
        
        hasRecording.value = true
      } catch (error) {
        console.error('ASR校验失败:', error)
        // 显示错误信息
        recognizedText.value = `识别失败: ${error.message || '网络错误，请检查网络连接后重试'}`
        validationPassed.value = false
        hasRecording.value = true
        alert(`识别失败: ${error.message || '网络错误，请检查网络连接后重试'}`)
      } finally {
        // 隐藏Loading
        isUploading.value = false
      }
    }
    
    const playRecording = () => {
      if (!audioUrl.value) return
      
      const audio = new Audio(audioUrl.value)
      isPlaying.value = true
      
      audio.onended = () => {
        isPlaying.value = false
      }
      
      audio.onerror = () => {
        isPlaying.value = false
        alert('播放失败')
      }
      
      audio.play().catch(error => {
        console.error('播放失败:', error)
        isPlaying.value = false
      })
    }
    
    const retry = () => {
      hasRecording.value = false
      validationPassed.value = false
      recognizedText.value = ''
      recordingTime.value = 0
      
      // 清理音频资源
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
        audioUrl.value = null
      }
      audioBlob.value = null
    }
    
    const next = async () => {
      // 防止重复提交
      if (isUploading.value) {
        console.log('正在处理中，请勿重复提交')
        return
      }
      
      if (!validationPassed.value || !audioBlob.value) {
        return
      }
      
      try {
        // 显示上传loading
        isUploading.value = true
        
        // 创建文件对象，但不在这里上传
        // 上传将在父组件中统一处理，避免重复上传
        const file = new File([audioBlob.value], 'recording.webm', { type: 'audio/webm' })
        
        // 直接通知父组件，由父组件负责上传
        // 传递一个回调函数，让父组件在上传完成后调用
        emit('complete', props.characterName, file, () => {
          isUploading.value = false
        })
      } catch (error) {
        console.error('处理录音失败:', error)
        isUploading.value = false
        alert('处理录音失败，请重试')
      }
    }
    
    // 暴露关闭loading的方法，供父组件调用
    const closeUploading = () => {
      isUploading.value = false
    }
    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
      
      // 停止录音
      if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop()
      }
      
      // 清理音频URL
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
      }
    })
    
    return {
      RECORDING_TEXT,
      isRecording,
      recordingTime,
      hasRecording,
      isPlaying,
      validationPassed,
      recognizedText,
      isUploading,
      startRecording,
      stopRecording,
      playRecording,
      retry,
      next,
      formatTime,
      closeUploading
    }
  }
}
</script>

<style scoped>
.recording-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
  padding: 16px;
}

.content-container {
  max-width: 480px;
  margin: 0 auto;
  padding-top: 32px;
}

.recording-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 8px;
}

.page-subtitle {
  text-align: center;
  color: #4b5563;
  margin-bottom: 24px;
  font-size: 14px;
}

.reading-text {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.reading-text p {
  color: #374151;
  line-height: 1.6;
  text-align: center;
  font-size: 14px;
}

.record-btn,
.stop-btn,
.play-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.recording-status {
  background: #fee2e2;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.recording-time {
  font-size: 24px;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 4px;
}

.recording-label {
  color: #dc2626;
  font-size: 14px;
}

.result-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.recognized-text {
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.validation-message {
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}

.validation-message.success {
  background: #dcfce7;
  color: #166534;
}

.validation-message.error {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.action-buttons .btn {
  padding: 16px;
  font-size: 16px;
  border-radius: 12px;
}

/* 上传加载遮罩层 */
.upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.upload-loading {
  background: white;
  border-radius: 12px;
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.spinner {
  width: 40px;
  height: 40px;
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

.upload-text {
  color: #374151;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .recording-page {
    padding: 24px;
  }
  
  .content-container {
    padding-top: 40px;
  }
  
  .recording-card {
    padding: 24px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 16px;
    margin-bottom: 32px;
  }
  
  .reading-text {
    padding: 24px;
    margin-bottom: 32px;
  }
  
  .reading-text p {
    font-size: 16px;
  }
  
  .record-btn,
  .stop-btn,
  .play-btn {
    padding: 24px;
    font-size: 18px;
  }
  
  .recording-time {
    font-size: 32px;
  }
  
  .result-section {
    padding: 24px;
  }
  
  .recognized-text {
    font-size: 16px;
  }
  
  .validation-message {
    padding: 24px;
    font-size: 16px;
  }
  
  .action-buttons {
    flex-direction: row;
  }
  
  .action-buttons .btn {
    padding: 24px;
    font-size: 18px;
  }
  
  .upload-loading {
    padding: 40px 60px;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border-width: 5px;
  }
  
  .upload-text {
    font-size: 18px;
  }
}
</style>