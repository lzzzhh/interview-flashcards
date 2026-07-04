# parser-worker/app/main.py — 文档解析 Worker
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from .parsers.pdf_parser import parse_pdf
from .parsers.docx_parser import parse_docx
from .utils.hash import text_hash
from .resume_renderer import render_tailored_resume
from .schemas import ParsedDocument, ParsedPage, ParseRequest, ResumeRenderRequest, ResumeRenderResponse

app = FastAPI(title="Flashcards Document Parser Worker")


@app.get("/health")
def health():
    return {"ok": True, "parsers": ["pdf", "docx"]}


@app.post("/parse", response_model=ParsedDocument)
def parse_document(req: ParseRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(404, "File not found")

    file_type = req.file_type or guess_type(req.file_path)

    if file_type == "pdf":
        result = parse_pdf(req.file_path)
    elif file_type == "docx":
        result = parse_docx(req.file_path)
    elif file_type == "txt" or file_type == "md":
        result = parse_text(req.file_path)
    else:
        raise HTTPException(400, f"Unsupported type: {file_type}")

    result["file_name"] = os.path.basename(req.file_path)
    result["source_type"] = file_type
    result["parser"] = "python-worker"
    result["text_hash"] = text_hash(result["full_text"])
    return result


@app.post("/resume/render", response_model=ResumeRenderResponse)
def render_resume(req: ResumeRenderRequest):
    if not os.path.exists(req.source_path):
        raise HTTPException(404, "File not found")

    rewrites = [
        {"before_text": item.before_text, "after_text": item.after_text}
        for item in req.rewrites
    ]
    result = render_tailored_resume(
        source_path=req.source_path,
        source_type=req.source_type,
        output_dir=req.output_dir,
        base_name=req.base_name,
        rewrites=rewrites,
        fallback_text=req.fallback_text,
    )
    return result


def guess_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf": return "pdf"
    if ext == ".docx": return "docx"
    if ext in [".txt", ".md"]: return "txt"
    return "unknown"


def parse_text(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    return {
        "file_name": "", "source_type": "txt", "parser": "",
        "full_text": text, "pages": [], "warnings": [], "text_hash": ""
    }
