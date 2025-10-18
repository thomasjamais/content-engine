#!/usr/bin/env python3
"""Simple test for Sprint 2 components."""

import sys
import os
from pathlib import Path

# Add the services directory to the path
sys.path.insert(0, str(Path(__file__).parent / "services" / "vision"))

from subtitles import generate_from_text, format_srt_time

def test_format_srt_time():
    """Test SRT timestamp formatting."""
    assert format_srt_time(0.0) == "00:00:00,000"
    assert format_srt_time(1.5) == "00:00:01,500"
    assert format_srt_time(65.123) == "00:01:05,123"
    print("✅ format_srt_time tests passed")

def test_generate_from_text():
    """Test text-based subtitle generation."""
    import tempfile
    
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
        
        print("✅ generate_from_text tests passed")

def main():
    """Run all tests."""
    print("🧪 Testing Sprint 2 components...")
    
    try:
        test_format_srt_time()
        test_generate_from_text()
        print("\n✅ All Sprint 2 tests passed!")
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
