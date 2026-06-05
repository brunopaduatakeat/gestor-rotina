import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const VENDOR_CHUNKS: Record<string, string[]> = {
  'vendor-react':   ['react', 'react-dom'],
  'vendor-dnd':     ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  'vendor-zustand': ['zustand'],
  'vendor-dexie':   ['dexie'],
  'vendor-chrono':  ['chrono-node'],
  'vendor-sentry':  ['@sentry/react'],
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Isola libs pesadas em chunks separados para melhor cache
        manualChunks(id: string) {
          for (const [chunk, modules] of Object.entries(VENDOR_CHUNKS)) {
            if (modules.some((m) => id.includes(`/node_modules/${m}/`))) {
              return chunk
            }
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
