import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Dark theme tokens for `documentElement.classList.add('dark')` (settings store).
import 'element-plus/theme-chalk/dark/css-vars.css'
// Programmatic components (ElMessage) are not covered by unplugin-vue-components.
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import {
  Calendar,
  Clock,
  Document,
  Expand,
  Finished,
  Fold,
  Folder,
  HomeFilled,
  InfoFilled,
  Link,
  List,
  Lock,
  Message,
  Monitor,
  MoreFilled,
  Notebook,
  Plus,
  Refresh,
  Search,
  Setting,
  SuccessFilled,
  Tools,
  User,
  WarningFilled
} from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'

const app = createApp(App)
const pinia = createPinia()

// Only icons used as bare template tags (`<Monitor />`) or as string icon props
// (`prefix-icon="Search"`, `<component :is="'Expand'" />`) — anything explicitly
// imported in its SFC is left local so the bundle stays small.
const globalIcons = {
  Calendar,
  Clock,
  Document,
  Expand,
  Finished,
  Fold,
  Folder,
  HomeFilled,
  InfoFilled,
  Link,
  List,
  Lock,
  Message,
  Monitor,
  MoreFilled,
  Notebook,
  Plus,
  Refresh,
  Search,
  Setting,
  SuccessFilled,
  Tools,
  User,
  WarningFilled
}

for (const [key, component] of Object.entries(globalIcons)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)

app.mount('#app')
