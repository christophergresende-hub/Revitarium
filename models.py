from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class PatientScore(Base):
    __tablename__ = "patient_scores"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    global_score = Column(Float)
    clinical_risk = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
