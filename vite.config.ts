import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/Lentor-Renya-App/
const base = '/Lentor-Renya-App/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lentor Home',
        short_name: 'Lentor',
        description: 'Our household app: the day at a glance and answers to everyday questions.',
        theme_color: '#2f6f5e',
        background_color: '#f7f5f0',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // Household data comes from the GitHub API and is cached by the app itself.
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
