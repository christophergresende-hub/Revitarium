from fastapi import FastAPI, Query
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel
import re

from database import SessionLocal, PatientRecord, init_db

app = FastAPI(
    title="Revitarium API",
    version="4.4",
    description="Multi-agent biomechanical scoliosis analysis with longitudinal scoring (SQLite)"
)

# =========================
# INIT DB
# =========================
init_db()

# =========================
# MODELS
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

def classify_region(vertebra: str) -> str:
    if vertebra.startswith("C"):
        return "cervical"
    if vertebra.startswith("T"):
        return "toracica"
    if vertebra.startswith("L"):
        return "lombar"
    if vertebra.startswith("S"):
        return "sacral"
    return "indefinida"

def severity_from_angle(angle: float) -> str:
    angle = abs(angle)
    if angle < 5:
        return "normal"
    elif angle < 10:
        return "leve"
    elif angle < 20:
        return "moderada"
    elif angle < 30:
        return "acentuada"
    else:
        return "grave"

def continuous_score(angle: float) -> float:
    angle = abs(angle)
    return round(max(0.0, 100 - (angle * 2.2)), 2)

def clinical_risk_from_score(score: float) -> str:
    if score >= 75:
        return "verde"
    elif score >= 55:
        return "amarelo"
    return "vermelho"

# =========================
# ROUTES
# =========================

@app.get("/health")
def health():
    return {"status": "ok", "version": "4.4"}

@app.post("/workflow/analyze/v4", response_model=WorkflowResponse)
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(..., description="Patient unique identifier")
):
    db = SessionLocal()
    try:
        analysis: List[VertebraAnalysis] = []
        region_scores: Dict[str, List[float]] = {
            "cervical": [],
            "toracica": [],
            "lombar": [],
            "sacral": []
        }

        for item in data:
            if not is_valid_vertebra(item.vertebra):
                continue

            region = classify_region(item.vertebra)
            severity = severity_from_angle(item.angle)
            score = continuous_score(item.angle)

            analysis.append(
                VertebraAnalysis(
                    vertebra=item.vertebra,
                    angle=item.angle,
                    region=region,
                    severity=severity,
                    score=score
                )
            )

            if region in region_scores:
                region_scores[region].append(score)

        region_avg: Dict[str, float] = {
            r: round(sum(v) / len(v), 2) for r, v in region_scores.items() if v
        }

        valid_scores = list(region_avg.values())
        global_score = round(sum(valid_scores) / len(valid_scores), 2) if valid_scores else 0.0
        clinical_risk = clinical_risk_from_score(global_score)

        # Persist record
        record = PatientRecord(
            patient_id=patient_id,
            global_score=global_score,
            clinical_risk=clinical_risk,
            timestamp=datetime.utcnow()
        )
        db.add(record)
        db.commit()

        recommendation = (
            "Plano corretivo baseado em análise vetorial, "
            "com progressão controlada e reavaliação longitudinal."
        )

        return WorkflowResponse(
            patient_id=patient_id,
            global_score=global_score,
            clinical_risk=clinical_risk,
            regions=region_avg,
            analysis=analysis,
            recommendation=recommendation
        )
    finally:
        db.close()

@app.get("/workflow/patient/{patient_id}/evolution")
def patient_evolution(patient_id: str):
    db = SessionLocal()
    try:
        records = (
            db.query(PatientRecord)
            .filter(PatientRecord.patient_id == patient_id)
            .order_by(PatientRecord.timestamp.asc())
            .all()
        )

        history = [
            {
                "timestamp": r.timestamp.isoformat(),
                "global_score": r.global_score,
                "clinical_risk": r.clinical_risk
            }
            for r in records
        ]

        if len(history) < 2:
            return {
                "patient_id": patient_id,
                "message": "dados insuficientes para evolução",
                "history": history
            }

        last = history[-1]
        prev = history[-2]
        delta = round(last["global_score"] - prev["global_score"], 2)

        if delta >= 5:
            trend = "melhora"
        elif delta <= -5:
            trend = "piora"
        else:
            trend = "estável"

        return {
            "patient_id": patient_id,
            "previous_score": prev["global_score"],
            "last_score": last["global_score"],
            "delta": delta,
            "trend": trend,
            "history": history
        }
    finally:
        db.close()
