# =========================================================
# Revitarium API v4.6 Enterprise (SaaS-Ready)
# Multi-agent biomechanical scoliosis analysis
# Longitudinal scoring + persistence + JWT + multiuser
# =========================================================

from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime, timedelta
import sqlite3, os, re, jwt, hashlib
from fpdf import FPDF

# =========================================================
# CONFIG
# =========================================================

SECRET_KEY = "REVV-MODE-ENTERPRISE-KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
DB_PATH = "revitarium.db"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app = FastAPI(
    title="Revitarium API",
    version="4.6",
    description="SaaS-ready biomechanical scoliosis API with JWT, users, patients, analysis and clinical reporting."
)

# =========================================================
# DATABASE INIT
# =========================================================

def get_db():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_db()
    cur = conn.cursor()

    # Users
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT DEFAULT 'user',
            created_at TEXT
        )
    """)

    # Patients
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            owner_user_id INTEGER,
            active_status INTEGER DEFAULT 1,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        )
    """)

    # History
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patient_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            owner_user_id INTEGER,
            timestamp TEXT,
            global_score REAL,
            clinical_risk TEXT,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        )
    """)

    # Audit Logs
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            user_id INTEGER,
            timestamp TEXT,
            action TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

# =========================================================
# AUTH / USERS
# =========================================================

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

def hash_password(p):
    return hashlib.sha256(p.encode()).hexdigest()

def create_access_token(data: dict):
    data.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("uid")
    except:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id,name,email,role FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    return {"id": user[0], "name": user[1], "email": user[2], "role": user[3]}


@app.post("/auth/register")
def register_user(data: UserRegister):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (name,email,password_hash,created_at) VALUES (?,?,?,?)",
            (data.name, data.email, hash_password(data.password), datetime.utcnow().isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(400, "Email já cadastrado")
    conn.close()
    return {"message": "Usuário registrado com sucesso"}


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id,password_hash FROM users WHERE email = ?", (form_data.username,))
    user = cur.fetchone()
    conn.close()

    if not user or user[1] != hash_password(form_data.password):
        raise HTTPException(401, "Credenciais inválidas")

    token = create_access_token({"uid": user[0]})
    return {"access_token": token, "token_type": "bearer"}


# =========================================================
# BIOMECHANICAL ENGINE
# =========================================================

class VertebraInput(BaseModel):
    vertebra: str
    angle: float

def is_valid_vertebra(v: str): return bool(re.match(r"^[CTLS][0-9]{1,2}$", v))
def classify_region(v: str): return {"C":"cervical","T":"toracica","L":"lombar","S":"sacral"}.get(v[0],"indefinida")

def continuous_score(a: float):
    return round(max(0, 100 - abs(a)*2.2), 2)

def severity(a: float):
    a = abs(a)
    return "normal" if a < 5 else "leve" if a < 10 else "moderada" if a < 20 else "acentuada" if a < 30 else "grave"

def risk(score: float):
    return "verde" if score >= 75 else "amarelo" if score >= 55 else "vermelho"

# =========================================================
# ANALYSIS / SAAS BOUND
# =========================================================

@app.post("/workflow/analyze/v4")
def analyze_v4(
    data: List[VertebraInput],
    patient_id: str = Query(...),
    user=Depends(get_current_user)
):
    analysis = []
    weights = {"cervical":1.0,"toracica":1.2,"lombar":1.5,"sacral":1.0}
    wsum = wtot = 0.0

    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO patients (patient_id, owner_user_id) VALUES (?,?)",
                (patient_id, user["id"]))
    conn.commit()

    for i in data:
        if not is_valid_vertebra(i.vertebra): continue
        r = classify_region(i.vertebra)
        s = continuous_score(i.angle)
        analysis.append({
            "vertebra": i.vertebra,
            "angle": i.angle,
            "region": r,
            "severity": severity(i.angle),
            "score": s
        })
        wsum += s*weights[r]; wtot += weights[r]

    gscore = round(wsum/wtot,2) if wtot else 0
    risco = risk(gscore)

    cur.execute("INSERT INTO patient_history (patient_id,owner_user_id,timestamp,global_score,clinical_risk) VALUES (?,?,?,?,?)",
                (patient_id, user["id"], datetime.utcnow().isoformat(), gscore, risco))
    conn.commit(); conn.close()

    return {
        "patient_id": patient_id,
        "usuario": user["email"],
        "global_score": gscore,
        "clinical_risk": risco,
        "analysis": analysis,
        "recommendation": "Progresso controlado + reavaliação longitudinal."
    }


# =========================================================
# EVOLUTION / DASHBOARD / FORECAST
# =========================================================

@app.get("/workflow/patient/{patient_id}/evolution")
def evolution(patient_id: str, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT timestamp, global_score, clinical_risk 
        FROM patient_history 
        WHERE patient_id = ? AND owner_user_id = ?
        ORDER BY id
    """,(patient_id, user["id"]))
    rows = cur.fetchall(); conn.close()

    hist = [{"timestamp":r[0],"global_score":r[1],"clinical_risk":r[2]} for r in rows]
    if len(hist)<2: return {"message":"dados insuficientes", "history":hist}

    delta = round(hist[-1]["global_score"] - hist[-2]["global_score"],2)
    trend = "melhora" if delta>2 else "piora" if delta<-2 else "estável"

    return {"patient_id":patient_id,"delta":delta,"trend":trend,"history":hist}


@app.get("/workflow/patient/{patient_id}/dashboard")
def dashboard(patient_id: str, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT global_score, clinical_risk FROM patient_history
        WHERE patient_id = ? AND owner_user_id = ?""",(patient_id, user["id"]))
    rows = cur.fetchall(); conn.close()

    if not rows: return {"error":"sem histórico"}
    scores=[r[0] for r in rows]

    return {
        "patient_id":patient_id,
        "avaliacoes_totais":len(rows),
        "ultimo_score":rows[-1][0],
        "ultimo_risco":rows[-1][1],
        "media":round(sum(scores)/len(scores),2),
        "melhor":max(scores),
        "pior":min(scores)
    }


# =========================================================
# PDF REPORT
# =========================================================

@app.get("/workflow/patient/{patient_id}/report/pdf")
def report_pdf(patient_id: str, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT timestamp, global_score, clinical_risk 
        FROM patient_history WHERE patient_id=? AND owner_user_id=?
        ORDER BY id
    """,(patient_id, user["id"]))
    rows = cur.fetchall(); conn.close()

    if not rows: return {"error":"sem histórico"}
    last = rows[-1]

    pdf=FPDF(); pdf.add_page(); pdf.set_font("Arial",size=12)
    pdf.cell(0,10,"Revitarium – Relatório Clínico",ln=True)
    pdf.cell(0,10,f"Paciente: {patient_id}",ln=True)
    pdf.cell(0,10,f"Score: {last[1]}  Risco: {last[2]}",ln=True)
    path=f"report_{patient_id}.pdf"; pdf.output(path)
    return FileResponse(path, media_type="application/pdf", filename=path)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {"status":"online","version":"4.6-enterprise"}
