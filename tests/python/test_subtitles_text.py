#!/usr/bin/env python3
"""Sprint 2: Test subtitles generation from text."""
import pytest
import tempfile
from pathlib import Path
import sys
import os

# Add the services directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "vision"))

from subtitles import generate_srt, generate_from_text, format_srt_time


class TestSubtitlesText:
    def test_format_srt_time(self):
        """Test SRT timestamp formatting."""
        assert format_srt_time(0.0) == "00:00:00,000"
        assert format_srt_time(1.5) == "00:00:01,500"
        assert format_srt_time(65.123) == "00:01:05,123"
        assert format_srt_time(3661.456) == "01:01:01,456"

    def test_generate_from_text_basic(self):
        """Test basic text-based subtitle generation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            srt_path = Path(tmpdir) / "test.srt"
            text = "This is a test narration. It has multiple sentences. Each should be timed properly."
            duration = 20.0
            
            generate_from_text(text, duration, srt_path)
            
            assert srt_path.exists()
            
            # Read and validate SRT content
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Should have subtitle entries
            assert "1\n" in content
            assert "2\n" in content
            assert "This is a test narration" in content
            assert "It has multiple sentences" in content

    def test_generate_from_text_timing(self):
        """Test subtitle timing for 20s clip."""
        with tempfile.TemporaryDirectory() as tmpdir:
            srt_path = Path(tmpdir) / "test.srt"
            text = "First sentence. Second sentence. Third sentence."
            duration = 20.0
            
            generate_from_text(text, duration, srt_path)
            
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check timing - should be distributed over 20 seconds
            lines = content.split('\n')
            timing_lines = [line for line in lines if '-->' in line]
            
            # Should have 3 timing entries
            assert len(timing_lines) == 3
            
            # First should start at 00:00:00
            assert timing_lines[0].startswith("00:00:00")
            
            # Last should end around 20 seconds
            assert "00:00:20" in timing_lines[-1] or "00:00:19" in timing_lines[-1]

    def test_generate_from_text_duration_validation(self):
        """Test that subtitle durations are within valid range."""
        with tempfile.TemporaryDirectory() as tmpdir:
            srt_path = Path(tmpdir) / "test.srt"
            text = "Short. Medium length sentence. Very long sentence that should be properly timed and distributed."
            duration = 30.0
            
            generate_from_text(text, duration, srt_path)
            
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse timing and validate durations
            lines = content.split('\n')
            timing_lines = [line for line in lines if '-->' in line]
            
            for timing in timing_lines:
                start_str, end_str = timing.split(' --> ')
                
                # Parse times (simplified)
                start_sec = self._parse_srt_time(start_str)
                end_sec = self._parse_srt_time(end_str)
                duration_sec = end_sec - start_sec
                
                # Duration should be within valid range (1.6-4.0s)
                assert duration_sec >= 1.6
                assert duration_sec <= 4.0

    def test_generate_from_text_empty_sentences(self):
        """Test handling of empty sentences."""
        with tempfile.TemporaryDirectory() as tmpdir:
            srt_path = Path(tmpdir) / "test.srt"
            text = "Valid sentence. . Empty sentence. Another valid sentence."
            duration = 15.0
            
            generate_from_text(text, duration, srt_path)
            
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Should not contain empty subtitles
            assert "Empty sentence" not in content
            assert "Valid sentence" in content
            assert "Another valid sentence" in content

    def _parse_srt_time(self, time_str):
        """Parse SRT time format to seconds."""
        time_part, ms_part = time_str.split(',')
        h, m, s = map(int, time_part.split(':'))
        ms = int(ms_part)
        return h * 3600 + m * 60 + s + ms / 1000.0

    def test_generate_srt_integration(self):
        """Test full generate_srt function with from-text mode."""
        with tempfile.TemporaryDirectory() as tmpdir:
            clip_path = Path(tmpdir) / "test.mp4"
            srt_path = Path(tmpdir) / "test.srt"
            
            # Create dummy clip file
            clip_path.write_text("dummy video")
            
            text = "Integration test narration. Should work end to end."
            
            # This should not raise an exception
            generate_srt(clip_path, srt_path, "from-text", text)
            
            assert srt_path.exists()


if __name__ == "__main__":
    pytest.main([__file__])
