import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api to the local backend in dev so the browser never hits a
      // CORS preflight - useful when running `npm run dev` alongside the
      // Spring Boot backend on localhost:4000.
      proxy: {
        '/api': {
          target: (env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, ''),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
