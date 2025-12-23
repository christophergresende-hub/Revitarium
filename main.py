from fastapi import FastAPI, Query, Depends
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session
import re

from database import Base, engine, SessionLocal
from models import PatientScore
import crud

# =========================
# APP
# =========================

app = FastAPI(
    title="Revitarium API",
    version="4.3",
    description="Biomechanical scoliosis analysis with real longitudinal persistence"
)

Base.metadata.create_all(bind=engine)

# =========================
# DEPENDENCY
# =========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================
# MODELS (API)
# =========================

class VertebraInput(BaseModel):
    vertebra: str
    angle: float

class VertebraAnalysis(BaseModel):
    vertebra: str
    angle: float
    region: str
    severity: str
    score: float

class WorkflowResponse(BaseModel):
    patient_id: str
    global_score: float
    clinical_risk: str
    regions: Dict[str, float]
    analysis: List[VertebraAnalysis]
    recommendation: str

# =========================
# HELPERS
# =========================

def is_valid_vertebra(v: str) -> bool:
    return bool(re.match(r"^[CTLS][0-9]{1,2}$", v))

def region_of(v: str) -> str:
    if v.startswith("C"):
        return "cervical"
    if v.startswith("T"):
        return "toracica"
    if v.startswith("L"):
        return "lombar"
    if v.startswith("S"):
        return "sacral"
    return "indefinida"

def continuous_score(angle: float) -> float:
    return round(max(0, 100 - abs(angle) * 2.2), 2)

def severity_label(angle: float) -> str:
    a = abs(angle)
    if a < 5:
        return "normal"
    if a < 10:
        return "leve"
    if a < 20:
        return "moderada"
    if a < 30:
        return "acentuada"
    return "grave"

def clinical_risk(score: float) -> str:
    if score >= 75:
        return "verde"
    if score >= 55:
        return "amarelo"
    return "vermelho"

# =========================
# ROUTES
# =========================

@app.get("/health")
def health():
    return {"status": "ok", "version": "4.3"}

@app.post("/workflow/analyze/v4", response_model=WorkflowResponse)
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(...),
    db: Session = Depends(get_db)
):
    analysis = []
    region_scores: Dict[str, List[float]] = {}

    for item in data:
        if not is_valid_vertebra(item.vertebra):
            continue

        region = region_of(item.vertebra)
        score = continuous_score(item.angle)
        severity = severity_label(item.angle)

        analysis.append(
            VertebraAnalysis(
                vertebra=item.vertebra,
                angle=item.angle,
                region=region,
                severity=severity,
                score=score
            )
        )

        region_scores.setdefault(region, []).append(score)

    regions_avg = {
        r: round(sum(v) / len(v), 2) for r, v in region_scores.items()
    }

    global_score = round(sum(regions_avg.values()) / len(regions_avg), 2)
    risk = clinical_risk(global_score)

    # Persistência real
    crud.create_score(db, patient_id, global_score, risk)

    return WorkflowResponse(
        patient_id=patient_id,
        global_score=global_score,
        clinical_risk=risk,
        regions=regions_avg,
        analysis=analysis,
        recommendation=(
            "Plano corretivo baseado em análise vetorial, "
            "com progressão controlada e reavaliação longitudinal."
        )
    )

@app.get("/workflow/patient/{patient_id}/evolution")
def evolution(patient_id: str, db: Session = Depends(get_db)):
    records = crud.get_scores_by_patient(db, patient_id)

    if len(records) < 2:
        return {
            "patient_id": patient_id,
            "message": "dados insuficientes",
            "history": records
        }

    last = records[-1]
    prev = records[-2]
    delta = round(last.global_score - prev.global_score, 2)

    trend = "estável"
    if delta >= 5:
        trend = "melhora"
    elif delta <= -5:
        trend = "piora"

    return {
        "patient_id": patient_id,
        "previous_score": prev.global_score,
        "last_score": last.global_score,
        "delta": delta,
        "trend": trend,
        "history": records
    }
