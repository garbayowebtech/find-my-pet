import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  optimizeDeps: {
    include: ['react-tinder-card', '@react-spring/web'],
  },
  server: {
    port: 5174,
    strictPort: false,
    open: false,
  }
})
