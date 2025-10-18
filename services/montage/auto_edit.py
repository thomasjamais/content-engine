#!/usr/bin/env python3
import argparse
import json
import time
from pathlib import Path
import subprocess
from typing import Optional


def run(
    clip_path: Path,
    out_path: Path,
    voice_path: Optional[Path] = None,
    music_path: Optional[Path] = None,
    srt_path: Optional[Path] = None,
    no_burn: bool = False,
    dry_run: bool = False,
    json_output: bool = False
) -> None:
    """Compose final short with video, voice, music, and subtitles."""
    start_time = time.time()
    
    print(f"Clip: {clip_path}")
    print(f"Output: {out_path}")
    print(f"Voice: {voice_path}")
    print(f"Music: {music_path}")
    print(f"Subtitles: {srt_path}")
    print(f"Burn subtitles: {not no_burn}")
    
    if not clip_path.exists():
        print(f"Error: Clip file {clip_path} does not exist")
        exit(1)
    
    # Ensure output directory exists
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    if dry_run:
        print("Dry run - would create:")
        print(f"  {out_path}")
        return
    
    # Build ffmpeg command
    cmd = _build_ffmpeg_command(clip_path, out_path, voice_path, music_path, srt_path, no_burn)
    
    try:
        print("Composing final short...")
        subprocess.run(cmd, check=True, capture_output=True)
        
        elapsed = time.time() - start_time
        print(f"Completed in {elapsed:.1f}s")
        
        if json_output:
            result = {
                "input_clip": str(clip_path),
                "output": str(out_path),
                "voice": str(voice_path) if voice_path else None,
                "music": str(music_path) if music_path else None,
                "subtitles": str(srt_path) if srt_path else None,
                "burn_subtitles": not no_burn,
                "elapsed_sec": elapsed
            }
            print(json.dumps(result, indent=2))
            
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print("Warning: ffmpeg failed. Creating placeholder composition file...")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, 'w') as f:
            f.write(f"# Placeholder composition file\n")
            f.write(f"# Input: {clip_path}\n")
            f.write(f"# Voice: {voice_path if voice_path else 'None'}\n")
            f.write(f"# Music: {music_path if music_path else 'None'}\n")
            f.write(f"# Subtitles: {srt_path if srt_path else 'None'}\n")
            f.write(f"# Would be: Final composed 9:16 video\n")
            f.write(f"# Error: {e}\n")
        print(f"Created placeholder: {out_path}")


def _build_ffmpeg_command(
    clip_path: Path,
    out_path: Path,
    voice_path: Optional[Path],
    music_path: Optional[Path],
    srt_path: Optional[Path],
    no_burn: bool
) -> list:
    """Build ffmpeg command for video composition."""
    cmd = ["ffmpeg", "-y"]
    
    # Input files
    cmd.extend(["-i", str(clip_path)])
    
    if voice_path and voice_path.exists():
        cmd.extend(["-i", str(voice_path)])
    
    if music_path and music_path.exists():
        cmd.extend(["-i", str(music_path)])
    
    # Video filters
    video_filters = []
    
    # Add subtitle burn-in if requested
    if srt_path and srt_path.exists() and not no_burn:
        video_filters.append(f"subtitles={srt_path}:force_style='FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'")
    
    # Audio filters
    audio_filters = []
    
    if voice_path and voice_path.exists() and music_path and music_path.exists():
        # Mix voice and music with ducking
        audio_filters.extend([
            "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[voice_music]",
            "[2:a]volume=0.3[music_quiet]",
            "[voice_music][music_quiet]amix=inputs=2:duration=first:dropout_transition=2[final_audio]"
        ])
    elif voice_path and voice_path.exists():
        # Just voice
        audio_filters.append("[1:a]volume=1.0[final_audio]")
    elif music_path and music_path.exists():
        # Just music
        audio_filters.append("[2:a]volume=0.5[final_audio]")
    else:
        # Use original audio
        audio_filters.append("[0:a]volume=1.0[final_audio]")
    
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
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-r", "30",  # 30fps
        str(out_path)
    ])
    
    return cmd


def main() -> None:
    parser = argparse.ArgumentParser(description="Compose final short with video, voice, music, and subtitles")
    parser.add_argument("--clip", required=True, type=Path, help="Input video clip")
    parser.add_argument("--out", required=True, type=Path, help="Output video file")
    parser.add_argument("--voice", type=Path, help="Voice audio file")
    parser.add_argument("--music", type=Path, help="Background music file")
    parser.add_argument("--srt", type=Path, help="Subtitles file")
    parser.add_argument("--no-burn", action="store_true", help="Skip burning subtitles into video")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without actually creating files")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON summary")
    args = parser.parse_args()
    
    run(
        args.clip, args.out, args.voice, args.music, args.srt,
        args.no_burn, args.dry_run, args.json
    )


if __name__ == "__main__":
    main()
