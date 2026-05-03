"""add daily goals and time_spent fields

Revision ID: 20260502_0002
Revises: 20260502_0001
Create Date: 2026-05-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260502_0002"
down_revision: Union[str, None] = "20260502_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "students",
        sa.Column("daily_goal_questions", sa.Integer(), nullable=False, server_default="20"),
    )
    op.add_column(
        "students",
        sa.Column("daily_goal_minutes", sa.Integer(), nullable=False, server_default="15"),
    )

    op.add_column(
        "practice_records",
        sa.Column("time_spent_seconds", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("practice_records", "time_spent_seconds")
    op.drop_column("students", "daily_goal_minutes")
    op.drop_column("students", "daily_goal_questions")
