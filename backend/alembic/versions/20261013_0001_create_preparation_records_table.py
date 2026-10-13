"""create preparation_records table

Revision ID: 20261013_0001
Revises: 
Create Date: 2026-10-13 10:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20261013_0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'preparation_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('practice_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('session_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_preparation_records_id'), 'preparation_records', ['id'], unique=False)
    op.create_index(op.f('ix_preparation_records_practice_type'), 'preparation_records', ['practice_type'], unique=False)
    op.create_index(op.f('ix_preparation_records_created_at'), 'preparation_records', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_preparation_records_created_at'), table_name='preparation_records')
    op.drop_index(op.f('ix_preparation_records_practice_type'), table_name='preparation_records')
    op.drop_index(op.f('ix_preparation_records_id'), table_name='preparation_records')
    op.drop_table('preparation_records')
