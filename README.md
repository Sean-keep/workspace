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

### 使用 Docker 部署

```bash
# 克隆项目
git clone https://github.com/your-username/personal-workspace.git
cd personal-workspace

# 启动服务
docker-compose up -d
```

### 访问服务

- 前端: http://localhost:3001
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 默认账号

- 用户名: admin
- 密码: admin123

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
