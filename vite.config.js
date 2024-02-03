import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://sandbox.dev.bookcreator.com/ai/",
  plugins: [
    react(),
  ],
  server: {
    port:  process.env.PORT ?? 8080,
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
})
