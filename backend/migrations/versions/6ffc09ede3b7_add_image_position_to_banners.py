"""add image position to banners

Revision ID: 6ffc09ede3b7
Revises: b22b9d0a275a
Create Date: 2024-12-08 15:20:39.473096

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ffc09ede3b7'
down_revision = 'b22b9d0a275a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('banners', schema=None) as batch_op:
        batch_op.add_column(sa.Column('image_position', sa.String(length=20), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('banners', schema=None) as batch_op:
        batch_op.drop_column('image_position')

    # ### end Alembic commands ###
