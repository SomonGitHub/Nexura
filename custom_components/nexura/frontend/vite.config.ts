import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/nexura_static/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name]-v67.js`,
        chunkFileNames: `[name]-v67.js`,
        assetFileNames: `[name]-v67.[ext]`
      }
    }
  }
})
