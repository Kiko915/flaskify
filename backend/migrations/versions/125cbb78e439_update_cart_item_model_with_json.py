"""Update cart item model with JSON

Revision ID: 125cbb78e439
Revises: 9cd68f7288a5
Create Date: 2024-12-09 00:41:30.687499

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '125cbb78e439'
down_revision = '9cd68f7288a5'
branch_labels = None
depends_on = None


def upgrade():
    # Create a new temporary table
    op.create_table('cart_items_new',
        sa.Column('item_uuid', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('product_uuid', sa.String(36), nullable=False),
        sa.Column('variation_uuid', sa.String(36), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('selected_option', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_uuid']),
        sa.ForeignKeyConstraint(['product_uuid'], ['products.product_uuid']),
        sa.ForeignKeyConstraint(['variation_uuid'], ['product_variations.variation_uuid'])
    )

    # Drop the old table
    op.drop_table('cart_items')

    # Rename the new table to cart_items
    op.rename_table('cart_items_new', 'cart_items')


def downgrade():
    # Create the old table structure
    op.create_table('cart_items_old',
        sa.Column('item_uuid', mysql.VARCHAR(36), nullable=False),
        sa.Column('cart_uuid', mysql.VARCHAR(36), nullable=False),
        sa.Column('product_uuid', mysql.VARCHAR(36), nullable=False),
        sa.Column('variation_uuid', mysql.VARCHAR(36), nullable=True),
        sa.Column('quantity', mysql.INTEGER(), nullable=False),
        sa.Column('unit_price', mysql.FLOAT(), nullable=False),
        sa.Column('created_at', mysql.DATETIME(), nullable=True),
        sa.Column('updated_at', mysql.DATETIME(), nullable=True),
        sa.ForeignKeyConstraint(['cart_uuid'], ['carts.cart_uuid'], name='cart_items_ibfk_1'),
        sa.ForeignKeyConstraint(['product_uuid'], ['products.product_uuid'], name='cart_items_ibfk_2'),
        sa.ForeignKeyConstraint(['variation_uuid'], ['product_variations.variation_uuid'], name='cart_items_ibfk_3'),
        sa.PrimaryKeyConstraint('item_uuid')
    )

    # Drop the new table
    op.drop_table('cart_items')

    # Rename the old table back to cart_items
    op.rename_table('cart_items_old', 'cart_items')
