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
import hashlib
from bson.objectid import ObjectId

router = APIRouter()

# Simple in-memory cache for uploaded DF during wizard (Not ideal for production/scaling but matches simplified flow)
# In production, save to temp file or Redis.
TEMP_STORAGE = {} 

class AuthRequest(BaseModel):
    password: str
    nickname: Optional[str] = None

class SaveSurveyRequest(BaseModel):
    temp_id: str
    title: str
    organization: str
    participants: int
    selected_types: Dict[str, str] # col_name -> type
    dropped_columns: List[str]
    owner_id: Optional[str] = "root"

class UpdateSurveyRequest(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    participants: Optional[int] = None
    date: Optional[str] = None
    ai_description: Optional[str] = None
    is_published: Optional[bool] = None

class GenerateDescRequest(BaseModel):
    title: str
    questions: list

@router.post("/login")
def login(req: AuthRequest):
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin")
    guest_pass = os.getenv("GUEST_PASSWORD")
    
    if hmac.compare_digest(req.password, admin_pass):
        return {"status": "ok", "role": "admin", "owner_id": "root"}
        
    if guest_pass and hmac.compare_digest(req.password, guest_pass):
        if not req.nickname:
            raise HTTPException(status_code=400, detail="Nickname is required for guest access")
        return {"status": "ok", "role": "guest", "owner_id": req.nickname}
        
    raise HTTPException(status_code=401, detail="Invalid password")

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        # Calculate data hash for duplicate detection
        data_hash = hashlib.sha256(contents).hexdigest()
        
        # Check if this file was already uploaded by checking DB
        db = get_db()
        existing = db.surveys.find_one({"data_hash": data_hash})
        
        df, suggested_drop = process_uploaded_file(io.BytesIO(contents), file.filename)
        
        # Store in temp memory
        temp_id = str(abs(hash(file.filename + pd.Timestamp.now().strftime("%S"))))
        TEMP_STORAGE[temp_id] = {"df": df, "hash": data_hash}
        
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
            "suggested_drop": suggested_drop,
            "duplicate_found": existing["title"] if existing else None,
            "duplicate_id": str(existing["id"]) if existing else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save")
def save_survey(req: SaveSurveyRequest):
    if req.temp_id not in TEMP_STORAGE:
        raise HTTPException(status_code=404, detail="Session expired or file not found")
        
    temp_data = TEMP_STORAGE[req.temp_id]
    df = temp_data["df"]
    data_hash = temp_data["hash"]
    
    # Final safety check for duplicates in DB before actual save
    db = get_db()
    if db.surveys.find_one({"data_hash": data_hash}):
        raise HTTPException(status_code=409, detail="Це опитування вже є в системі")
        
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
        "is_published": False,
        "owner_id": req.owner_id,
        "data_hash": data_hash
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

    # Only update fields that were actually provided in the request
    update_data = req.dict(exclude_unset=True)
    if update_data:
        db.surveys.update_one(query, {"$set": update_data})
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
def get_all_surveys_full(owner_id: Optional[str] = None):
    """Returns surveys filtered by owner if provided"""
    db = get_db()
    
    query = {}
    # If not 'root' (admin), filter by owner_id
    if owner_id and owner_id != "root":
        query = {"owner_id": owner_id}
        
    surveys = []
    for s in db.surveys.find(query):
        s["_id"] = str(s["_id"])
        if "is_published" not in s:
            s["is_published"] = False
        surveys.append(s)
    return surveys
