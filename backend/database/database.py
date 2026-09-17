import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool

load_dotenv()


def _build_database_url() -> str:
    url = (os.getenv("DATABASE_URL") or "").strip()
    if url:
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://") :]
        if "sslmode=" not in url and "supabase" in url:
            url += ("&" if "?" in url else "?") + "sslmode=require"
        return url

    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    if user and password and host:
        return (
            f"postgresql+psycopg2://{user}:{quote_plus(password)}"
            f"@{host}:{os.getenv('DB_PORT', '5432')}"
            f"/{os.getenv('DB_NAME', 'postgres')}?sslmode=require"
        )

    raise RuntimeError(
        "DATABASE_URL is not set, and DB_USER/DB_PASSWORD/DB_HOST are incomplete"
    )


DATABASE_URL = _build_database_url()

# NullPool: required when using Supabase Session/Transaction pooler
# so SQLAlchemy does not double-pool connections.
engine = create_engine(DATABASE_URL, poolclass=NullPool, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
