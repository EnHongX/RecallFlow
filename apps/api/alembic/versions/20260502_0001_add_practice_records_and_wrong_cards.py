"""add practice_records and wrong_cards tables

Revision ID: 20260502_0001
Revises: 20260430_0002
Create Date: 2026-05-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260502_0001"
down_revision: Union[str, None] = "20260430_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def timestamp_columns() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "practice_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("card_id", sa.Integer(), sa.ForeignKey("cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("result", sa.String(length=20), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        *timestamp_columns(),
    )
    op.create_index("ix_practice_records_student_id", "practice_records", ["student_id"])
    op.create_index("ix_practice_records_card_id", "practice_records", ["card_id"])

    op.create_table(
        "wrong_cards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("card_id", sa.Integer(), sa.ForeignKey("cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_mastered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("mastered_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
    )
    op.create_index("ix_wrong_cards_student_id", "wrong_cards", ["student_id"])
    op.create_index("ix_wrong_cards_card_id", "wrong_cards", ["card_id"])
    op.create_unique_constraint("uq_wrong_cards_card_id", "wrong_cards", ["card_id"])


def downgrade() -> None:
    op.drop_table("wrong_cards")
    op.drop_table("practice_records")
