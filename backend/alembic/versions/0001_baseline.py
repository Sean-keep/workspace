"""Baseline schema (mirrors scripts/init.sql).

Revision ID: 0001_baseline
Revises:
Create Date: 2026-09-22

Creates the full initial schema for users / tasks / notes / projects /
bookmarks / snippets / events, including the composite indexes declared in
the models' __table_args__.

MySQL-only: the FULLTEXT index on notes(title, content) is created with raw
SQL and will fail on non-MySQL backends (that is expected).

Run with: alembic upgrade head
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("avatar", sa.String(length=500), nullable=True),
        sa.Column("settings", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        # VARCHAR(50): custom statuses like custom_169... are allowed at runtime
        sa.Column("status", sa.String(length=50), nullable=False, server_default="todo"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("recurrence_type", sa.String(length=20), nullable=False, server_default="none"),
        sa.Column("recurrence_days", sa.JSON(), nullable=True),
        sa.Column("last_completed", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_user_status", "tasks", ["user_id", "status"])
    op.create_index("ix_tasks_user_pinned_created", "tasks", ["user_id", "is_pinned", "created_at"])
    op.create_index("ix_tasks_user_completed", "tasks", ["user_id", "completed_at"])
    op.create_index("ix_tasks_user_due", "tasks", ["user_id", "due_date"])

    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False, server_default="Untitled"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("note_type", sa.String(length=20), nullable=False, server_default="note"),
        sa.Column("checklist_items", sa.JSON(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["notes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notes_user_parent", "notes", ["user_id", "parent_id"])
    op.create_index("ix_notes_user_pinned_updated", "notes", ["user_id", "is_pinned", "updated_at"])
    # MySQL-only; harmless to skip on other dialects
    op.execute("CREATE FULLTEXT INDEX ft_notes_title_content ON notes (title, content)")

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="planning"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("progress", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=False, server_default="#409eff"),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("members", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("subtasks", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projects_user_status", "projects", ["user_id", "status"])
    op.create_index("ix_projects_user_created", "projects", ["user_id", "created_at"])

    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="default"),
        sa.Column("favicon", sa.String(length=500), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bookmarks_user_category", "bookmarks", ["user_id", "category"])
    op.create_index("ix_bookmarks_user_visits", "bookmarks", ["user_id", "visit_count"])

    op.create_table(
        "snippets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=False, server_default="plaintext"),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_snippets_user_language", "snippets", ["user_id", "language"])
    op.create_index("ix_snippets_user_updated", "snippets", ["user_id", "updated_at"])

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("is_all_day", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("reminder_minutes", sa.Integer(), nullable=False, server_default=sa.text("15")),
        sa.Column("color", sa.String(length=20), nullable=False, server_default="#409EFF"),
        sa.Column("recurrence", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_user_start", "events", ["user_id", "start_time"])
    op.create_index("ix_events_user_end", "events", ["user_id", "end_time"])


def downgrade() -> None:
    op.execute("DROP INDEX ft_notes_title_content ON notes")
    op.drop_index("ix_events_user_end", table_name="events")
    op.drop_index("ix_events_user_start", table_name="events")
    op.drop_table("events")
    op.drop_index("ix_snippets_user_updated", table_name="snippets")
    op.drop_index("ix_snippets_user_language", table_name="snippets")
    op.drop_table("snippets")
    op.drop_index("ix_bookmarks_user_visits", table_name="bookmarks")
    op.drop_index("ix_bookmarks_user_category", table_name="bookmarks")
    op.drop_table("bookmarks")
    op.drop_index("ix_projects_user_created", table_name="projects")
    op.drop_index("ix_projects_user_status", table_name="projects")
    op.drop_table("projects")
    op.drop_index("ix_notes_user_pinned_updated", table_name="notes")
    op.drop_index("ix_notes_user_parent", table_name="notes")
    op.drop_table("notes")
    op.drop_index("ix_tasks_user_due", table_name="tasks")
    op.drop_index("ix_tasks_user_completed", table_name="tasks")
    op.drop_index("ix_tasks_user_pinned_created", table_name="tasks")
    op.drop_index("ix_tasks_user_status", table_name="tasks")
    op.drop_table("tasks")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
