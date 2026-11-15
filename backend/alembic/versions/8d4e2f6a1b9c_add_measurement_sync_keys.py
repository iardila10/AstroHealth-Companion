"""add idempotency keys for offline measurement sync

Revision ID: 8d4e2f6a1b9c
Revises: 7c6d54eaa5b9
Create Date: 2026-11-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d4e2f6a1b9c"
down_revision: Union[str, Sequence[str], None] = "7c6d54eaa5b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "measurement_sync_keys",
        sa.Column("client_measurement_id", sa.String(length=36), nullable=False),
        sa.Column("measurement_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["measurement_id"], ["measurements.id"]),
        sa.PrimaryKeyConstraint("client_measurement_id"),
        sa.UniqueConstraint("measurement_id"),
    )


def downgrade() -> None:
    op.drop_table("measurement_sync_keys")
