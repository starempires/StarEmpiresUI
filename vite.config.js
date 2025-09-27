import { defineConfig } from 'vite';
import fs from "fs";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 3000, // Change if needed
    https: {
          key: fs.readFileSync("./localhost-key.pem"),
          cert: fs.readFileSync("./localhost.pem"),
    },
  },
  resolve: {
    alias: {
      '@': '/src', // Optional alias
    },
  },
});