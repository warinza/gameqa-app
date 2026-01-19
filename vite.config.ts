import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://gameqa-api.onrender.com/',
                //   target: 'http://localhost:3001',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'https://gameqa-api.onrender.com/',
                //   target: 'http://localhost:3001',
                ws: true
            }
        }
    }
})
