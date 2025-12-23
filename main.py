from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
import re
import uuid

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

app = FastAPI(
    title="Revitarium API",
    version="4.3",
    description="Biomechanical scoliosis analysis with longitudinal scoring and PDF export"
)

# =========================
# STORAGE (v4.x – memória)
# =========================
PATIENT_HISTORY: Dict[str, List[dict]] = {}
LAST_REPORT: Dict[str, dict] = {}

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

def region_of(v: str) -> str:
    if v.startswith("C"): return "cervical"
    if v.startswith("T"): return "toracica"
    if v.startswith("L"): return "lombar"
    if v.startswith("S"): return "sacral"
    return "indefinida"

def continuous_score(angle: float) -> float:
    return round(max(0, 100 - abs(angle) * 2.2), 2)

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

# =========================
# ROUTES
# =========================

@app.get("/")
def health():
    return {"status": "ok", "service": "Revitarium API v4.3"}

@app.post("/workflow/analyze/v4", response_model=WorkflowResponse)
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(...)
):
    analysis = []
    region_scores: Dict[str, List[float]] = {
        "cervical": [], "toracica": [], "lombar": [], "sacral": []
    }

    for item in data:
        if not is_valid_vertebra(item.vertebra):
            continue

        region = region_of(item.vertebra)
        score = continuous_score(item.angle)

        analysis.append(
            VertebraAnalysis(
                vertebra=item.vertebra,
                angle=item.angle,
                region=region,
                severity=severity_label(item.angle),
                score=score
            )
        )

        region_scores[region].append(score)

    regions_avg = {
        r: round(sum(v)/len(v), 2) for r, v in region_scores.items() if v
    }

    global_score = round(sum(regions_avg.values()) / len(regions_avg), 2)
    risk = clinical_risk(global_score)

    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "global_score": global_score,
        "clinical_risk": risk
    }

    PATIENT_HISTORY.setdefault(patient_id, []).append(entry)

    response = WorkflowResponse(
        patient_id=patient_id,
        global_score=global_score,
        clinical_risk=risk,
        regions=regions_avg,
        analysis=analysis,
        recommendation="Plano corretivo com progressão controlada e reavaliação longitudinal."
    )

    LAST_REPORT[patient_id] = response.dict()
    return response

# =========================
# PDF EXPORT
# =========================

@app.get("/workflow/report/{patient_id}/pdf")
def generate_pdf(patient_id: str):
    if patient_id not in LAST_REPORT:
        return {"error": "Nenhum relatório encontrado para esse paciente"}

    data = LAST_REPORT[patient_id]
    filename = f"revitarium_report_{patient_id}_{uuid.uuid4().hex[:6]}.pdf"

    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>REVITARIUM – LAUDO BIOMECÂNICO</b>", styles["Title"]))
    story.append(Paragraph(f"Paciente: {patient_id}", styles["Normal"]))
    story.append(Paragraph(f"Score Global: {data['global_score']}", styles["Normal"]))
    story.append(Paragraph(f"Risco Clínico: {data['clinical_risk'].upper()}", styles["Normal"]))
    story.append(Paragraph("<br/><b>ANÁLISE SEGMENTAR</b>", styles["Heading2"]))

    for a in data["analysis"]:
        story.append(
            Paragraph(
                f"{a['vertebra']} | {a['region']} | Ângulo: {a['angle']}° | "
                f"{a['severity']} | Score: {a['score']}",
                styles["Normal"]
            )
        )

    story.append(Paragraph("<br/><b>RECOMENDAÇÃO</b>", styles["Heading2"]))
    story.append(Paragraph(data["recommendation"], styles["Normal"]))

    doc.build(story)

    return FileResponse(filename, media_type="application/pdf", filename=filename)
