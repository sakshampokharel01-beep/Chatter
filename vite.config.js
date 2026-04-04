import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into separate chunk
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Split React into separate chunk
          'react-vendor': ['react', 'react-dom'],
          // Split PeerJS and Socket.IO into separate chunk
          'webrtc': ['peerjs', 'socket.io-client'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})
