from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_seller_reply_to_reviews'
down_revision = None
depends_on = None

def upgrade():
    # Add seller_reply and seller_reply_at columns to reviews table
    op.add_column('reviews', sa.Column('seller_reply', sa.Text(), nullable=True))
    op.add_column('reviews', sa.Column('seller_reply_at', sa.DateTime(), nullable=True))

def downgrade():
    # Remove seller_reply and seller_reply_at columns from reviews table
    op.drop_column('reviews', 'seller_reply')
    op.drop_column('reviews', 'seller_reply_at') 