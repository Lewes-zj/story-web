import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 6008,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/emo_vector': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/story_book': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/file': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
