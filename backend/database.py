from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./orders.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True) # e.g. DH123456
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_contact = Column(String, nullable=False)
    customer_note = Column(String, nullable=True)
    product_name = Column(String, nullable=False)
    product_file_url = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="PENDING") # PENDING, PAID
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
