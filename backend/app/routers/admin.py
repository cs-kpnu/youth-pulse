from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.utils.db import get_db
from app.utils.ai_helper import generate_survey_description
from app.utils.processor import process_uploaded_file, detect_type, format_data_for_type
import pandas as pd
import io
import os
import hmac
from bson.objectid import ObjectId

router = APIRouter()

# Simple in-memory cache for uploaded DF during wizard (Not ideal for production/scaling but matches simplified flow)
# In production, save to temp file or Redis.
TEMP_STORAGE = {} 

class AuthRequest(BaseModel):
    password: str

class SaveSurveyRequest(BaseModel):
    temp_id: str
    title: str
    organization: str
    participants: int
    selected_types: Dict[str, str] # col_name -> type
    dropped_columns: List[str]

class UpdateSurveyRequest(BaseModel):
    title: str
    organization: str
    participants: int
    date: str
    ai_description: str
    is_published: Optional[bool] = False

class GenerateDescRequest(BaseModel):
    title: str
    questions: list

@router.post("/login")
def login(req: AuthRequest):
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin")
    if hmac.compare_digest(req.password, admin_pass):
        return {"status": "ok"}
    raise HTTPException(status_code=401, detail="Invalid password")

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df, suggested_drop = process_uploaded_file(io.BytesIO(contents), file.filename)
        
        # Store in temp memory
        temp_id = str(abs(hash(file.filename + pd.Timestamp.now().strftime("%S"))))
        TEMP_STORAGE[temp_id] = df
        
        columns_info = []
        for col in df.columns:
            suggested_type = detect_type(df[col])
            example = str(df[col].dropna().iloc[0])[:60] if not df[col].dropna().empty else "No data"
            columns_info.append({
                "name": col,
                "suggested_type": suggested_type,
                "example": example
            })
            
        return {
            "temp_id": temp_id,
            "filename": file.filename,
            "columns": columns_info,
            "suggested_drop": suggested_drop
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save")
def save_survey(req: SaveSurveyRequest):
    if req.temp_id not in TEMP_STORAGE:
        raise HTTPException(status_code=404, detail="Session expired or file not found")
        
    df = TEMP_STORAGE[req.temp_id]
    participants_count = len(df)
    
    # Drop columns
    df_clean = df.drop(columns=req.dropped_columns, errors='ignore')
    
    final_questions = []
    
    for col, q_type in req.selected_types.items():
        if col not in df_clean.columns: continue
        
        q_data = format_data_for_type(df_clean[col], q_type)
        final_questions.append({
            "text": col,
            "type": q_type,
            "data": q_data
        })

    new_survey = {
        "id": abs(hash(req.title + pd.Timestamp.now().strftime("%S"))) % 100000,
        "title": req.title,
        "organization": req.organization,
        "participants": participants_count,
        "date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "questions": final_questions,
        "is_published": False
    }
    
    # Auto-generate description
    desc = generate_survey_description(req.title, final_questions)
    if desc:
        new_survey["ai_description"] = desc
        
    get_db().surveys.insert_one(new_survey)
    
    # Cleanup
    del TEMP_STORAGE[req.temp_id]
    
    return {"status": "ok", "id": new_survey["id"]}

@router.put("/survey/{survey_id}")
def update_survey(survey_id: str, req: UpdateSurveyRequest):
    db = get_db()
    # Handle ObjectId vs Int ID mess
    try:
        # If it's a 24-char hex, it's ObjectId (from Editor). If int-like, it's legacy ID.
        if len(survey_id) == 24:
             query = {"_id": ObjectId(survey_id)}
        else:
             query = {"id": int(survey_id)}
    except:
        query = {"id": int(survey_id) if survey_id.isdigit() else survey_id}

    db.surveys.update_one(query, {"$set": req.dict()})
    return {"status": "updated"}

@router.delete("/survey/{survey_id}")
def delete_survey(survey_id: str):
    db = get_db()
    try:
        if len(survey_id) == 24:
             query = {"_id": ObjectId(survey_id)}
        else:
             query = {"id": int(survey_id)}
    except:
        query = {"id": int(survey_id) if survey_id.isdigit() else survey_id}
        
    db.surveys.delete_one(query)
    return {"status": "deleted"}

@router.post("/generate_desc")
def generate_desc(req: GenerateDescRequest):
    desc = generate_survey_description(req.title, req.questions)
    return {"description": desc}

@router.get("/all_full")
def get_all_surveys_full():
    """Returns surveys with _id for Editor"""
    db = get_db()
    surveys = []
    for s in db.surveys.find({}):
        s["_id"] = str(s["_id"])
        if "is_published" not in s:
            s["is_published"] = False
        surveys.append(s)
    return surveys
