import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Separa dependências pesadas em chunks próprios (melhor cache).
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MangaList',
        short_name: 'MangaList',
        description: 'Seu catálogo pessoal de mangás e webtoons',
        theme_color: '#6366f1',
        background_color: '#0f0f13',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        // Share Target — recebe URLs compartilhadas do Chrome mobile
        share_target: {
          action: '/',
          method: 'GET',
          params: { url: 'url', title: 'title' },
        },
      },
    }),
  ],
})
