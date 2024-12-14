"""add banner customization fields

Revision ID: 9cd68f7288a5
Revises: 6ffc09ede3b7
Create Date: 2024-12-08 20:01:08.200645

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '9cd68f7288a5'
down_revision = '6ffc09ede3b7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('banners', schema=None) as batch_op:
        batch_op.add_column(sa.Column('button_text', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('button_link', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('secondary_button_text', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('secondary_button_link', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('overlay_opacity', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('title_color', sa.String(length=7), nullable=True))
        batch_op.add_column(sa.Column('description_color', sa.String(length=7), nullable=True))
        batch_op.add_column(sa.Column('button_style', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('show_secondary_button', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('show_special_offer', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('special_offer_text', sa.String(length=50), nullable=True))
        batch_op.alter_column('title',
               existing_type=mysql.VARCHAR(length=100),
               type_=sa.String(length=200),
               existing_nullable=False)
        batch_op.alter_column('description',
               existing_type=mysql.VARCHAR(length=200),
               type_=sa.Text(),
               existing_nullable=True)
        batch_op.drop_index('idx_banner_order')
        batch_op.drop_index('ix_banners_order')
        batch_op.drop_column('order')
        batch_op.drop_column('image_position')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('banners', schema=None) as batch_op:
        batch_op.add_column(sa.Column('image_position', mysql.VARCHAR(length=20), nullable=True))
        batch_op.add_column(sa.Column('order', mysql.INTEGER(), autoincrement=False, nullable=True))
        batch_op.create_index('ix_banners_order', ['order'], unique=False)
        batch_op.create_index('idx_banner_order', ['order'], unique=False)
        batch_op.alter_column('description',
               existing_type=sa.Text(),
               type_=mysql.VARCHAR(length=200),
               existing_nullable=True)
        batch_op.alter_column('title',
               existing_type=sa.String(length=200),
               type_=mysql.VARCHAR(length=100),
               existing_nullable=False)
        batch_op.drop_column('special_offer_text')
        batch_op.drop_column('show_special_offer')
        batch_op.drop_column('show_secondary_button')
        batch_op.drop_column('button_style')
        batch_op.drop_column('description_color')
        batch_op.drop_column('title_color')
        batch_op.drop_column('overlay_opacity')
        batch_op.drop_column('secondary_button_link')
        batch_op.drop_column('secondary_button_text')
        batch_op.drop_column('button_link')
        batch_op.drop_column('button_text')

    # ### end Alembic commands ###