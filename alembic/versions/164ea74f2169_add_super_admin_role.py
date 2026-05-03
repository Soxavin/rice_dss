"""add super_admin role

Revision ID: 164ea74f2169
Revises: c68ef0ab3962
Create Date: 2026-05-03

"""
from alembic import op

revision = '164ea74f2169'
down_revision = 'c68ef0ab3962'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL supports adding enum values without recreating the type.
    # IF NOT EXISTS prevents errors on re-runs.
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    # A full type recreation would be needed — out of scope for this migration.
    pass
