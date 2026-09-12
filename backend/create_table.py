from database.database import engine,Base
from database.models import (
    User,
    SearchHistory,
    SavedTrial,
    UserProfile,
    TrialRegistration,
    ChatSession,
    ChatMessage,
)

print("Creating tables...")

# create_all only creates missing tables; existing tables are left untouched.
Base.metadata.create_all(bind=engine)

print("Tables created successfully")
