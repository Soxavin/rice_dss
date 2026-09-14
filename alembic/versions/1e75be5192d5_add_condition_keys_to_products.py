"""add condition_keys to products

Revision ID: 1e75be5192d5
Revises: 3f8a1c9b2d45
Create Date: 2026-09-14 14:26:29.535522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e75be5192d5'
down_revision: Union[str, Sequence[str], None] = '3f8a1c9b2d45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Product ids from 3f8a1c9b2d45_add_products_table.py
_BIOCONTROL = 'b0000001-0000-0000-0000-000000000003'
_BIOBOOSTER = 'b0000001-0000-0000-0000-000000000004'
_BIOGUARD   = 'b0000001-0000-0000-0000-000000000005'

_BIOTIC_KEYS     = '["blast", "brown_spot", "bacterial_blight"]'
_NON_BIOTIC_KEYS = '["iron_toxicity", "n_deficiency", "salt_toxicity"]'


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('condition_keys', sa.JSON(), nullable=True))

    op.execute(
        f"UPDATE products SET condition_keys = '{_BIOTIC_KEYS}'::json "
        f"WHERE id IN ('{_BIOCONTROL}', '{_BIOGUARD}')"
    )
    op.execute(
        f"UPDATE products SET condition_keys = '{_NON_BIOTIC_KEYS}'::json "
        f"WHERE id = '{_BIOBOOSTER}'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'condition_keys')
