.PHONY: up down dev logs test migrate

up:
	docker compose up -d --build

down:
	docker compose down

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

logs:
	docker compose logs -f

test:
	python3 -m pytest backend/tests -q

migrate:
	cd backend && alembic upgrade head
