# =========================================================
# Revitarium API v4.3
# Biomechanical Scoliosis Analysis
# Longitudinal Scoring + Clinical PDF Report
# =========================================================

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from fpdf import FPDF
import os
import re

app = FastAPI(
    title="Revitarium API",
    version="4.3",
    description="Multi-agent biomechanical scoliosis analysis with longitudinal scoring and PDF reports"
)

# =========================================================
# STORAGE (IN-MEMORY — v4.x)
# =========================================================

PATIENT_HISTORY: Dict[str, List[Dict]] = {}

# =========================================================
# MODELS
# =========================================================

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

# =========================================================
# HELPERS
# =========================================================

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
    if angle < 10:
        return "leve"
    if angle < 20:
        return "moderada"
    if angle < 30:
        return "acentuada"
    return "grave"

def continuous_score(angle: float) -> float:
    angle = abs(angle)
    return round(max(0.0, 100 - (angle * 2.2)), 2)

REGION_WEIGHT = {
    "cervical": 1.0,
    "toracica": 1.2,
    "lombar": 1.5,
    "sacral": 1.0
}

def clinical_risk_from_score(score: float) -> str:
    if score >= 75:
        return "verde"
    if score >= 55:
        return "amarelo"
    return "vermelho"

# =========================================================
# HEALTH
# =========================================================

@app.get("/")
def root():
    return {"status": "ok", "service": "Revitarium API v4.3"}

@app.get("/health")
def health():
    return {"status": "ok"}

# =========================================================
# ANALYZE V4
# =========================================================

@app.post("/workflow/analyze/v4", response_model=WorkflowResponse)
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(..., description="Patient unique identifier")
):
    analysis: List[VertebraAnalysis] = []
    region_scores: Dict[str, List[float]] = {}
    weighted_sum = 0.0
    weight_total = 0.0

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

        region_scores.setdefault(region, []).append(score)

        w = REGION_WEIGHT.get(region, 1.0)
        weighted_sum += score * w
        weight_total += w

    if weight_total == 0:
        raise HTTPException(status_code=400, detail="Nenhum dado válido para análise")

    region_avg = {
        r: round(sum(v) / len(v), 2) for r, v in region_scores.items()
    }

    global_score = round(weighted_sum / weight_total, 2)
    clinical_risk = clinical_risk_from_score(global_score)

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "global_score": global_score,
        "clinical_risk": clinical_risk
    }

    PATIENT_HISTORY.setdefault(patient_id, []).append(record)

    return WorkflowResponse(
        patient_id=patient_id,
        global_score=global_score,
        clinical_risk=clinical_risk,
        regions=region_avg,
        analysis=analysis,
        recommendation=(
            "Plano corretivo baseado em análise vetorial, "
            "com progressão controlada e reavaliação longitudinal."
        )
    )

# =========================================================
# EVOLUTION (LONGITUDINAL)
# =========================================================

@app.get("/workflow/patient/{patient_id}/evolution")
def patient_evolution(patient_id: str):
    history = PATIENT_HISTORY.get(patient_id, [])

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

# =========================================================
# PDF REPORT (PASSO 6)
# =========================================================

@app.get("/workflow/patient/{patient_id}/report/pdf")
def generate_pdf_report(patient_id: str):
    history = PATIENT_HISTORY.get(patient_id)

    if not history:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    last = history[-1]
    prev = history[-2] if len(history) > 1 else None
    delta = round(last["global_score"] - prev["global_score"], 2) if prev else None

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Revitarium - Relatório Clínico", ln=True)

    pdf.ln(5)
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 8, f"Paciente ID: {patient_id}", ln=True)
    pdf.cell(0, 8, f"Data: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", ln=True)

    pdf.ln(5)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Resultado Atual", ln=True)

    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 8, f"Score Global: {last['global_score']}", ln=True)
    pdf.cell(0, 8, f"Risco Clínico: {last['clinical_risk']}", ln=True)

    if delta is not None:
        pdf.cell(0, 8, f"Evolução (delta): {delta}", ln=True)

    pdf.ln(5)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Recomendação Clínica", ln=True)

    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(
        0,
        8,
        "Plano corretivo progressivo com foco em mobilidade, "
        "estabilidade segmentar e reeducação postural, "
        "baseado na evolução biomecânica longitudinal."
    )

    os.makedirs("reports", exist_ok=True)
    file_path = f"reports/revitarium_{patient_id}.pdf"
    pdf.output(file_path)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"revitarium_{patient_id}.pdf"
    )
