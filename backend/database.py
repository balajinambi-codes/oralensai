import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
from dotenv import load_dotenv

load_dotenv()


# Read DATABASE_URL from environment; default to a local SQLite file if not configured
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./oralens.db")

# Standardize Neon / Heroku / Render PostgreSQL protocol names for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires different connection arguments to allow concurrent thread operations
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    patient_age = Column(String)
    patient_gender = Column(String)
    clinical_notes = Column(Text)
    classification = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    recommendation = Column(Text)
    inference_time_ms = Column(Float)
    image_thumbnail = Column(Text)  # Base64 thumbnail string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    """Create all database tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency generator to yield a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
