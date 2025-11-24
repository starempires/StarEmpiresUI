import { defineConfig } from 'vite';
import fs from "fs";
import react from '@vitejs/plugin-react';

const useHttps = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 3000, // Change if needed
    https: useHttps ? {
          key: fs.readFileSync("./localhost-key.pem"),
          cert: fs.readFileSync("./localhost.pem"),
    } : false,
  },
  resolve: {
    alias: {
      '@': '/src', // Optional alias
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
  },
});