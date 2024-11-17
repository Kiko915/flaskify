"""Add shop archive fields

Revision ID: add_shop_archive
Revises: 
Create Date: 2023-12-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_shop_archive'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add is_archived and archived_at columns to shops table
    op.add_column('shops', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('shops', sa.Column('archived_at', sa.DateTime(), nullable=True))

def downgrade():
    # Remove the columns
    op.drop_column('shops', 'archived_at')
    op.drop_column('shops', 'is_archived')
