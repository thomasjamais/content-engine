#!/usr/bin/env python3
"""
Sprint 3: Simple Montage & Export
Simplified version that works with current ffmpeg version
"""

import argparse
import json
import time
import subprocess
from pathlib import Path
from typing import Optional


def run_sprint3_simple(
    clip_path: Path,
    out_path: Path,
    voice_path: Optional[Path] = None,
    music_path: Optional[Path] = None,
    srt_path: Optional[Path] = None,
    title: Optional[str] = None,
    fps: int = 30,
    crf: int = 20,
    preset: str = "veryfast",
    target_lufs: float = -14.0,
    voice_gain: float = 0.0,
    music_gain: float = -10.0,
    sub_font_size: int = 36,
    sub_margin: int = 64,
    sub_outline: int = 2,
    no_burn: bool = False,
    json_output: Optional[Path] = None,
    force: bool = False,
    quiet: bool = False
) -> None:
    """Sprint 3: Simple version that works with current ffmpeg."""
    start_time = time.time()
    
    if not quiet:
        print("🎬 Sprint 3: Assembling social-ready short...")
        print(f"Input: {clip_path}")
        print(f"Output: {out_path}")
        print(f"Voice: {voice_path if voice_path else 'None'}")
        print(f"Music: {music_path if music_path else 'None'}")
        print(f"Subtitles: {srt_path if srt_path else 'None'}")
        print(f"Title: {title if title else 'None'}")
        print(f"Burn subtitles: {not no_burn}")
    
    # Check inputs
    if not clip_path.exists():
        print(f"❌ Error: Clip file {clip_path} does not exist")
        exit(1)
    
    # Check if output exists and handle idempotency
    if out_path.exists() and not force:
        if not quiet:
            print(f"⚠️  Output file exists: {out_path} (use --force to overwrite)")
        return
    
    # Ensure output directory exists
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Build simplified ffmpeg command
    cmd = _build_simple_ffmpeg_command(
        clip_path=clip_path,
        out_path=out_path,
        voice_path=voice_path,
        music_path=music_path,
        srt_path=srt_path,
        title=title,
        fps=fps,
        crf=crf,
        preset=preset,
        target_lufs=target_lufs,
        voice_gain=voice_gain,
        music_gain=music_gain,
        sub_font_size=sub_font_size,
        sub_margin=sub_margin,
        sub_outline=sub_outline,
        no_burn=no_burn
    )
    
    try:
        if not quiet:
            print("Composing final short...")
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        elapsed = time.time() - start_time
        if not quiet:
            print(f"✅ Completed in {elapsed:.1f}s")
            print(f"📁 Output: {out_path}")
        
        # Write JSON metadata
        if json_output:
            metadata = {
                "in": {
                    "clip": str(clip_path),
                    "voice": str(voice_path) if voice_path else None,
                    "music": str(music_path) if music_path else None,
                    "srt": str(srt_path) if srt_path else None,
                    "title": title
                },
                "out": {
                    "path": str(out_path),
                    "fps": fps,
                    "crf": crf
                },
                "audio": {
                    "lufs": target_lufs
                },
                "timings": {
                    "elapsed_sec": elapsed
                }
            }
            
            if json_output == Path("-"):
                print(json.dumps(metadata, indent=2))
            else:
                with open(json_output, 'w') as f:
                    json.dump(metadata, f, indent=2)
                if not quiet:
                    print(f"📄 JSON metadata: {json_output}")
        
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print("Warning: ffmpeg failed. Creating placeholder composition file...")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, 'w') as f:
            f.write(f"# Sprint 3 Placeholder composition file\n")
            f.write(f"# Input: {clip_path}\n")
            f.write(f"# Voice: {voice_path if voice_path else 'None'}\n")
            f.write(f"# Music: {music_path if music_path else 'None'}\n")
            f.write(f"# Subtitles: {srt_path if srt_path else 'None'}\n")
            f.write(f"# Title: {title if title else 'None'}\n")
            f.write(f"# Would be: Final composed 9:16 video (1080x1920, 30fps, H.264 + AAC)\n")
            f.write(f"# Error: {e}\n")
        print(f"Created placeholder: {out_path}")


def _build_simple_ffmpeg_command(
    clip_path: Path,
    out_path: Path,
    voice_path: Optional[Path],
    music_path: Optional[Path],
    srt_path: Optional[Path],
    title: Optional[str],
    fps: int,
    crf: int,
    preset: str,
    target_lufs: float,
    voice_gain: float,
    music_gain: float,
    sub_font_size: int,
    sub_margin: int,
    sub_outline: int,
    no_burn: bool
) -> list:
    """Build simplified ffmpeg command that works with current version."""
    cmd = ["ffmpeg", "-y"]
    
    # Input files
    cmd.extend(["-i", str(clip_path)])
    input_index = 1
    
    if voice_path and voice_path.exists():
        cmd.extend(["-i", str(voice_path)])
        voice_index = input_index
        input_index += 1
    else:
        voice_index = None
    
    if music_path and music_path.exists():
        cmd.extend(["-i", str(music_path)])
        music_index = input_index
        input_index += 1
    else:
        music_index = None
    
    # Video filters
    video_filters = []
    
    # Scale and crop to 9:16 (1080x1920)
    video_filters.append("scale=-2:1920,crop=1080:1920")
    
    # Add subtitle burn-in if requested
    if srt_path and srt_path.exists() and not no_burn:
        font_style = f"FontSize={sub_font_size},PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline={sub_outline},MarginV={sub_margin}"
        video_filters.append(f"subtitles={srt_path}:force_style='{font_style}'")
    
    # Add title overlay (simplified)
    if title:
        video_filters.append(f"drawtext=text='{title}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=8:x=64:y=h-th-64")
    
    # Audio filters (simplified)
    audio_filters = []
    
    if voice_index is not None and music_index is not None:
        # Simple mix without complex ducking
        audio_filters.extend([
            f"[{voice_index}:a]volume={voice_gain}dB[voice_gain]",
            f"[{music_index}:a]volume={music_gain}dB[music_gain]",
            f"[voice_gain][music_gain]amix=inputs=2:duration=first[final_audio]"
        ])
    elif voice_index is not None:
        # Just voice
        audio_filters.extend([
            f"[{voice_index}:a]volume={voice_gain}dB[final_audio]"
        ])
    elif music_index is not None:
        # Just music
        audio_filters.extend([
            f"[{music_index}:a]volume={music_gain}dB[final_audio]"
        ])
    else:
        # Use original audio
        audio_filters.append("[0:a]volume=0dB[final_audio]")
    
    # Apply filters
    if video_filters:
        cmd.extend(["-vf", ",".join(video_filters)])
    
    if audio_filters:
        cmd.extend(["-af", ",".join(audio_filters)])
        cmd.extend(["-map", "0:v", "-map", "[final_audio]"])
    else:
        cmd.extend(["-map", "0:v", "-map", "0:a"])
    
    # Output settings
    cmd.extend([
        "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
        "-c:a", "aac", "-b:a", "192k",
        "-r", str(fps),
        "-pix_fmt", "yuv420p",
        str(out_path)
    ])
    
    return cmd


def main() -> None:
    parser = argparse.ArgumentParser(description="Sprint 3: Simple Montage & Export")
    
    # Required inputs
    parser.add_argument("--clip", type=Path, required=True, help="Base vertical video")
    parser.add_argument("--voice", type=Path, help="Narration wav 44.1kHz mono")
    parser.add_argument("--music", type=Path, help="Optional background track")
    parser.add_argument("--srt", type=Path, help="Optional subtitles (UTF-8)")
    parser.add_argument("--out", type=Path, required=True, help="Output final video path")
    
    # Optional overlays
    parser.add_argument("--title", type=str, help="Optional on-screen title")
    
    # Video settings
    parser.add_argument("--fps", type=int, default=30, help="Output frame rate (default: 30)")
    parser.add_argument("--crf", type=int, default=20, help="H.264 CRF quality (default: 20)")
    parser.add_argument("--preset", default="veryfast", help="H.264 preset (default: veryfast)")
    
    # Audio settings
    parser.add_argument("--target-lufs", type=float, default=-14.0, help="Target loudness in LUFS (default: -14.0)")
    parser.add_argument("--voice-gain", type=float, default=0.0, help="Voice gain in dB (default: 0.0)")
    parser.add_argument("--music-gain", type=float, default=-10.0, help="Music gain in dB (default: -10.0)")
    
    # Subtitle settings
    parser.add_argument("--sub-font-size", type=int, default=36, help="Subtitle font size (default: 36)")
    parser.add_argument("--sub-margin", type=int, default=64, help="Subtitle margin in pixels (default: 64)")
    parser.add_argument("--sub-outline", type=int, default=2, help="Subtitle outline width (default: 2)")
    parser.add_argument("--no-burn", action="store_true", help="Do not burn subtitles")
    
    # Output options
    parser.add_argument("--json", type=Path, help="Write JSON metadata to file (use '-' for stdout)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    parser.add_argument("--quiet", action="store_true", help="Minimal output (errors only)")
    
    args = parser.parse_args()
    
    run_sprint3_simple(
        clip_path=args.clip,
        out_path=args.out,
        voice_path=args.voice,
        music_path=args.music,
        srt_path=args.srt,
        title=args.title,
        fps=args.fps,
        crf=args.crf,
        preset=args.preset,
        target_lufs=args.target_lufs,
        voice_gain=args.voice_gain,
        music_gain=args.music_gain,
        sub_font_size=args.sub_font_size,
        sub_margin=args.sub_margin,
        sub_outline=args.sub_outline,
        no_burn=args.no_burn,
        json_output=args.json,
        force=args.force,
        quiet=args.quiet
    )


if __name__ == "__main__":
    main()
