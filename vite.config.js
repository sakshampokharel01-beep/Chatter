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
    // Use esbuild for faster builds (default)
    minify: 'esbuild',
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // Target modern browsers for smaller bundle
    target: 'es2015',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
    exclude: ['@firebase/app-check'] // Exclude unused Firebase modules
  },
  // Esbuild options for better optimization
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.logs in production
    legalComments: 'none', // Remove comments
  }
})
