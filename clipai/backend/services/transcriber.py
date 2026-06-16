import subprocess
from pathlib import Path


def extract_audio(video_path: Path, audio_path: Path):
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vn", "-ar", "16000", "-ac", "1",
        "-c:a", "pcm_s16le",
        str(audio_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Audio extraction failed: {result.stderr[:300]}")


# ── Cloud: OpenAI Whisper API ─────────────────────────────────────────────────

def transcribe_cloud(audio_path: Path, api_key: str) -> list[dict]:
    import openai
    client = openai.OpenAI(api_key=api_key)
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )
    return [
        {"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
        for s in response.segments
    ]


# ── Local: faster-whisper (runs on CPU/GPU, no API key needed) ────────────────

def transcribe_local(audio_path: Path, model_size: str = "base") -> list[dict]:
    """
    Uses faster-whisper for fully local transcription.
    model_size options: tiny, base, small, medium, large-v2, large-v3
    - tiny/base  : fast, lower accuracy (~1–2 GB RAM)
    - small      : balanced (~2 GB RAM)
    - medium     : good quality (~5 GB RAM)
    - large-v3   : best quality (~10 GB RAM, GPU recommended)
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise RuntimeError(
            "faster-whisper is not installed. Run: pip install faster-whisper"
        )

    model = WhisperModel(model_size, device="auto", compute_type="int8")
    segments_iter, _ = model.transcribe(str(audio_path), beam_size=5)

    segments = []
    for seg in segments_iter:
        segments.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
    return segments


# ── Unified entry point ───────────────────────────────────────────────────────

def transcribe_audio(
    audio_path: Path,
    api_key: str = "",
    mode: str = "cloud",
    local_model: str = "base",
) -> list[dict]:
    if mode == "local":
        return transcribe_local(audio_path, model_size=local_model)
    return transcribe_cloud(audio_path, api_key)


def segments_to_text(segments: list[dict]) -> str:
    return " ".join(s["text"] for s in segments)
