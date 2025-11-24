import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import StoryLibraryPage from './pages/StoryLibraryPage.vue'
import ListenPage from './pages/ListenPage.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/stories', component: StoryLibraryPage },
  { path: '/listen', component: ListenPage },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router