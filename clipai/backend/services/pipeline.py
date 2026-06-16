import uuid
import traceback
from pathlib import Path

from services.job_store import job_store
from services.downloader import download_video, get_video_info
from services.transcriber import extract_audio, transcribe_audio
from services.viral_detector import detect_viral_moments
from services.clip_editor import (
    extract_clip, add_captions, generate_thumbnail, get_clip_file_size_mb
)

WORK_DIR = Path("outputs/work")
CLIPS_DIR = Path("outputs/clips")
THUMBS_DIR = Path("outputs/thumbs")
WORK_DIR.mkdir(parents=True, exist_ok=True)


def run_pipeline(
    job_id: str,
    youtube_url: str,
    clip_duration: int,
    num_clips: int,
    add_captions_flag: bool,
    # cloud keys (empty string = not provided)
    openai_api_key: str,
    anthropic_api_key: str,
    # mode
    mode: str = "cloud",          # "cloud" | "local"
    # local options
    local_whisper_model: str = "base",
    ollama_model: str = "llama3.1",
    ollama_url: str = "http://localhost:11435",
):
    def step(msg: str, pct: int):
        job_store.update(job_id, step=msg, progress=pct, status="processing")
        print(f"[{job_id}] {pct}% — {msg}")

    try:
        step("Fetching video info", 5)
        info = get_video_info(youtube_url)
        job_store.update(job_id, video_info=info)

        step("Downloading video", 10)
        video_path = download_video(youtube_url, WORK_DIR, job_id)

        step("Extracting audio", 25)
        audio_path = WORK_DIR / f"{job_id}.wav"
        extract_audio(video_path, audio_path)

        if mode == "local":
            step(f"Transcribing locally (faster-whisper '{local_whisper_model}')", 35)
        else:
            step("Transcribing with OpenAI Whisper", 35)

        segments = transcribe_audio(
            audio_path,
            api_key=openai_api_key,
            mode=mode,
            local_model=local_whisper_model,
        )
        audio_path.unlink(missing_ok=True)

        if mode == "local":
            step(f"Detecting viral moments with Ollama '{ollama_model}'", 50)
        else:
            step("Detecting viral moments with Claude AI", 50)

        viral_clips = detect_viral_moments(
            transcript_segments=segments,
            video_title=info["title"],
            video_description=info.get("description", ""),
            clip_duration=clip_duration,
            num_clips=num_clips,
            anthropic_api_key=anthropic_api_key,
            mode=mode,
            ollama_model=ollama_model,
            ollama_url=ollama_url,
        )

        clips_result = []
        total = len(viral_clips)

        for i, vc in enumerate(viral_clips):
            clip_id = str(uuid.uuid4())[:8]
            pct = 55 + int((i / total) * 40)
            step(f"Editing clip {i+1}/{total}: {vc.get('title','')[:40]}", pct)

            start = float(vc["start_time"])
            end = float(vc["end_time"])

            raw_path = CLIPS_DIR / f"{job_id}_{clip_id}_raw.mp4"
            final_path = CLIPS_DIR / f"{job_id}_{clip_id}.mp4"
            thumb_path = THUMBS_DIR / f"{job_id}_{clip_id}.jpg"

            extract_clip(video_path, start, end, raw_path, vertical=True)

            if add_captions_flag:
                clip_segs = [s for s in segments if s["end"] > start and s["start"] < end]
                try:
                    add_captions(raw_path, final_path, clip_segs, start_offset=start)
                    raw_path.unlink(missing_ok=True)
                except Exception as e:
                    print(f"Caption failed, using raw: {e}")
                    raw_path.rename(final_path)
            else:
                raw_path.rename(final_path)

            generate_thumbnail(final_path, thumb_path, at_second=2.0)
            duration_sec = end - start

            clips_result.append({
                "id": clip_id,
                "rank": vc.get("rank", i + 1),
                "title": vc.get("title", f"Clip {i+1}"),
                "description": vc.get("description", ""),
                "hook": vc.get("hook", ""),
                "category": vc.get("category", "Highlight"),
                "viral_score": vc.get("viral_score", 70),
                "why_viral": vc.get("why_viral", ""),
                "hashtags": vc.get("hashtags", []),
                "thumbnail_text": vc.get("thumbnail_text", ""),
                "start_time": start,
                "end_time": end,
                "duration": round(duration_sec, 1),
                "duration_fmt": f"{int(duration_sec//60)}:{int(duration_sec%60):02d}",
                "file": f"/outputs/clips/{job_id}_{clip_id}.mp4",
                "thumbnail": f"/outputs/thumbs/{job_id}_{clip_id}.jpg",
                "size_mb": get_clip_file_size_mb(final_path),
            })

        try:
            video_path.unlink(missing_ok=True)
        except Exception:
            pass

        job_store.update(
            job_id,
            status="done",
            progress=100,
            step="Complete",
            clips=clips_result,
        )
        print(f"[{job_id}] Pipeline complete — {len(clips_result)} clips")

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[{job_id}] PIPELINE ERROR:\n{tb}")
        job_store.update(job_id, status="error", error=str(e), step="Failed")
