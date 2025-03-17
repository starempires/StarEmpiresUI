import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 3000, // Change if needed
  },
  resolve: {
    alias: {
      '@': '/src', // Optional alias
    },
  },
});
