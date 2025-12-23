from sqlalchemy.orm import Session
from models import PatientScore

def create_score(db: Session, patient_id: str, global_score: float, clinical_risk: str):
    entry = PatientScore(
        patient_id=patient_id,
        global_score=global_score,
        clinical_risk=clinical_risk
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_scores_by_patient(db: Session, patient_id: str):
    return (
        db.query(PatientScore)
        .filter(PatientScore.patient_id == patient_id)
        .order_by(PatientScore.created_at)
        .all()
    )
