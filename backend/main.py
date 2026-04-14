from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import surveys, admin
from dotenv import load_dotenv
from pathlib import Path
import uvicorn

# Load .env from backend/ and project root
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

load_dotenv(backend_dir / ".env")
load_dotenv(root_dir / ".env")

app = FastAPI(title="YouthPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(surveys.router, prefix="/api/surveys", tags=["surveys"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "YouthPulse API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
