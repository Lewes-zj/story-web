<template>
  <div class="bottom-navigation">
    <div class="nav-container">
      <button 
        v-for="tab in tabs" 
        :key="tab.path"
        class="nav-item"
        :class="{ active: isActive(tab.path) }"
        @click="navigateTo(tab.path)"
      >
        <component :is="tab.icon" class="nav-icon" />
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router'

// 简单的图标组件
const HomeIcon = {
  template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
}

const BookIcon = {
  template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
}

const HeadphonesIcon = {
  template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>'
}

export default {
  name: 'BottomNavigation',
  components: {
    HomeIcon,
    BookIcon,
    HeadphonesIcon
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const tabs = [
      { path: '/', label: '首页', icon: 'HomeIcon' },
      { path: '/stories', label: '故事库', icon: 'BookIcon' },
      { path: '/listen', label: '畅听', icon: 'HeadphonesIcon' }
    ]
    
    const isActive = (path) => {
      return route.path === path
    }
    
    const navigateTo = (path) => {
      router.push(path)
    }
    
    return {
      tabs,
      isActive,
      navigateTo
    }
  }
}
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
}

.nav-container {
  display: flex;
  justify-content: space-around;
  max-width: 480px;
  margin: 0 auto;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  transition: all 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #4b5563;
}

.nav-item:hover {
  color: #1f2937;
}

.nav-item.active {
  color: #3b82f6;
  background: #eff6ff;
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .nav-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .nav-label {
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .nav-container {
    max-width: 640px;
  }
}
</style>