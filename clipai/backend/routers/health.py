import shutil
import json
import urllib.request
from fastapi import APIRouter

router = APIRouter()


def _check_ollama(url: str = "http://localhost:11434") -> dict:
    try:
        with urllib.request.urlopen(f"{url}/api/tags", timeout=3) as r:
            data = json.loads(r.read())
            models = [m["name"] for m in data.get("models", [])]
            return {"running": True, "models": models}
    except Exception:
        return {"running": False, "models": []}


def _check_faster_whisper() -> bool:
    try:
        import faster_whisper  # noqa
        return True
    except ImportError:
        return False


@router.get("/health")
def health():
    tools = {t: shutil.which(t) is not None for t in ["ffmpeg", "ffprobe", "yt-dlp"]}
    return {
        "status": "ok",
        "tools": tools,
        "local": {
            "faster_whisper_installed": _check_faster_whisper(),
            "ollama": _check_ollama(),
        },
    }
