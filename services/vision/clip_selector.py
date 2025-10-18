from pathlib import Path
from typing import List, Tuple
import subprocess
import json


Segment = Tuple[float, float]
Scored = Tuple[float, float, float] # start, end, score


def select_top_segments(input_path: Path, scenes: List[Segment], *, min_s: int, max_s: int, top_k: int) -> List[Scored]:
    """
    Slice scenes into candidate windows, score them, and return top_k windows within [min_s, max_s].
    TODO: score by motion, color variance, and simple object presence.
    """
    candidates: List[Scored] = _slice_into_windows(scenes, min_s, max_s)
    # TODO: compute real scores; currently uniform
    scored = [(s, e, _score_window(input_path, s, e)) for s, e, _ in candidates]
    scored.sort(key=lambda x: x[2], reverse=True)
    return scored[:top_k]


def _slice_into_windows(scenes: List[Segment], min_s: int, max_s: int) -> List[Scored]:
    """Generate windows of size between min_s and max_s with stride."""
    out: List[Scored] = []
    for start, end in scenes:
        length = end - start
        if length <= 0:
            continue
        
        # Generate multiple windows with stride
        stride = min_s // 2  # 50% overlap
        current_start = start
        
        while current_start + min_s <= end:
            window_end = min(current_start + max_s, end)
            if window_end - current_start >= min_s:
                out.append((current_start, window_end, 0.0))
            current_start += stride
    
    return out


def _score_window(input_path: Path, start: float, end: float) -> float:
    """
    Compute score via motion energy / HSV var / YOLO fish presence.
    TODO: implement real scoring with OpenCV analysis
    """
    # Simple heuristic: prefer longer clips with some randomness
    duration = end - start
    base_score = duration * 0.1
    
    # Add some variation to avoid identical scores
    import random
    variation = random.uniform(0.8, 1.2)
    
    return base_score * variation