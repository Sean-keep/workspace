# 个人工作台 (Personal Workspace)

一个高效的个人工作管理平台，集成任务管理、日程管理、笔记管理、书签管理、脚本管理和项目管理等功能。

## ✨ 功能特性

### 📋 任务管理
- 自定义任务状态（支持拖拽排序）
- 看板视图 - 按状态分列展示任务
- 任务拖拽移动
- 优先级设置（紧急/高/中/低）
- 标签管理
- 循环任务支持

### 📅 日程管理
- 月视图 / 周视图切换
- 日程事件管理
- 颜色标记
- 全天事件支持

### 📝 笔记管理
- 普通笔记
- 清单笔记（待办事项）
- 浏览模式 / 编辑模式

### 🔖 书签管理
- 网站书签收藏
- 分类管理
- 自动获取网站图标

### 📜 脚本管理
- 代码片段管理
- 多语言支持

### 📁 项目管理
- 项目创建与管理
- 子任务管理
- 看板/泳道图/列表三种视图
- 子任务状态自定义（支持拖拽排序）
- 进度自动统计（基于子任务完成情况）

### 🏠 工作台
- 数据统计概览
- 待办任务列表
- 近期日程
- 项目进度
- 任务完成趋势图
- 最近笔记

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus UI 框架
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由管理
- Axios HTTP 客户端
- Day.js 日期处理

### 后端
- FastAPI (Python)
- SQLAlchemy ORM
- MySQL 数据库
- JWT 认证

### 部署
- Docker 容器化
- Docker Compose 编排

## 🚀 快速开始

### 环境要求
- Docker & Docker Compose
- Node.js 16+ (开发环境)
- Python 3.8+ (开发环境)

### 方式一：Docker Compose 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/Sean-keep/workspace.git
cd workspace

# 启动所有服务
docker-compose up -d

# 查看运行状态
docker-compose ps
```

### 方式二：手动部署

#### 1. 准备数据库 (MySQL 8.0+)

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE personal_workspace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'workspace'@'localhost' IDENTIFIED BY 'workspace123';
GRANT ALL PRIVILEGES ON personal_workspace.* TO 'workspace'@'localhost';
FLUSH PRIVILEGES;
```

执行初始化脚本创建表结构和默认数据：

```bash
mysql -u workspace -p personal_workspace < scripts/init.sql
```

#### 2. 准备 Redis

```bash
# Ubuntu / Debian
sudo apt install redis-server
sudo systemctl start redis

# CentOS / RHEL
sudo yum install redis
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

#### 3. 启动后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（可选，不配置则使用默认值）
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=workspace
export DB_PASSWORD=workspace123
export DB_NAME=personal_workspace
export REDIS_HOST=localhost
export REDIS_PORT=6379
export SECRET_KEY=your-secret-key-change-in-production

# 启动后端服务
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 4. 构建并部署前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 构建产物在 frontend/dist/ 目录，使用 Nginx 托管：
```

Nginx 配置示例：

```nginx
server {
    listen 3001;
    server_name localhost;

    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 访问服务

- 前端: http://localhost:3001
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 📁 项目结构

```
personal-workspace/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── layouts/        # 布局组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   └── Dockerfile
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # 数据验证
│   │   └── utils/          # 工具函数
│   └── Dockerfile
├── scripts/                 # 初始化脚本
│   └── init.sql            # 数据库建表及默认数据
├── docker-compose.yml       # Docker 编排配置
└── README.md
```

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 实现任务管理、日程管理、笔记管理、书签管理、脚本管理、项目管理
- 实现工作台仪表盘
- 支持自定义任务状态和子任务状态
- 支持项目进度自动统计

## 📄 许可证

MIT License
