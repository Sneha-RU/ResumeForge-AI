"""
ResumeForge AI — FastAPI Backend
=================================
Routes
------
POST /analyze      TF-IDF + spaCy NER → match score + keyword gaps
POST /export-pdf   XML resume data     → WeasyPrint PDF bytes
GET  /health       Service health check

Static files (frontend) are served from ../frontend/html at root /.

Startup
-------
    uvicorn main:app --reload --port 8000
    # or for Railway:
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import spacy

# Local modules
sys.path.insert(0, os.path.dirname(__file__))
from ml.scorer import ATSScorer
from ml.extractor import KeywordExtractor
from pdf.generator import PDFGenerator


# ── Startup / shutdown ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the spaCy model once at startup and share it across all requests."""
    print("Loading spaCy model...")
    app.state.nlp = spacy.load("en_core_web_sm")
    app.state.scorer = ATSScorer()
    app.state.extractor = KeywordExtractor(app.state.nlp)
    app.state.pdf_gen = PDFGenerator()
    print("ResumeForge AI ready.")
    yield
    print("Shutting down.")


# ── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ResumeForge AI",
    description="Intelligent resume optimization powered by TF-IDF and spaCy NER.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=10,
                             description="Plain text of the resume (no XML tags)")
    job_description: str = Field(..., min_length=10,
                                 description="Plain text of the target job description")

class AnalyzeResponse(BaseModel):
    match_score: float          # 0 – 100
    matched_keywords: list[str]
    missing_keywords: list[str]
    grade: str                  # A / B / C / D

class ExportRequest(BaseModel):
    resume_xml: str = Field(..., description="Full XML string from the builder form")


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "ResumeForge AI"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, request: Request):
    """
    Compute the semantic match between a resume and a job description.

    Steps
    -----
    1. ATSScorer  → TF-IDF vectorise both texts, cosine similarity score
    2. Extractor  → spaCy NER on the JD, compare noun tokens against resume
    3. Return score, matched keywords, missing keywords, grade
    """
    scorer    = request.app.state.scorer
    extractor = request.app.state.extractor

    score = scorer.score(req.resume_text, req.job_description)

    jd_keywords = extractor.extract(req.job_description)
    resume_lower = req.resume_text.lower()

    matched = sorted([k for k in jd_keywords if k.lower() in resume_lower])
    missing = sorted([k for k in jd_keywords if k.lower() not in resume_lower])

    grade = "A" if score >= 75 else "B" if score >= 55 else "C" if score >= 35 else "D"

    return AnalyzeResponse(
        match_score=round(score, 1),
        matched_keywords=matched[:20],   # cap display at 20
        missing_keywords=missing[:20],
        grade=grade,
    )


@app.post("/analyze-upload", response_model=AnalyzeResponse)
def analyze_upload(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Extract text from uploaded PDF and compute semantic match against a job description.
    """
    try:
        from pypdf import PdfReader
        pdf = PdfReader(file.file)
        resume_text = ""
        for page in pdf.pages:
            resume_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    scorer    = request.app.state.scorer
    extractor = request.app.state.extractor

    score = scorer.score(resume_text, job_description)

    jd_keywords = extractor.extract(job_description)
    resume_lower = resume_text.lower()

    matched = sorted([k for k in jd_keywords if k.lower() in resume_lower])
    missing = sorted([k for k in jd_keywords if k.lower() not in resume_lower])

    grade = "A" if score >= 75 else "B" if score >= 55 else "C" if score >= 35 else "D"

    return AnalyzeResponse(
        match_score=round(score, 1),
        matched_keywords=matched[:20],
        missing_keywords=missing[:20],
        grade=grade,
    )


@app.post("/export-pdf")
def export_pdf(req: ExportRequest, request: Request):
    """
    Convert the XML resume string to a print-ready PDF.

    Steps
    -----
    1. Parse XML → Python dict
    2. Render Jinja2 HTML template with resume data
    3. WeasyPrint converts HTML → PDF bytes
    4. Return as application/pdf with download header
    """
    generator = request.app.state.pdf_gen

    try:
        pdf_bytes = generator.generate(req.resume_xml)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"PDF generation failed: {exc}")

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )


# ── Serve frontend static files ────────────────────────────────────────────
# Must be mounted AFTER all API routes so /analyze and /export-pdf
# are matched first.

@app.get("/")
def redirect_to_app():
    return RedirectResponse(url="/frontend/html/login.html")

_frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(_frontend_dir):
    app.mount("/frontend", StaticFiles(directory=_frontend_dir), name="frontend")
