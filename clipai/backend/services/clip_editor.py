import subprocess
import json
from pathlib import Path

def get_video_dimensions(video_path: Path) -> tuple[int, int]:
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video":
            return stream["width"], stream["height"]
    return 1920, 1080

def extract_clip(
    video_path: Path,
    start: float,
    end: float,
    output_path: Path,
    vertical: bool = True,
) -> Path:
    duration = end - start
    w, h = get_video_dimensions(video_path)
    
    if vertical:
        # Convert to 9:16 vertical — crop center column
        target_w = int(h * 9 / 16)
        if target_w > w:
            target_w = w
        x_offset = (w - target_w) // 2
        vf = f"crop={target_w}:{h}:{x_offset}:0,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
    else:
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", str(video_path),
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg clip extraction failed: {result.stderr[-500:]}")
    return output_path

def add_captions(
    video_path: Path,
    output_path: Path,
    segments: list[dict],
    start_offset: float,
) -> Path:
    # Build ASS subtitle content with animated word highlighting
    ass_content = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,80,80,120,1
Style: Highlight,Arial Black,72,&H0047FFE8,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,80,80,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    def fmt_time(secs: float) -> str:
        h = int(secs // 3600)
        m = int((secs % 3600) // 60)
        s = secs % 60
        return f"{h}:{m:02d}:{s:06.2f}"

    for seg in segments:
        s = seg["start"] - start_offset
        e = seg["end"] - start_offset
        if e <= 0 or s < 0:
            continue
        s = max(0, s)
        text = seg["text"].strip().upper()
        # break long lines
        words = text.split()
        lines = []
        current = []
        for w in words:
            current.append(w)
            if len(" ".join(current)) > 25:
                lines.append(" ".join(current[:-1]))
                current = [w]
        if current:
            lines.append(" ".join(current))
        display = "\\N".join(lines)
        ass_content += f"Dialogue: 0,{fmt_time(s)},{fmt_time(e)},Default,,0,0,0,,{display}\n"

    ass_path = video_path.parent / f"{video_path.stem}_captions.ass"
    ass_path.write_text(ass_content, encoding="utf-8")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"ass={ass_path}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "copy",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    ass_path.unlink(missing_ok=True)
    if result.returncode != 0:
        raise RuntimeError(f"Caption burn-in failed: {result.stderr[-400:]}")
    return output_path

def generate_thumbnail(video_path: Path, output_path: Path, at_second: float = 2.0) -> Path:
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(at_second),
        "-i", str(video_path),
        "-frames:v", "1",
        "-q:v", "2",
        str(output_path),
    ]
    subprocess.run(cmd, capture_output=True, timeout=30)
    return output_path

def get_clip_file_size_mb(path: Path) -> float:
    try:
        return round(path.stat().st_size / 1024 / 1024, 1)
    except Exception:
        return 0.0
