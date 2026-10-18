import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { adminDirectoryPlugin } from './admin/redirect.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminDirectoryPlugin()],
  build: {
    rolldownOptions: {
      input: { public: 'index.html', admin: 'admin/index.html' },
    },
  },
})
