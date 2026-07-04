# parser-worker/app/schemas.py
from pydantic import BaseModel
from typing import Optional, List


class ParseRequest(BaseModel):
    file_path: str
    file_type: Optional[str] = None
    options: Optional[dict] = None


class ParsedTable(BaseModel):
    rows: int = 0
    cols: int = 0
    headers: Optional[List[str]] = None
    data: List[List[str]] = []


class ParsedPage(BaseModel):
    page_number: Optional[int] = None
    text: str = ""
    tables: Optional[List[ParsedTable]] = None
    extraction_method: str = "text"
    confidence: Optional[float] = None


class ParsedDocument(BaseModel):
    file_name: str = ""
    source_type: str = ""
    parser: str = ""
    full_text: str = ""
    pages: List[ParsedPage] = []
    warnings: List[str] = []
    text_hash: str = ""


class ResumeRewrite(BaseModel):
    before_text: str
    after_text: str


class ResumeRenderRequest(BaseModel):
    source_path: str
    source_type: str
    output_dir: str
    base_name: str
    rewrites: List[ResumeRewrite] = []
    fallback_text: str = ""


class ResumeRenderResponse(BaseModel):
    docx_path: str
    pdf_path: str
    applied_count: int = 0
    warnings: List[str] = []
