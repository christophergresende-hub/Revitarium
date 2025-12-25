# =========================================================
# Revitarium API v4.5
# Biomechanical scoliosis analysis + longitudinal scoring
# SQLite persistence + PDF clinical report
# =========================================================

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
import sqlite3
import os
import re
from fpdf import FPDF

# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Revitarium API",
    version="4.5",
    description="Multi-agent biomechanical scoliosis analysis with longitudinal scoring, persistence and PDF report"
)

# =========================================================
# DATABASE (SQLite)
# =========================================================

DB_PATH = "revitarium.db"

def get_db():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patient_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp TEXT,
            global_score REAL,
            clinical_risk TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

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

REGION_WEIGHT = {
    "cervical": 1.0,
    "toracica": 1.2,
    "lombar": 1.5,
    "sacral": 1.0
}

def is_valid_vertebra(v: str) -> bool:
    return bool(re.match(r"^[CTLS][0-9]{1,2}$", v))

def classify_region(v: str) -> str:
    if v.startswith("C"): return "cervical"
    if v.startswith("T"): return "toracica"
    if v.startswith("L"): return "lombar"
    if v.startswith("S"): return "sacral"
    return "indefinida"

def severity_from_angle(a: float) -> str:
    a = abs(a)
    if a < 5: return "normal"
    if a < 10: return "leve"
    if a < 20: return "moderada"
    if a < 30: return "acentuada"
    return "grave"

def continuous_score(a: float) -> float:
    return round(max(0.0, 100 - abs(a) * 2.2), 2)

def clinical_risk_from_score(score: float) -> str:
    if score >= 75: return "verde"
    if score >= 55: return "amarelo"
    return "vermelho"

# =========================================================
# ROUTES
# =========================================================

@app.get("/health")
def health():
    return {"status": "ok", "version": "4.5"}

# ---------------------------------------------------------
# ANALYSIS ENTRYPOINT (MAIN)
# ---------------------------------------------------------

@app.post("/workflow/analyze/v4", response_model=WorkflowResponse)
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(..., description="Patient unique identifier")
):
    analysis = []
    region_scores: Dict[str, List[float]] = {}
    weighted_sum = 0.0
    weight_total = 0.0

    for item in data:
        if not is_valid_vertebra(item.vertebra):
            continue

        region = classify_region(item.vertebra)
        score = continuous_score(item.angle)
        severity = severity_from_angle(item.angle)

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
        weighted_sum += score * REGION_WEIGHT.get(region, 1.0)
        weight_total += REGION_WEIGHT.get(region, 1.0)

    region_avg = {r: round(sum(v) / len(v), 2) for r, v in region_scores.items()}
    global_score = round(weighted_sum / weight_total, 2) if weight_total else 0.0
    clinical_risk = clinical_risk_from_score(global_score)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO patient_history (patient_id, timestamp, global_score, clinical_risk) VALUES (?, ?, ?, ?)",
        (patient_id, datetime.utcnow().isoformat(), global_score, clinical_risk)
    )
    conn.commit()
    conn.close()

    return WorkflowResponse(
        patient_id=patient_id,
        global_score=global_score,
        clinical_risk=clinical_risk,
        regions=region_avg,
        analysis=analysis,
        recommendation="Plano corretivo baseado em análise vetorial, com progressão controlada e reavaliação longitudinal."
    )

# ---------------------------------------------------------
# LONGITUDINAL EVOLUTION
# ---------------------------------------------------------

@app.get("/workflow/patient/{patient_id}/evolution")
def get_patient_evolution(patient_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT timestamp, global_score, clinical_risk FROM patient_history WHERE patient_id = ? ORDER BY id",
        (patient_id,)
    )
    rows = cur.fetchall()
    conn.close()

    history = [
        {"timestamp": r[0], "global_score": r[1], "clinical_risk": r[2]}
        for r in rows
    ]

    if len(history) < 2:
        return {"patient_id": patient_id, "message": "dados insuficientes para evolução", "history": history}

    previous = history[-2]
    current = history[-1]
    delta = round(current["global_score"] - previous["global_score"], 2)

    if delta > 2: trend = "melhora"
    elif delta < -2: trend = "piora"
    else: trend = "estável"

    return {
        "patient_id": patient_id,
        "previous_score": previous["global_score"],
        "current_score": current["global_score"],
        "delta": delta,
        "trend": trend,
        "history": history
    }

# ---------------------------------------------------------
# PDF CLINICAL REPORT
# ---------------------------------------------------------

@app.get("/workflow/patient/{patient_id}/report/pdf")
def patient_pdf(patient_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT timestamp, global_score, clinical_risk FROM patient_history WHERE patient_id = ? ORDER BY id",
        (patient_id,)
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {"error": "Paciente sem histórico"}

    last = rows[-1]

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, "Revitarium – Relatório Clínico", ln=True)
    pdf.ln(4)
    pdf.cell(0, 10, f"Paciente: {patient_id}", ln=True)
    pdf.cell(0, 10, f"Última avaliação: {last[0]}", ln=True)
    pdf.cell(0, 10, f"Score global: {last[1]}", ln=True)
    pdf.cell(0, 10, f"Risco clínico: {last[2]}", ln=True)

    path = f"report_{patient_id}.pdf"
    pdf.output(path)

    return FileResponse(path, media_type="application/pdf", filename=path)

@app.get("/workflow/patient/{patient_id}/dashboard")
def patient_dashboard(patient_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT timestamp, global_score, clinical_risk FROM patient_history WHERE patient_id = ? ORDER BY id",
        (patient_id,)
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {"error": "Paciente sem histórico"}

    scores = [r[1] for r in rows]
    last = rows[-1]
    
    dashboard = {
        "patient_id": patient_id,
        "avaliacoes_totais": len(rows),
        "ultimo_score": last[1],
        "ultimo_risco": last[2],
        "media_geral": round(sum(scores) / len(scores), 2),
        "melhor_score": max(scores),
        "pior_score": min(scores)
    }
    return dashboard
