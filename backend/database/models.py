from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Integer, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    query: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    result_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    matched_conditions: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class SavedTrial(Base):
    __tablename__ = "saved_trials"

    __table_args__ = (
        UniqueConstraint("user_id", "nct_id", name="uq_saved_trials_user_nct"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    nct_id: Mapped[str] = mapped_column(
        String(32),
        nullable=False
    )

    title: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )