#!/usr/bin/env python3
"""
Generate test fixtures for the test suite.
Creates small video clips, audio files, and SRT files for testing.
"""

import os
import subprocess
import tempfile
from pathlib import Path


def create_test_video(output_path: Path, duration: int = 5, width: int = 1080, height: int = 1920):
    """Create a test video file using ffmpeg."""
    cmd = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', f'testsrc2=duration={duration}:size={width}x{height}:rate=30',
        '-f', 'lavfi',
        '-i', f'sine=frequency=440:duration={duration}',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        str(output_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"✅ Created test video: {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create video: {e}")
        raise


def create_test_audio(output_path: Path, duration: int = 5, sample_rate: int = 44100):
    """Create a test audio file using ffmpeg."""
    cmd = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', f'sine=frequency=220:duration={duration}',
        '-ar', str(sample_rate),
        '-ac', '1',  # mono
        str(output_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"✅ Created test audio: {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create audio: {e}")
        raise


def create_test_srt(output_path: Path, duration: int = 5):
    """Create a test SRT subtitle file."""
    content = f"""1
00:00:00,000 --> 00:00:02,500
This is a test subtitle

2
00:00:02,500 --> 00:00:{duration:02d},000
Second test subtitle line
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Created test SRT: {output_path}")


def create_test_metadata(output_path: Path):
    """Create test metadata JSON."""
    content = """{
  "title": "Test Diving Video",
  "narration": "This is a test narration for our diving video. It contains exactly the right amount of words to test our pipeline. The narration describes underwater scenes with vibrant coral reefs and marine life swimming gracefully through crystal clear waters.",
  "caption": "Experience the beauty of underwater exploration. Discover the serenity beneath the waves.",
  "hashtags": ["#diving", "#ocean", "#underwater", "#test", "#meditation", "#nature", "#marine", "#serenity", "#peaceful", "#exploration", "#adventure", "#zen"]
}"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Created test metadata: {output_path}")


def main():
    """Create all test fixtures."""
    fixtures_dir = Path(__file__).parent
    fixtures_dir.mkdir(exist_ok=True)
    
    print("🎬 Generating test fixtures...")
    
    # Create test video (5 seconds, vertical)
    create_test_video(fixtures_dir / "test_clip.mp4", duration=5)
    
    # Create test audio (5 seconds, mono, 44.1kHz)
    create_test_audio(fixtures_dir / "test_voice.wav", duration=5)
    
    # Create test music (3 seconds for background)
    create_test_audio(fixtures_dir / "test_music.mp3", duration=3)
    
    # Create test subtitles
    create_test_srt(fixtures_dir / "test_subtitles.srt", duration=5)
    
    # Create test metadata
    create_test_metadata(fixtures_dir / "test_metadata.json")
    
    print("\n✅ All test fixtures created successfully!")
    print(f"📁 Location: {fixtures_dir}")
    
    # List created files with sizes
    print("\n📋 Generated files:")
    for file in fixtures_dir.glob("test_*"):
        size = file.stat().st_size
        print(f"  {file.name}: {size:,} bytes")


if __name__ == "__main__":
    main()