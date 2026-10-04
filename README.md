# 个人工作台 · Personal Workspace

> 一个个人工作管理平台：任务 / 日程 / 笔记 / 书签 / 脚本 / 项目，一个工作台看全。
> **现在是全离线版** —— 数据存在本机，装完就用，不联网。

![Vue 3](https://img.shields.io/badge/Vue%203-42B883?logo=vuedotjs&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-409EFF)
![Dexie](https://img.shields.io/badge/Dexie-IndexedDB-3E6CFF)
![Android](https://img.shields.io/badge/Android-APK-3DDC84?logo=android&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 目录

- [📴 本地离线版 / Android APK](#-本地离线版--android-apk)　**← 从这里开始**
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始（遗留的服务端栈）](#-快速开始遗留的服务端栈)
- [配置说明](#-配置说明)
- [开发指南](#-开发指南)
- [测试](#-测试)
- [项目结构](#-项目结构)
- [API 约定](#-api-约定)
- [安全说明](#-安全说明)
- [许可证](#-许可证)

---

## 📴 本地离线版 / Android APK

**装完就用，完全不联网。** 没有服务端、没有账号、没有同步 —— 六类数据全住在浏览器 / WebView 的
[IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) 里（[Dexie](https://dexie.org/) 封装），
**只在这台设备上**。

### 数据住哪 · 怎么备份

| | |
| --- | --- |
| 位置 | 浏览器 / WebView 的 IndexedDB，库名 `personal-workspace` |
| 生命周期 | 跟着浏览器 / App 走。清站点数据、卸载 App = **数据没了** |
| 备份 | **JSON 导出 / 导入是唯一备份手段**，别只靠它活 |
| 位置 | 设置 → 数据 → 导出数据（原生端写到 Documents，浏览器端下载 `.json`） |
| 还原 | 设置 → 数据 → 导入数据。**整体覆盖**本机数据，不做合并（合并要重映射 ID，也表达不了删除） |
| 多设备 | 各自独立。想在手机上接着用，导出 → 传文件 → 导入 |

> 🔴 既然没有服务端，**导出就是唯一后悔药**。重要数据请定期导出到云盘 / 电脑。

### 直接在浏览器里跑

```bash
cd frontend
npm install
npm run dev        # 开发，http://localhost:5173
npm run build && npm run preview   # 产物预览
```

### 打 Android APK

```bash
cd frontend
npm install

# 一条命令：build 前端 → cap sync → gradlew assembleDebug
npm run apk:build
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

只要改动了 `src/`，先 `npm run cap:sync`（build + 把 `dist/` 拷进 Android 工程），再重打。

**命令行工具链**（没有 Android Studio 时）：

```bash
# JDK 21
apt-get install -y openjdk-21-jdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# Android SDK —— 只要 platform-tools / platforms;android-35 / build-tools;35.0.0
mkdir -p /opt/android-sdk/cmdline-tools
curl -fsSL -o /tmp/cmdtools.zip \
  https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q /tmp/cmdtools.zip -d /opt/android-sdk/cmdline-tools
mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest
export ANDROID_HOME=/opt/android-sdk
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

# gradle 认的是 local.properties，不是环境变量
printf 'sdk.dir=/opt/android-sdk\n' > android/local.properties
```

**退路**：把整个 `frontend/android/` 交给装了 Android Studio 的机器，打开它，点 ▶ / `./gradlew assembleDebug` 也能出包。
前端产物已经由 `npx cap sync` 拷进 `android/app/src/main/assets/public/`，那边不需要 Node。

### 离线约束（知道就行）

- **书签打开**是真跳出去看网页，那一下需要网。书签的图标是域名首字母，不发请求。
- 笔记里的远程图片 `![](http…)` 离线时就是加载失败，其余 markdown 照常渲染。
- 原生端打开链接走 Chrome Custom Tab，返回后 App 状态还在。
- **APK 装完就是离线的**：页面、样式、脚本都打在包里，Capacitor 从 `assets/public`
  本地伺服。浏览器版第一次要能连上服务器把页面拉下来，之后断网照常用
  （路由 chunk 走 HTTP 缓存；清了浏览器缓存就得再联网一次）。

### 规划中

- **App-PIN**：启动时要 4 位数字锁。目前装完直接进工作台。

---

## ✨ 功能特性

---

## ✨ 功能特性

| 模块 | 能力 |
| --- | --- |
| 🏠 **工作台** | 数据总览、待办任务、近期日程、项目进度、完成趋势图、最近笔记、站内通知 |
| 📋 **任务** | 看板 / 列表双视图、拖拽换列、自定义状态（可拖拽排序）、优先级、标签、循环任务（按周期自动重置） |
| 📅 **日程** | 月视图 / 周视图、事件管理、颜色标记、全天事件 |
| 📝 **笔记** | Markdown 笔记、清单笔记、浏览 / 编辑双模式、全文检索 |
| 🔖 **书签** | 网站收藏、分类、站点图标 |
| 📜 **脚本** | 代码片段管理、多语言高亮 |
| 📁 **项目** | 子任务管理、看板 / 泳道 / 列表三视图、自定义子任务状态、进度按完成率自动统计 |
| 🛠️ **工具箱** | JSON 格式化、Base64、URL 编解码、时间戳、正则测试、颜色转换 |

---

## 🛠️ 技术栈

| 层 | 选型 |
| --- | --- |
| **前端** | Vue 3 · TypeScript · Vite · Element Plus · Pinia · Vue Router · Day.js · markdown-it |
| **数据（现役）** | Dexie 4 → 浏览器 IndexedDB。JSON 导出 / 导入做备份 |
| **打包** | Capacitor 7 → Android APK |
| **后端 / 数据（遗留）** | FastAPI · SQLAlchemy 2.0 · Pydantic v2 · MySQL 8.0 · Redis 7 —— **运行时不再启动**，留作移植规格书 |

> 下面「快速开始」那套 Docker / FastAPI / MySQL 是**遗留的服务端栈**。要跑的产品见上面的
> [本地离线版](#-本地离线版--android-apk)。镜像前缀是华为云 SWR 加速，可直连 Docker Hub 的网络里去掉即可。

---

## 🚀 快速开始（遗留的服务端栈）

> ⚠️ 这一节描述的是**改造前**的 FastAPI + MySQL 部署，已不再使用。产品现在是
> [本地离线版](#-本地离线版--android-apk)。下面保留只作参考。

### 环境要求

- Docker 20+ 与 Docker Compose v2
- 本地开发另需：Node.js 18+、Python 3.10+

### 一条命令跑起来（推荐）

```bash
git clone https://github.com/Sean-keep/workspace.git
cd workspace

# 1. 准备环境变量（密钥必填，缺一项 Compose 会拒绝启动）
cp .env.example .env

# 生成 SECRET_KEY 并写入 .env
openssl rand -base64 48
# 把输出填进 .env 的 SECRET_KEY，并改掉 MYSQL_* / REDIS_PASSWORD / ADMIN_PASSWORD

# 2. 启动全部服务（MySQL → Redis → 后端 → 前端，带健康检查）
make up          # 等价于 docker compose up -d --build

# 3. 确认状态
make status      # 等价于 docker compose ps
```

启动完成后：

| 服务 | 地址 |
| --- | --- |
| 前端 | http://localhost:3001 |
| 后端 API | http://localhost:8000 |
| API 文档（Swagger） | http://localhost:8000/api/docs |

### 首次登录

后端在 `users` 表为空时，会按 `.env` 中的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` 自动创建初始管理员。

**首次登录后请立刻修改该账号密码。** `scripts/init.sql` 只含表结构，不写入任何默认账号。

### 开发模式

```bash
# 后端热重载 + 映射 MySQL 3308 / Redis 6380 便于本地调试
make dev
# 等价于 docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

> ⚠️ `docker-compose.dev.yml` 会 bind-mount 源码并开启 `--reload`，**不要用于生产**。

### 停止 / 清理

```bash
make down        # 停止容器（保留数据卷）
make clean       # 停止并删除数据卷（慎用，会清空数据库）
```

---

## ⚙️ 配置说明

所有配置通过环境变量注入（Docker 场景写在根目录 `.env`）。完整模板见 [`.env.example`](.env.example)。

### 必填密钥

| 变量 | 说明 |
| --- | --- |
| `SECRET_KEY` | JWT 签名密钥。用 `openssl rand -base64 48` 生成。**不设置时应用会生成临时密钥，重启后所有登录态失效** |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码（仅初始化 / 运维用） |
| `MYSQL_PASSWORD` | 应用连接 MySQL 的密码（与 `DB_PASSWORD` 保持一致） |
| `REDIS_PASSWORD` | Redis 密码（登录限流用） |
| `ADMIN_PASSWORD` | 初始管理员密码（仅 `users` 表为空时生效） |

### 可选变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_NAME` | `workspace-mysql` / `3306` / `workspace` / `personal_workspace` | MySQL 连接 |
| `DB_PASSWORD` | — | 同 `MYSQL_PASSWORD` |
| `REDIS_HOST` / `REDIS_PORT` | `workspace-redis` / `6379` | Redis 连接 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | Access Token 有效期（分钟） |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `14` | Refresh Token 有效期（天） |
| `LOGIN_RATE_LIMIT_MAX` | `5` | 登录失败次数上限 |
| `LOGIN_RATE_LIMIT_WINDOW` | `300` | 限流窗口（秒） |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` | `admin` / `admin@example.com` | 初始管理员账号 |
| `CORS_ORIGINS` | `http://localhost:3001` | 允许的跨域来源，**逗号分隔** |
| `DEBUG` | `false` | 开启后输出 SQL 日志 |

---

## 🧑‍💻 开发指南

### 本地跑前后端（不走 Docker）

```bash
# ---- 后端 ----
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

export DB_HOST=localhost DB_PORT=3306 DB_USER=workspace \
       DB_PASSWORD=你的数据库密码 DB_NAME=personal_workspace \
       REDIS_HOST=localhost REDIS_PORT=6379 REDIS_PASSWORD=你的Redis密码 \
       SECRET_KEY=$(openssl rand -base64 48)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# ---- 前端（另开终端）----
cd frontend
npm ci
npm run dev        # http://localhost:3000，/api 代理到 :8000
```

### 前端质量门禁

```bash
npm run typecheck  # vue-tsc --noEmit
npm run lint       # eslint --fix
npm run format     # prettier
npm run build      # typecheck + 生产构建（Docker 镜像构建同样跑这个）
```

### 数据库迁移

```bash
make migrate       # alembic upgrade head
```

全新库也可以直接导入 DDL：

```bash
mysql -u workspace -p personal_workspace < scripts/init.sql
```

### Makefile 速查

| 命令 | 作用 |
| --- | --- |
| `make up` | 构建并后台启动全部服务 |
| `make down` | 停止服务（保留数据） |
| `make dev` | 开发模式（热重载 + DB/Redis 端口映射） |
| `make logs` | 跟踪全部日志 |
| `make status` | 查看容器状态 |
| `make test` | 跑后端测试 |
| `make migrate` | 执行数据库迁移 |
| `make clean` | 停止并**删除数据卷** |

---

## 🧪 测试

后端测试使用内存 SQLite，**不需要** MySQL / Redis：

```bash
make test
# 或
python3 -m pytest backend/tests -q
```

覆盖范围：认证与限流、JWT 工具、周期性任务重置、各资源 CRUD 与归属隔离、仪表盘聚合。

---

## 📁 项目结构

```
personal-workspace/
├── frontend/                    # Vue 3 + TS 前端
│   ├── src/
│   │   ├── views/              # 页面（薄 index.vue + components/ + composables/）
│   │   │   ├── Dashboard/      # 工作台
│   │   │   ├── Tasks/          # 任务（看板 / 列表）
│   │   │   ├── Calendar/       # 日程
│   │   │   ├── Notes/          # 笔记
│   │   │   ├── Bookmarks/      # 书签
│   │   │   ├── Scripts/        # 脚本
│   │   │   ├── Projects/       # 项目
│   │   │   ├── Tools/          # 工具箱
│   │   │   ├── Settings/       # 设置
│   │   │   └── Login/          # 登录
│   │   ├── components/         # 跨页面通用组件（PageHeader / TagList）
│   │   ├── composables/        # 通用逻辑（useResourceList / useDialogForm / useConfirmDelete）
│   │   ├── layouts/            # 布局
│   │   ├── router/             # 路由
│   │   ├── stores/             # Pinia（user / settings）
│   │   ├── types/              # 领域类型
│   │   └── utils/              # axios 封装、API 类型
│   ├── nginx.conf              # SPA 路由 + /api 反代
│   └── Dockerfile              # 多阶段：node 构建 → nginx 托管
│
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── api/                # 路由（auth / tasks / events / notes / bookmarks / snippets / projects / dashboard）
│   │   ├── models/             # SQLAlchemy 2.0 模型
│   │   ├── schemas/            # Pydantic v2 校验
│   │   └── utils/              # 响应封装 / 安全 / 限流 / 周期任务 / CRUD 工厂
│   ├── alembic/                # 数据库迁移（含 0001 基线）
│   ├── tests/                  # pytest 套件
│   └── Dockerfile              # 非 root 用户运行 uvicorn
│
├── scripts/init.sql             # 建表 DDL（仅结构，无账号）
├── docker-compose.yml           # 生产编排（密钥必填、带健康检查）
├── docker-compose.dev.yml       # 开发覆盖（热重载 / 端口映射）
├── .env.example                 # 环境变量模板
├── Makefile                     # 常用命令
└── README.md
```

---

## 📡 API 约定

所有接口返回统一包装结构：

```json
{ "code": 200, "msg": "success", "data": { } }
```

- `code` 与 HTTP 状态码一致；出错时 `data` 一般为 `null`，`msg` 是原因
- 列表接口统一分页：

```json
{
  "code": 200,
  "msg": "success",
  "data": { "items": [], "total": 0, "skip": 0, "limit": 50 }
}
```

- 认证：`Authorization: Bearer <access_token>`；access 过期后前端静默用 refresh 换新
- 交互式文档：启动后访问 `/api/docs`

---

## 🔒 安全说明

- **密钥强制显式配置**：`SECRET_KEY` / MySQL / Redis / 管理员密码缺失时 Compose 直接拒绝启动；后端在 `SECRET_KEY` 缺失时会用临时密钥并在日志告警
- **JWT 双令牌**：access（默认 2h）+ refresh（默认 14 天），两者带 `type` claim，不可互换
- **登录限流**：按用户名统计失败次数（Redis，故障时自动降级到进程内计数）
- **CORS 白名单**：不使用 `*`，按 `CORS_ORIGINS` 精确匹配
- **容器最小权限**：前后端镜像均以非 root 用户运行；MySQL / Redis 默认不映射宿主端口
- **SQL 注入**：全链路 SQLAlchemy ORM 参数化查询
- **XSS**：笔记 Markdown 渲染使用 `markdown-it` 默认安全配置（禁用内嵌 HTML，拦截 `javascript:` 链接）

---

## 📄 许可证

[MIT License](LICENSE)
