import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor 打包配置 —— 纯离线 App。
 *
 * webDir 指向 vite 的输出目录 `dist/`，`npx cap sync` 会把它拷进 android/app/src/main/assets/public。
 * 数据全在 WebView 的 IndexedDB，没有服务端，所以也没有任何 URL 要配。
 */
const config: CapacitorConfig = {
  appId: 'com.personalworkspace.app',
  appName: '个人工作台',
  webDir: 'dist',
  // https 走本地 WebView 的 secure context —— clipboard / crypto.subtle 依赖它
  server: {
    androidScheme: 'https'
  },
  // 纯离线，没理由允许混合内容
  android: {
    allowMixedContent: false
  }
}

export default config
