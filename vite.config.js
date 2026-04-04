import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        }
      }
    },
    // Minification
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2015',
  },
  // Remove console.logs in production
  esbuild: {
    drop: ['console', 'debugger'],
  }
})
