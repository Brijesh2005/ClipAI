import uuid
import threading
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from services.job_store import job_store
from services.pipeline import run_pipeline

router = APIRouter()


class JobRequest(BaseModel):
    youtube_url: str
    clip_duration: int = 45
    num_clips: int = 5
    add_captions: bool = True
    mode: Literal["cloud", "local"] = "cloud"
    # cloud keys (required when mode=cloud)
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    # local options (used when mode=local)
    local_whisper_model: str = "base"   # tiny|base|small|medium|large-v3
    ollama_model: str = "llama3.1"      # any model pulled in Ollama
    ollama_url: str = "http://localhost:11434"


@router.post("/jobs")
def create_job(req: JobRequest):
    if not req.youtube_url.strip():
        raise HTTPException(400, "youtube_url is required")

    if req.mode == "cloud":
        if not req.openai_api_key:
            raise HTTPException(400, "openai_api_key is required in cloud mode")
        if not req.anthropic_api_key:
            raise HTTPException(400, "anthropic_api_key is required in cloud mode")

    job_id = str(uuid.uuid4())[:12]
    job_store.create(job_id, {
        "youtube_url": req.youtube_url,
        "clip_duration": req.clip_duration,
        "num_clips": req.num_clips,
        "add_captions": req.add_captions,
        "mode": req.mode,
        "video_info": None,
    })

    thread = threading.Thread(
        target=run_pipeline,
        kwargs=dict(
            job_id=job_id,
            youtube_url=req.youtube_url,
            clip_duration=req.clip_duration,
            num_clips=req.num_clips,
            add_captions_flag=req.add_captions,
            openai_api_key=req.openai_api_key,
            anthropic_api_key=req.anthropic_api_key,
            mode=req.mode,
            local_whisper_model=req.local_whisper_model,
            ollama_model=req.ollama_model,
            ollama_url=req.ollama_url,
        ),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id, "status": "queued"}


@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/jobs")
def list_jobs():
    return job_store.all()


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    from pathlib import Path
    for clip in job.get("clips", []):
        try:
            Path(clip["file"].lstrip("/")).unlink(missing_ok=True)
            Path(clip["thumbnail"].lstrip("/")).unlink(missing_ok=True)
        except Exception:
            pass
    job_store.update(job_id, status="deleted")
    return {"deleted": True}
