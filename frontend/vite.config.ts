import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../', // Vite буде шукати .env у корені проєкту
  server: {
    host: true,
    allowedHosts: true,
    strictPort: true,
    port: 5173
  }
})
