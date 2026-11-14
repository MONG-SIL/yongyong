import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const apiProxy = {
  "/api": {
    target: "http://168.110.36.72:8080",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
