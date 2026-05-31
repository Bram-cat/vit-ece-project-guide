import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { chatApi } from './vite-chat-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env.local into process.env so the server-side chat proxy can read the
  // API key without exposing it to the client (only VITE_* reach the browser).
  const env = loadEnv(mode, process.cwd(), '')
  process.env.OPENCODE_AI_API_KEY = env.OPENCODE_AI_API_KEY

  return {
    plugins: [react(), chatApi()],
  }
})
