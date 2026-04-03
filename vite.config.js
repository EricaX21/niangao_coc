import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'
import fs from 'fs'

// 将 src/custom-tab-bar 复制到编译输出目录，确保微信小程序能识别
function copyCustomTabBar() {
  return {
    name: 'copy-custom-tab-bar',
    closeBundle() {
      const src = path.resolve(__dirname, 'src/custom-tab-bar')
      if (!fs.existsSync(src)) return

      const targets = [
        path.resolve(__dirname, 'dist/dev/mp-weixin/custom-tab-bar'),
        path.resolve(__dirname, 'dist/build/mp-weixin/custom-tab-bar'),
      ]

      targets.forEach(dest => {
        const parent = path.dirname(dest)
        if (fs.existsSync(parent)) {
          fs.cpSync(src, dest, { recursive: true })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [uni(), copyCustomTabBar()],
})
