"""seed subjects data

Revision ID: 20260430_0002
Revises: 20260430_0001
Create Date: 2026-04-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision: str = "20260430_0002"
down_revision: Union[str, None] = "20260430_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    subjects = table(
        "subjects",
        column("id", sa.Integer),
        column("name", sa.String),
        column("code", sa.String),
    )
    
    op.bulk_insert(
        subjects,
        [
            {"name": "语文", "code": "chinese"},
            {"name": "数学", "code": "math"},
            {"name": "英语", "code": "english"},
            {"name": "物理", "code": "physics"},
            {"name": "化学", "code": "chemistry"},
            {"name": "生物", "code": "biology"},
            {"name": "历史", "code": "history"},
            {"name": "地理", "code": "geography"},
            {"name": "政治", "code": "politics"},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM subjects WHERE code IN ('chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics')")
