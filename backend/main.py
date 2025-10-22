from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import api

app = FastAPI(title="MOF-LabAssist Lite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "MOF-LabAssist Lite",
        "endpoints": ["/api/forward", "/api/inverse", "/api/chat"],
    }

app.include_router(api)

@app.get("/api/health")
def health():
    return {"ok": True, "msg": "healthy"}
