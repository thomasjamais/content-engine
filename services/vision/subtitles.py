#!/usr/bin/env python3
import argparse
import subprocess
from pathlib import Path
from typing import Literal, Optional


Mode = Literal["from-audio", "from-text"]


def generate_srt(clip_path: Path, srt_path: Path, mode: Mode, text: Optional[str] = None) -> None:
    """
    Create SRT file either by transcribing audio (from-audio) or by distributing given text across duration (from-text).
    """
    srt_path.parent.mkdir(parents=True, exist_ok=True)
    
    if mode == "from-audio":
        generate_from_audio(clip_path, srt_path)
    elif mode == "from-text" and text:
        # Get video duration first
        duration = get_video_duration(clip_path)
        generate_from_text(text, duration, srt_path)
    else:
        raise ValueError("Invalid mode or missing text")


def generate_from_audio(clip_path: Path, srt_path: Path) -> None:
    """Generate subtitles from audio using Whisper."""
    try:
        # Use whisper for transcription
        cmd = [
            "whisper", str(clip_path),
            "--output_format", "srt",
            "--output_dir", str(srt_path.parent),
            "--output_name", srt_path.stem
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Warning: Whisper not available, creating placeholder subtitles")
        create_placeholder_srt(srt_path)


def generate_from_text(text: str, duration: float, srt_path: Path) -> None:
    """Generate subtitles from text with linear timing."""
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    if not sentences:
        return
    
    time_per_sentence = duration / len(sentences)
    
    with open(srt_path, 'w', encoding='utf-8') as f:
        for i, sentence in enumerate(sentences):
            start_time = i * time_per_sentence
            end_time = min((i + 1) * time_per_sentence, duration)
            
            f.write(f"{i + 1}\n")
            f.write(f"{format_srt_time(start_time)} --> {format_srt_time(end_time)}\n")
            f.write(f"{sentence}\n\n")


def get_video_duration(video_path: Path) -> float:
    """Get video duration using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
        print("Warning: Could not probe video duration, assuming 30 seconds")
        return 30.0


def create_placeholder_srt(srt_path: Path) -> None:
    """Create placeholder SRT file."""
    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write("1\n")
        f.write("00:00:00,000 --> 00:00:30,000\n")
        f.write("Audio transcription placeholder\n")


def format_srt_time(seconds: float) -> str:
    """Format seconds as SRT timestamp."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def main() -> None:
    p = argparse.ArgumentParser(description="Generate SRT subtitles")
    p.add_argument("--clip", type=Path, required=True, help="Input video clip")
    p.add_argument("--srt", type=Path, required=True, help="Output SRT file")
    p.add_argument("--mode", choices=["from-audio", "from-text"], required=True, help="Generation mode")
    p.add_argument("--text-file", type=Path, help="Text file for from-text mode")
    p.add_argument("--text", type=str, help="Text content for from-text mode")
    p.add_argument("--whisper-model", default="small", help="Whisper model for from-audio mode")
    p.add_argument("--max-chars", type=int, default=84, help="Maximum characters per line")
    p.add_argument("--max-lines", type=int, default=2, help="Maximum lines per subtitle")
    p.add_argument("--min-dur", type=float, default=1.6, help="Minimum subtitle duration")
    p.add_argument("--max-dur", type=float, default=4.0, help="Maximum subtitle duration")
    p.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = p.parse_args()
    
    # Get text content
    text = None
    if args.mode == "from-text":
        if args.text_file:
            with open(args.text_file, 'r', encoding='utf-8') as f:
                text = f.read().strip()
        elif args.text:
            text = args.text
        else:
            print("❌ Text content required for from-text mode (use --text-file or --text)")
            exit(1)
    
    generate_srt(args.clip, args.srt, args.mode, text)


if __name__ == "__main__":
    main()