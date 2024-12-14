"""drop_foreign_key_and_add_wishlist

Revision ID: a1b2c3d4e5f6
Revises: x9y8z7w6v5u4
Create Date: (keep the existing date)

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'x9y8z7w6v5u4'
branch_labels = None
depends_on = None

def upgrade():
    # Drop the foreign key constraint
    op.execute('ALTER TABLE products DROP FOREIGN KEY products_ibfk_2')
    
    # Modify the category_uuid column
    op.execute('ALTER TABLE products MODIFY category_uuid VARCHAR(36) NOT NULL')
    
    # Recreate the foreign key constraint
    op.execute('ALTER TABLE products ADD CONSTRAINT products_ibfk_2 FOREIGN KEY (category_uuid) REFERENCES categories(uuid)')
    
    # Create wishlist table
    op.create_table('wishlists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_uuid', sa.String(length=36), nullable=False),
        sa.Column('product_uuid', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_uuid'], ['users.uuid'], name='fk_wishlist_user'),
        sa.ForeignKeyConstraint(['product_uuid'], ['products.uuid'], name='fk_wishlist_product')
    )
    
    # Add index for faster lookups
    op.create_index('idx_wishlist_user', 'wishlists', ['user_uuid'])
    op.create_index('idx_wishlist_product', 'wishlists', ['product_uuid'])
    # Add unique constraint to prevent duplicate wishlist entries
    op.create_unique_constraint('uq_user_product', 'wishlists', ['user_uuid', 'product_uuid'])

def downgrade():
    # Drop the wishlist table and its constraints
    op.drop_table('wishlists')
    
    # If we need to revert the category_uuid column changes
    op.execute('ALTER TABLE products DROP FOREIGN KEY products_ibfk_2')
    op.execute('ALTER TABLE products MODIFY category_uuid VARCHAR(255) NOT NULL')
    op.execute('ALTER TABLE products ADD CONSTRAINT products_ibfk_2 FOREIGN KEY (category_uuid) REFERENCES categories(uuid)') 