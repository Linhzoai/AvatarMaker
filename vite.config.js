import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚙️ Cấu hình cho GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/AvatarMaker/', // 👈 thay AvatarMaker bằng đúng tên repo của bạn
})
