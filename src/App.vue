<template>
  <div class="app-container">
    <router-view />
    <BottomNavigation />
  </div>
</template>

<script>
import BottomNavigation from './components/BottomNavigation.vue'
import router from './router'

export default {
  name: 'App',
  components: {
    BottomNavigation
  },
  router
}
</script>

<style>
/* 全局样式 */
.app-container {
  min-height: 100vh;
  padding-bottom: 60px; /* 为底部导航留出空间 */
}

/* 响应式设计基础 */
@media (max-width: 768px) {
  .app-container {
    padding-bottom: 50px;
  }
}

/* 重置样式 */
button, input {
  font-family: inherit;
  font-size: inherit;
}

/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(to right, #3b82f6, #6366f1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(to right, #2563eb, #4f46e5);
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .dialog-content {
    max-width: 480px;
  }
}
</style>