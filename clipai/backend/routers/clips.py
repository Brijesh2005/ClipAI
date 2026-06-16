from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from services.job_store import job_store

router = APIRouter()

@router.get("/clips/{job_id}")
def list_clips(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {"clips": job.get("clips", []), "status": job["status"]}

@router.get("/download/{job_id}/{clip_id}")
def download_clip(job_id: str, clip_id: str):
    path = Path(f"outputs/clips/{job_id}_{clip_id}.mp4")
    if not path.exists():
        raise HTTPException(404, "Clip file not found")
    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"clip_{clip_id}.mp4",
        headers={"Content-Disposition": f'attachment; filename="clip_{clip_id}.mp4"'},
    )
