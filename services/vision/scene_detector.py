from pathlib import Path
from typing import List, Tuple
import subprocess
import json


# Optional: import scenedetect or OpenCV-based histogram diffs
# import cv2


Segment = Tuple[float, float] # (start_sec, end_sec)


def detect_scenes(input_path: Path) -> List[Segment]:
    """
    Returns a coarse list of scene segments (start_sec, end_sec).
    TODO: Replace stub heuristic with PySceneDetect or histogram diff on frames.
    """
    duration = _probe_duration_seconds(input_path)
    
    # Simple heuristic: split video into 30-second segments
    # TODO: implement real scene detection with PySceneDetect
    segments = []
    segment_duration = 30.0
    
    for start in range(0, int(duration), int(segment_duration)):
        end = min(start + segment_duration, duration)
        segments.append((float(start), float(end)))
    
    return segments


def _probe_duration_seconds(input_path: Path) -> float:
    """Get video duration using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(input_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
        print("Warning: Could not probe video duration, assuming 600 seconds")
        return 600.0