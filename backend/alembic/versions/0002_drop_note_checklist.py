"""Drop the checklist note type (note_type / checklist_items).

Revision ID: 0002_drop_note_checklist
Revises: 0001_baseline
Create Date: 2026-10-05

清单类型整个砍掉 —— 勾选改用 markdown `- [ ]`（和离线版 Dexie v2 的 upgrade
同一套迁移规则）。drop 之前先把每一行的 `checklist_items` 拍成 markdown
任务列表接到 `content` 后面，老笔记不会空掉；勾选状态保留成 `[x]` / `[ ]`。

Run with: alembic upgrade head
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_drop_note_checklist"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    notes = sa.table(
        "notes",
        sa.column("id", sa.Integer),
        sa.column("content", sa.Text),
        sa.column("checklist_items", sa.JSON),
    )

    rows = conn.execute(
        sa.select(notes.c.id, notes.c.content, notes.c.checklist_items)
    ).all()
    for row in rows:
        items = row.checklist_items
        # 和 Dexie 一致：只要 checklist_items 是非空数组就迁，不看 note_type。
        if not isinstance(items, list) or not items:
            continue
        body = "\n".join(
            f"- [{'x' if it.get('checked') else ' '}] {it.get('text', '')}".rstrip()
            for it in items
            if isinstance(it, dict)
        )
        if not body:
            continue
        new_content = f"{row.content}\n\n{body}" if row.content else body
        conn.execute(
            notes.update().where(notes.c.id == row.id).values(content=new_content)
        )

    op.drop_column("notes", "checklist_items")
    op.drop_column("notes", "note_type")


def downgrade() -> None:
    # 只回结构不回数据：markdown 正文拆不回结构化清单项，接受。
    op.add_column(
        "notes",
        sa.Column(
            "note_type",
            sa.String(length=20),
            nullable=False,
            server_default="note",
        ),
    )
    op.add_column("notes", sa.Column("checklist_items", sa.JSON(), nullable=True))
