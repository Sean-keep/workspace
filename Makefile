.PHONY: up down dev logs status test migrate clean

up:            ## 构建并后台启动全部服务
	docker compose up -d --build

down:          ## 停止服务（保留数据卷）
	docker compose down

dev:           ## 开发模式：后端热重载 + MySQL 3308 / Redis 6380
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

logs:          ## 跟踪全部服务日志
	docker compose logs -f

status:        ## 查看容器状态
	docker compose ps

test:          ## 跑后端测试（内存 SQLite，无需 MySQL / Redis）
	python3 -m pytest backend/tests -q

migrate:       ## 执行数据库迁移到最新
	cd backend && alembic upgrade head

clean:         ## 停止并删除数据卷（会清空数据库，慎用）
	docker compose down -v
