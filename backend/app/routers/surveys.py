from fastapi import APIRouter, HTTPException, Response
from typing import List, Optional
from app.utils.db import get_all_surveys, get_survey_by_id, save_ai_result
from app.utils.ai_helper import analyze_whole_survey
from app.utils.pdf_generator import generate_survey_pdf
from pydantic import BaseModel

router = APIRouter()

class BatchAnalysisRequest(BaseModel):
    title: str
    questions: list

@router.get("/")
def read_surveys():
    return get_all_surveys(only_published=True)

@router.get("/{survey_id}")
def read_survey(survey_id: str):
    try:
        s_id = int(survey_id)
    except:
        s_id = survey_id
        
    survey = get_survey_by_id(s_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey

@router.get("/{survey_id}/pdf")
def export_survey_pdf(survey_id: str):
    survey = get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    pdf_bytes = generate_survey_pdf(survey)
    
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=survey_{survey_id}.pdf"
        }
    )

@router.post("/{survey_id}/analyze/all")
def analyze_all(survey_id: str, req: BatchAnalysisRequest):
    results = analyze_whole_survey(req.title, req.questions)
    if not results:
        raise HTTPException(status_code=503, detail="Сервіс штучного інтелекту наразі перевантажений, оскільки використовуються безкоштовні моделі. Будь ласка, спробуйте пізніше.")
    
    for q_idx, text in results.items():
        save_ai_result(survey_id, int(q_idx), text)
        
    return {"results": results}
