import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME } from './src/appName';

// Served from https://<user>.github.io/Lentor-Renya-App/
const base = '/Lentor-Renya-App/';

export default defineConfig({
  base,
  plugins: [
    react(),
    { name: 'app-name', transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP_NAME) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.jpg'],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'Our household app: the day at a glance and answers to everyday questions.',
        theme_color: '#0b7590',
        background_color: '#fff7ec',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Household data comes from the GitHub API and is cached by the app itself.
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg}'],
      },
    }),
  ],
});
