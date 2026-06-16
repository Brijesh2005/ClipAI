import subprocess
import re
from pathlib import Path

def sanitize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("https://", "http://")):
        raise ValueError("Invalid URL")
    if not any(d in url for d in ["youtube.com", "youtu.be"]):
        raise ValueError("Only YouTube URLs are supported")
    return url

def download_video(url: str, output_dir: Path, job_id: str) -> Path:
    url = sanitize_url(url)
    output_template = str(output_dir / f"{job_id}.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--format", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best",
        "--merge-output-format", "mp4",
        "--output", output_template,
        "--no-warnings",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"Download failed: {result.stderr[:500]}")
    
    # find the output file
    candidates = list(output_dir.glob(f"{job_id}.*"))
    mp4s = [f for f in candidates if f.suffix == ".mp4"]
    if not mp4s:
        raise RuntimeError("Downloaded file not found")
    return mp4s[0]

def get_video_info(url: str) -> dict:
    url = sanitize_url(url)
    cmd = ["yt-dlp", "--dump-json", "--no-playlist", url]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"Could not fetch video info: {result.stderr[:300]}")
    import json
    data = json.loads(result.stdout)
    return {
        "title": data.get("title", "Unknown"),
        "duration": data.get("duration", 0),
        "channel": data.get("uploader", "Unknown"),
        "thumbnail": data.get("thumbnail", ""),
        "description": data.get("description", "")[:2000],
    }
