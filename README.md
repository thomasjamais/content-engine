# Content Engine

A video-to-shorts pipeline for diving content that transforms long diving videos into social-ready shorts with AI-generated narration, voice synthesis, and automatic editing.

🎬 **Turn your long-form diving footage into engaging social media shorts automatically** - from raw video input to polished 9:16 vertical videos with AI narration, subtitles, and background music.

## 🎯 Features

- **Video Processing**: Automatic scene detection, clip selection, and vertical cropping
- **AI Content Generation**: Narration, captions, and hashtags using OpenAI/Gemini
- **Voice Synthesis**: TTS integration with ElevenLabs, OpenAI, or beep fallback
- **Auto Editing**: Video composition with voice, music, and burned-in subtitles
- **Social Publishing**: Stub integrations for TikTok, YouTube, and Instagram
- **CLI-First**: Every step has a runnable CLI with clear arguments and logs

## 🏗️ Architecture

```
content-engine/
├── apps/
│   ├── dashboard/          # Next.js dashboard (Sprint 4)
│   └── worker/             # Orchestration worker
├── services/
│   ├── vision/             # Python: video processing
│   ├── tts/                # Node: voice synthesis
│   ├── montage/            # Python: video composition
│   └── scheduler/          # Node: publishing stubs
├── packages/
│   ├── core/               # Shared types and prompts
│   └── ai/                 # LLM wrappers
└── samples/                # Raw videos, clips, shorts
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- Python 3.11
- ffmpeg (in PATH)
- pnpm (recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp env.example .env.local

# Edit .env.local with your API keys
```

### Environment Setup

Edit `.env.local` with your API keys:

```bash
# Required for AI text generation
OPENAI_API_KEY=your_key_here
# or
GEMINI_API_KEY=your_key_here

# Optional for TTS (falls back to beep if not configured)
ELEVENLABS_API_KEY=your_key_here
```

### Basic Usage

```bash
# Run the complete pipeline
pnpm run pipeline ./samples/raw/video1.mp4

# Or run individual steps
pnpm run ingest                    # Extract clips
pnpm run ai:text                   # Generate narration
pnpm run tts                       # Synthesize voice
pnpm run subtitles                 # Create subtitles
pnpm run build:short               # Compose final video
```

## 📋 Available Scripts

### Pipeline Commands
- `pnpm run pipeline <video>` - Run complete pipeline
- `pnpm run pipeline:help` - Show pipeline options

### Individual Steps
- `pnpm run ingest` - Extract video clips
- `pnpm run ai:text` - Generate AI narration
- `pnpm run tts` - Test voice synthesis
- `pnpm run subtitles` - Generate subtitles
- `pnpm run build:short` - Compose final video

### Development
- `pnpm run dev:dashboard` - Start dashboard
- `pnpm run dev:worker` - Start worker
- `pnpm run test` - Run TypeScript tests
- `pnpm run test:python` - Run Python tests

## 🎬 Pipeline Overview

1. **Ingest**: Detect scenes and extract 9:16 vertical clips
2. **AI Generation**: Create narration, captions, and hashtags
3. **Voice Synthesis**: Generate voiceover audio
4. **Subtitles**: Create SRT files with timing
5. **Composition**: Mix video, voice, music, and subtitles
6. **Publishing**: Export to social platforms (stubs)

## 🔧 Configuration

### Video Processing
- **Min/Max Duration**: 12-45 seconds (configurable)
- **Aspect Ratio**: 9:16 (1080×1920)
- **Frame Rate**: 30fps
- **Codec**: H.264 + AAC

### AI Content
- **Languages**: English, French
- **Styles**: Zen, Adventure
- **Providers**: OpenAI, Gemini (with fallbacks)

### TTS Options
- **Providers**: ElevenLabs, OpenAI, Beep (fallback)
- **Format**: WAV, 44.1kHz
- **Fallback**: Generated beep tones

## 🧪 Testing

```bash
# Generate test fixtures (one-time setup)
pnpm run test:fixtures

# Run comprehensive smoke test
pnpm run test:smoke

# Run unit tests
pnpm run test              # TypeScript/JavaScript tests
pnpm run test:python       # Python tests

# Test individual components
pnpm run ai:text           # Test AI generation
pnpm run tts              # Test voice synthesis
```

### Test Structure
```
tests/
├── fixtures/              # Test media files and data
├── python/                # Python unit tests
├── typescript/            # TypeScript test utilities
└── integration/           # End-to-end smoke tests
```

## 📁 Output Structure

```
samples/
├── raw/           # Input videos
├── clips/         # Extracted 9:16 clips
├── tts/           # Generated voice files
├── subs/          # SRT subtitle files
├── shorts/        # Final composed videos
└── music/         # Background music
```

## 🔌 API Integration

### Required APIs
- **OpenAI** or **Gemini**: For text generation
- **ElevenLabs** (optional): For high-quality TTS

### Optional APIs
- **Mubert**: For royalty-free music
- **Whisper**: For audio transcription

## 🚧 Development Status

### ✅ Completed (MVP)
- [x] Video ingestion and clip extraction
- [x] AI text generation with fallbacks
- [x] TTS with beep fallback
- [x] Subtitle generation
- [x] Video composition
- [x] CLI interfaces
- [x] Basic testing

### 🔄 In Progress
- [ ] Real scene detection (PySceneDetect)
- [ ] Motion-based clip scoring
- [ ] Advanced subtitle timing

### 📋 Future (Post-MVP)
- [ ] Dashboard UI
- [ ] Real social publishing
- [ ] Advanced ML features
- [ ] Batch processing

## 🤝 Contributing

1. Follow the monorepo structure
2. Keep Python services pure (no Node deps)
3. Keep Node services pure (no Python deps)
4. Add tests for new features
5. Update CLI help and documentation

## 📄 License

ISC

