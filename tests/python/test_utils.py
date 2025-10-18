"""
Shared utilities for testing the content-engine.
"""

import json
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, Optional


class TestContext:
    """Context manager for test environments with temporary directories."""
    
    def __init__(self, keep_files: bool = False):
        self.keep_files = keep_files
        self.temp_dir = None
        self.fixtures_dir = Path(__file__).parent.parent / "fixtures"
    
    def __enter__(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="content_engine_test_"))
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.temp_dir and not self.keep_files:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        elif self.temp_dir:
            print(f"Test files kept in: {self.temp_dir}")
    
    def get_fixture(self, name: str) -> Path:
        """Get path to a test fixture."""
        fixture_path = self.fixtures_dir / name
        if not fixture_path.exists():
            raise FileNotFoundError(f"Test fixture not found: {name}")
        return fixture_path
    
    def copy_fixture(self, name: str, dest_name: Optional[str] = None) -> Path:
        """Copy a fixture to the temp directory."""
        if dest_name is None:
            dest_name = name
        
        src = self.get_fixture(name)
        dest = self.temp_dir / dest_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.copy2(src, dest)
        return dest
    
    def create_temp_file(self, name: str, content: str) -> Path:
        """Create a temporary file with content."""
        path = self.temp_dir / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
        return path
    
    def create_temp_json(self, name: str, data: Dict[str, Any]) -> Path:
        """Create a temporary JSON file."""
        content = json.dumps(data, indent=2, ensure_ascii=False)
        return self.create_temp_file(name, content)


def assert_video_properties(video_path: Path, 
                          expected_width: int = 1080, 
                          expected_height: int = 1920,
                          expected_fps: float = 30.0,
                          tolerance: float = 0.1) -> Dict[str, Any]:
    """
    Assert video has expected properties using ffprobe.
    Returns the video properties for further validation.
    """
    import subprocess
    import json
    
    cmd = [
        'ffprobe', '-v', 'quiet', '-print_format', 'json',
        '-show_format', '-show_streams', str(video_path)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        # Find video stream
        video_stream = None
        audio_stream = None
        
        for stream in data['streams']:
            if stream['codec_type'] == 'video':
                video_stream = stream
            elif stream['codec_type'] == 'audio':
                audio_stream = stream
        
        assert video_stream is not None, "No video stream found"
        
        # Check dimensions
        width = int(video_stream['width'])
        height = int(video_stream['height'])
        
        assert width == expected_width, f"Expected width {expected_width}, got {width}"
        assert height == expected_height, f"Expected height {expected_height}, got {height}"
        
        # Check frame rate
        fps_str = video_stream['r_frame_rate']
        if '/' in fps_str:
            num, den = fps_str.split('/')
            fps = float(num) / float(den)
        else:
            fps = float(fps_str)
        
        assert abs(fps - expected_fps) <= tolerance, f"Expected FPS {expected_fps}±{tolerance}, got {fps}"
        
        # Check duration
        duration = float(data['format']['duration'])
        
        return {
            'width': width,
            'height': height,
            'fps': fps,
            'duration': duration,
            'has_audio': audio_stream is not None,
            'video_codec': video_stream.get('codec_name'),
            'audio_codec': audio_stream.get('codec_name') if audio_stream else None,
        }
        
    except subprocess.CalledProcessError as e:
        raise AssertionError(f"ffprobe failed: {e}")
    except json.JSONDecodeError as e:
        raise AssertionError(f"Failed to parse ffprobe output: {e}")


def assert_audio_properties(audio_path: Path,
                          expected_sample_rate: int = 44100,
                          expected_channels: int = 1) -> Dict[str, Any]:
    """
    Assert audio has expected properties using ffprobe.
    Returns the audio properties for further validation.
    """
    import subprocess
    import json
    
    cmd = [
        'ffprobe', '-v', 'quiet', '-print_format', 'json',
        '-show_format', '-show_streams', str(audio_path)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        # Find audio stream
        audio_stream = None
        for stream in data['streams']:
            if stream['codec_type'] == 'audio':
                audio_stream = stream
                break
        
        assert audio_stream is not None, "No audio stream found"
        
        # Check properties
        sample_rate = int(audio_stream['sample_rate'])
        channels = int(audio_stream['channels'])
        
        assert sample_rate == expected_sample_rate, f"Expected sample rate {expected_sample_rate}, got {sample_rate}"
        assert channels == expected_channels, f"Expected {expected_channels} channels, got {channels}"
        
        duration = float(data['format']['duration'])
        
        return {
            'sample_rate': sample_rate,
            'channels': channels,
            'duration': duration,
            'codec': audio_stream.get('codec_name'),
            'bit_rate': audio_stream.get('bit_rate'),
        }
        
    except subprocess.CalledProcessError as e:
        raise AssertionError(f"ffprobe failed: {e}")
    except json.JSONDecodeError as e:
        raise AssertionError(f"Failed to parse ffprobe output: {e}")


def assert_srt_format(srt_path: Path) -> list:
    """
    Validate SRT file format and return parsed subtitles.
    """
    import re
    
    content = srt_path.read_text(encoding='utf-8')
    
    # Basic SRT pattern: number, timecode, text, empty line
    pattern = r'(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n(.*?)\n\n'
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    assert len(matches) > 0, "No valid SRT entries found"
    
    subtitles = []
    for match in matches:
        seq, start_time, end_time, text = match
        
        # Validate sequence numbers are incremental
        assert int(seq) == len(subtitles) + 1, f"Non-sequential subtitle number: {seq}"
        
        # Validate time format and logic
        start_ms = parse_srt_time(start_time)
        end_ms = parse_srt_time(end_time)
        
        assert end_ms > start_ms, f"End time before start time in subtitle {seq}"
        
        subtitles.append({
            'sequence': int(seq),
            'start_time': start_time,
            'end_time': end_time,
            'start_ms': start_ms,
            'end_ms': end_ms,
            'text': text.strip(),
        })
    
    return subtitles


def parse_srt_time(time_str: str) -> int:
    """Parse SRT time string to milliseconds."""
    import re
    
    match = re.match(r'(\d{2}):(\d{2}):(\d{2}),(\d{3})', time_str)
    if not match:
        raise ValueError(f"Invalid SRT time format: {time_str}")
    
    hours, minutes, seconds, milliseconds = map(int, match.groups())
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds