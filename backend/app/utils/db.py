import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId

# Шукаємо .env спочатку в поточній папці, потім на рівень вище (в корені проекту)
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

def get_db():
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db_name = os.getenv("DB_NAME", "youth_pulse_db")
    return client[db_name]

def get_all_surveys(only_published=False):
    db = get_db()
    query = {}
    if only_published:
        query = {"is_published": True}
        
    surveys = list(db.surveys.find(query, {"_id": 0})) 
    return surveys

def get_survey_by_id(survey_id):
    db = get_db()
    
    # 1. Try finding by ObjectId if it's a 24-char hex string
    if isinstance(survey_id, str) and len(survey_id) == 24:
        try:
            res = db.surveys.find_one({"_id": ObjectId(survey_id)})
            if res:
                res["_id"] = str(res["_id"])
                return res
        except:
            pass

    # 2. Try finding by integer id
    try:
        s_id = int(survey_id)
        res = db.surveys.find_one({"id": s_id})
        if res:
            res["_id"] = str(res["_id"])
            return res
    except:
        pass
        
    # 3. Try finding by string id
    res = db.surveys.find_one({"id": str(survey_id)})
    if res:
        res["_id"] = str(res["_id"])
        return res
        
    return None

def save_ai_result(survey_id, question_index, analysis_text):
    db = get_db()
    
    # Find the correct document query
    query = {}
    if isinstance(survey_id, str) and len(survey_id) == 24:
        try:
            query = {"_id": ObjectId(survey_id)}
        except:
            pass
    
    if not query:
        try:
            query = {"id": int(survey_id)}
        except:
            query = {"id": str(survey_id)}

    key = f"questions.{question_index}.ai_analysis"
    db.surveys.update_one(
        query, 
        {"$set": {key: analysis_text}}
    )
