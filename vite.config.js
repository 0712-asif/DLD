import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'vendor-react-three'
          }

          if (id.includes('/three/')) {
            return 'vendor-three'
          }

          if (id.includes('framer-motion')) {
            return 'vendor-motion'
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
