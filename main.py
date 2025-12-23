from fastapi import FastAPI, Query
from typing import List, Dict
from datetime import datetime

app = FastAPI(
    title="Revitarium API",
    version="4.2",
    description="Multi-agent biomechanical scoliosis analysis with longitudinal scoring"
)

# =========================================================
# STORAGE (mock — depois vira banco)
# =========================================================

PATIENT_HISTORY: Dict[str, List[Dict]] = {}

# =========================================================
# MODELS (simples, direto)
# =========================================================

def classify_region(vertebra: str) -> str:
    if vertebra.startswith("C"):
        return "cervical"
    if vertebra.startswith("T"):
        return "toracica"
    if vertebra.startswith("L"):
        return "lombar"
    return "desconhecida"


def severity_from_angle(angle: float) -> str:
    if angle < 5:
        return "normal"
    if angle < 15:
        return "leve"
    if angle < 25:
        return "moderada"
    return "acentuada"


def score_from_angle(angle: float) -> float:
    return max(0.0, round(100 - (angle * 2.2), 1))


REGION_WEIGHT = {
    "cervical": 1.0,
    "toracica": 1.2,
    "lombar": 1.5
}

# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {"status": "ok"}

# =========================================================
# ANALYZE V4
# =========================================================

@app.post("/workflow/analyze/v4")
def analyze_v4(
    data: List[Dict],
    patient_id: str = Query(..., description="Patient unique identifier")
):
    analysis = []
    regions_score = {}
    weighted_sum = 0.0
    weight_total = 0.0

    for item in data:
        vertebra = item["vertebra"]
        angle = float(item["angle"])

        region = classify_region(vertebra)
        severity = severity_from_angle(angle)
        score = score_from_angle(angle)

        analysis.append({
            "vertebra": vertebra,
            "angle": angle,
            "region": region,
            "severity": severity,
            "score": score
        })

        regions_score[region] = score

        w = REGION_WEIGHT.get(region, 1.0)
        weighted_sum += score * w
        weight_total += w

    global_score = round(weighted_sum / weight_total, 2) if weight_total else 0.0

    if global_score >= 75:
        clinical_risk = "verde"
    elif global_score >= 50:
        clinical_risk = "amarelo"
    else:
        clinical_risk = "vermelho"

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "global_score": global_score,
        "clinical_risk": clinical_risk
    }

    PATIENT_HISTORY.setdefault(patient_id, []).append(record)

    return {
        "patient_id": patient_id,
        "global_score": global_score,
        "clinical_risk": clinical_risk,
        "regions": regions_score,
        "analysis": analysis,
        "recommendation": (
            "Plano corretivo baseado em análise vetorial, "
            "com progressão controlada e reavaliação longitudinal."
        )
    }

# =========================================================
# EVOLUTION (histórico longitudinal)
# =========================================================

@app.get("/workflow/patient/{patient_id}/evolution")
def get_patient_evolution(patient_id: str):
    return {
        "patient_id": patient_id,
        "history": PATIENT_HISTORY.get(patient_id, [])
    }

# =========================================================
# PLACEHOLDER FUTURO (PDF)
# =========================================================

@app.get("/workflow/report/{patient_id}/pdf")
def generate_pdf(patient_id: str):
    return {
        "message": "PDF generation endpoint reservado. Implementação futura."
    }
