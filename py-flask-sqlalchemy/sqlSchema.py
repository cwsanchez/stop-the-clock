from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    score = Column(Integer, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# Configure Database Connection
engine = create_engine('sqlite:///data.db')
Base.metadata.create_all(bind=engine)
