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
    chunkSizeWarningLimit: 500,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
      format: {
        comments: false, // Remove all comments
      }
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
    exclude: ['@firebase/app-check'] // Exclude unused Firebase modules
  },
  // Server configuration for development
  server: {
    hmr: {
      overlay: false // Disable error overlay for better performance
    }
  }
})
