# parser-worker/app/parsers/pdf_parser.py
import fitz  # PyMuPDF
from typing import List, Dict


def parse_pdf(file_path: str) -> Dict:
    doc = fitz.open(file_path)
    full_text = ""
    pages: List[Dict] = []
    warnings: List[str] = []

    for i, page in enumerate(doc):
        try:
            text = page.get_text("text")
            full_text += text + "\n"
            pages.append({
                "page_number": i + 1,
                "text": text.strip(),
                "tables": _extract_tables(page),
                "extraction_method": "text",
                "confidence": 1.0,
            })
        except Exception as e:
            warnings.append(f"Page {i+1}: {str(e)}")

    doc.close()
    return {"full_text": full_text.strip(), "pages": pages, "warnings": warnings}


def _extract_tables(page) -> List[Dict]:
    tables = []
    try:
        found = page.find_tables()
        for t in found:
            data = t.extract()
            if data:
                tables.append({
                    "rows": len(data),
                    "cols": len(data[0]) if data else 0,
                    "headers": data[0] if data else None,
                    "data": data[1:] if len(data) > 1 else [],
                })
    except Exception:
        pass
    return tables
