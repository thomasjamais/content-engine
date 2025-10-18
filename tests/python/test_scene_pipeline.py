#!/usr/bin/env python3
"""Test the scene detection and clip selection pipeline."""
import pytest
from pathlib import Path
import tempfile
import json
from unittest.mock import patch, MagicMock

# Add the services directory to the path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "vision"))

from scene_detector import detect_scenes, _probe_duration_seconds
from clip_selector import select_top_segments, _slice_into_windows, _score_window
from vertical_crop import export_vertical_clips
from utils import ensure_dir


class TestSceneDetector:
    def test_probe_duration_seconds(self):
        """Test video duration probing."""
        # Mock ffprobe output
        with patch('subprocess.run') as mock_run:
            mock_run.return_value.stdout = "120.5\n"
            mock_run.return_value.returncode = 0
            
            duration = _probe_duration_seconds(Path("test.mp4"))
            assert duration == 120.5
    
    def test_probe_duration_fallback(self):
        """Test fallback when ffprobe fails."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = FileNotFoundError()
            
            duration = _probe_duration_seconds(Path("test.mp4"))
            assert duration == 600.0
    
    def test_detect_scenes(self):
        """Test scene detection."""
        with patch('scene_detector._probe_duration_seconds') as mock_probe:
            mock_probe.return_value = 120.0
            
            scenes = detect_scenes(Path("test.mp4"))
            assert len(scenes) == 4  # 120 / 30 = 4 segments
            assert scenes[0] == (0.0, 30.0)
            assert scenes[-1] == (90.0, 120.0)


class TestClipSelector:
    def test_slice_into_windows(self):
        """Test window slicing."""
        scenes = [(0.0, 60.0), (60.0, 120.0)]
        windows = _slice_into_windows(scenes, min_s=15, max_s=30)
        
        assert len(windows) > 0
        for start, end, score in windows:
            assert 15 <= (end - start) <= 30
    
    def test_score_window(self):
        """Test window scoring."""
        score = _score_window(Path("test.mp4"), 10.0, 20.0)
        assert score > 0
    
    def test_select_top_segments(self):
        """Test top segment selection."""
        scenes = [(0.0, 60.0)]
        segments = select_top_segments(
            Path("test.mp4"), scenes, min_s=15, max_s=30, top_k=3
        )
        
        assert len(segments) <= 3
        for start, end, score in segments:
            assert 15 <= (end - start) <= 30


class TestUtils:
    def test_ensure_dir(self):
        """Test directory creation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            test_dir = Path(tmpdir) / "test" / "nested"
            ensure_dir(test_dir)
            assert test_dir.exists()
            assert test_dir.is_dir()


class TestIntegration:
    def test_full_pipeline_mock(self):
        """Test the full pipeline with mocked ffmpeg."""
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "input.mp4"
            output_dir = Path(tmpdir) / "output"
            
            # Create a dummy input file
            input_path.write_text("dummy video content")
            
            with patch('subprocess.run') as mock_run:
                mock_run.return_value.returncode = 0
                
                # Test the pipeline
                from ingest import run
                
                # This should not raise an exception
                run(input_path, output_dir, 12, 45, 5, dry_run=True)
                
                # Verify ffmpeg was called
                assert mock_run.called


if __name__ == "__main__":
    pytest.main([__file__])