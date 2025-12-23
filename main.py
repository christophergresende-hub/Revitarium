from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel
import sqlite3
import os
import re

# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Revitarium API",
    version="4.4",
    description="Biomechanical scoliosis analysis with longitudinal persistence (SQLite)"
)

DB_PATH = "revitarium.db"

# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        global_score REAL NOT NULL,
        clinical_risk TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS vertebra_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluation_id INTEGER,
        vertebra TEXT,
        angle REAL,
        region TEXT,
        severity TEXT,
        score REAL,
        FOREIGN KEY(evaluation_id) REFERENCES evaluations(id)
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

# =========================================================
# HELPERS
# =========================================================

def is_valid_vertebra(v: str) -> bool:
    return bool(re.match(r"^[CTLS][0-9]{1,2}$", v))

def classify_region(v: str) -> str:
    if v.startswith("C"): return "cervical"
    if v.startswith("T"): return "toracica"
    if v.startswith("L"): return "lombar"
    if v.startswith("S"): return "sacral"
    return "indefinida"

def continuous_score(angle: float) -> float:
    return round(max(0.0, 100 - abs(angle) * 2.2), 2)

def severity_label(angle: float) -> str:
    a = abs(angle)
    if a < 5: return "normal"
    if a < 10: return "leve"
    if a < 20: return "moderada"
    if a < 30: return "acentuada"
    return "grave"

def clinical_risk(score: float) -> str:
    if score >= 75: return "verde"
    if score >= 55: return "amarelo"
    return "vermelho"

# =========================================================
# ROUTES
# =========================================================

@app.get("/health")
def health():
    return {"status": "ok", "version": "4.4"}

@app.post("/workflow/analyze/v4")
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(..., description="Patient unique identifier")
):
    conn = get_db()
    cur = conn.cursor()

    region_scores: Dict[str, List[float]] = {}
    analysis: List[VertebraAnalysis] = []

    for item in data:
        if not is_valid_vertebra(item.vertebra):
            continue

        region = classify_region(item.vertebra)
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

    region_avg = {
        r: round(sum(v) / len(v), 2)
        for r, v in region_scores.items()
    }

    valid = list(region_avg.values())
    global_score = round(sum(valid) / len(valid), 2) if valid else 0.0
    risk = clinical_risk(global_score)

    timestamp = datetime.utcnow().isoformat()

    cur.execute(
        "INSERT INTO evaluations (patient_id, timestamp, global_score, clinical_risk) VALUES (?, ?, ?, ?)",
        (patient_id, timestamp, global_score, risk)
    )
    evaluation_id = cur.lastrowid

    for a in analysis:
        cur.execute("""
            INSERT INTO vertebra_analysis
            (evaluation_id, vertebra, angle, region, severity, score)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (evaluation_id, a.vertebra, a.angle, a.region, a.severity, a.score))

    conn.commit()
    conn.close()

    return {
        "patient_id": patient_id,
        "timestamp": timestamp,
        "global_score": global_score,
        "clinical_risk": risk,
        "regions": region_avg,
        "analysis": analysis,
        "recommendation": (
            "Plano corretivo progressivo baseado em score biomecânico "
            "com acompanhamento longitudinal."
        )
    }

@app.get("/workflow/patient/{patient_id}/evolution")
def patient_evolution(patient_id: str):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT timestamp, global_score, clinical_risk
        FROM evaluations
        WHERE patient_id = ?
        ORDER BY timestamp
    """, (patient_id,))

    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    if len(rows) < 2:
        return {
            "patient_id": patient_id,
            "message": "dados insuficientes para evolução",
            "history": rows
        }

    delta = round(rows[-1]["global_score"] - rows[-2]["global_score"], 2)

    trend = "estável"
    if delta >= 5: trend = "melhora"
    elif delta <= -5: trend = "piora"

    return {
        "patient_id": patient_id,
        "delta": delta,
        "trend": trend,
        "history": rows
    }
