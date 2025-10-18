#!/usr/bin/env python3
import argparse
import json
import time
from pathlib import Path
import sys
import os

# Add the services/vision directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scene_detector import detect_scenes
from clip_selector import select_top_segments
from vertical_crop import export_vertical_clips
from utils import ensure_dir


def run(input_path: Path, out_dir: Path, min_s: int, max_s: int, top_k: int, dry_run: bool = False, json_output: bool = False) -> None:
    """Ingest a long video and export vertical clips."""
    start_time = time.time()
    
    print(f"Input: {input_path}")
    print(f"Output: {out_dir}")
    print(f"Duration: {min_s}-{max_s}s, top {top_k} clips")
    
    if not input_path.exists():
        print(f"Error: Input file {input_path} does not exist")
        exit(1)
    
    ensure_dir(out_dir)
    
    # Detect scenes
    print("Detecting scenes...")
    scenes = detect_scenes(input_path)
    print(f"Found {len(scenes)} scenes")
    
    # Select top segments
    print("Selecting top segments...")
    segments = select_top_segments(input_path, scenes, min_s=min_s, max_s=max_s, top_k=top_k)
    print(f"Selected {len(segments)} segments")
    
    if dry_run:
        print("Dry run - would create:")
        for i, (start, end, score) in enumerate(segments):
            print(f"  clip{i+1:02d}.mp4: {start:.1f}s-{end:.1f}s (score: {score:.2f})")
        return
    
    # Export vertical clips
    print("Exporting vertical clips...")
    output_files = export_vertical_clips(input_path, segments, out_dir)
    
    elapsed = time.time() - start_time
    print(f"Completed in {elapsed:.1f}s")
    
    if json_output:
        result = {
            "input": str(input_path),
            "output_dir": str(out_dir),
            "clips": [
                {
                    "filename": f.name,
                    "start_sec": start,
                    "end_sec": end,
                    "duration_sec": end - start,
                    "score": score
                }
                for f, (start, end, score) in zip(output_files, segments)
            ],
            "elapsed_sec": elapsed
        }
        print(json.dumps(result, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest a long video and export vertical clips")
    parser.add_argument("--input", required=True, type=Path, help="Input video file")
    parser.add_argument("--out", required=True, type=Path, help="Output directory")
    parser.add_argument("--min", dest="min_s", default=12, type=int, help="Minimum clip duration (seconds)")
    parser.add_argument("--max", dest="max_s", default=45, type=int, help="Maximum clip duration (seconds)")
    parser.add_argument("--top", dest="top_k", default=10, type=int, help="Number of top clips to select")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without actually creating files")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON summary")
    args = parser.parse_args()
    
    run(args.input, args.out, args.min_s, args.max_s, args.top_k, args.dry_run, args.json)


if __name__ == "__main__":
    main()