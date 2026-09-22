# Alembic migrations

Run commands from the `backend/` directory so `app.*` is importable.

```bash
# apply all migrations (equivalent to scripts/init.sql on a fresh DB)
alembic upgrade head

# generate a new revision after changing models in app/models/
alembic revision --autogenerate -m "add foo column"

# inspect / roll back
alembic current
alembic history
alembic downgrade -1
```

- `env.py` builds the URL from `app.config.settings.DATABASE_URL` (see `.env`).
- `versions/0001_baseline.py` creates the full schema and mirrors `scripts/init.sql`.
- The FULLTEXT index `ft_notes_title_content` is MySQL-only (raw SQL).
