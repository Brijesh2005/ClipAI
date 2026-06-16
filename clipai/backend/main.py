import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from routers import jobs, clips, health

OUTPUTS_DIR = Path("outputs")
OUTPUTS_DIR.mkdir(exist_ok=True)
(OUTPUTS_DIR / "clips").mkdir(exist_ok=True)
(OUTPUTS_DIR / "thumbs").mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ClipAI backend starting...")
    yield

app = FastAPI(title="ClipAI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(clips.router, prefix="/api")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

@app.get("/")
def root():
    return {"status": "ok", "app": "ClipAI Backend", "version": "1.0.0"}
