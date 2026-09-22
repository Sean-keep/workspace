"""Alembic environment.

The database URL is taken from app.config.settings.DATABASE_URL (see .env),
not from alembic.ini. Target metadata comes from the SQLAlchemy models.

Usage (run from backend/):
    alembic revision --autogenerate -m "describe change"
    alembic upgrade head
    alembic downgrade -1
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.config import settings
from app.database import Base
import app.models  # noqa: F401  — populate Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _database_url() -> str:
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Emit SQL without a DBAPI connection."""
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database."""
    connectable = create_engine(_database_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
