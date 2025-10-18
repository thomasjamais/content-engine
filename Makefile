# Content Engine Makefile

.PHONY: help install test clean pipeline smoke-test

help:
	@echo "Content Engine - Video to Shorts Pipeline"
	@echo ""
	@echo "Available commands:"
	@echo "  install       Install dependencies"
	@echo "  test          Run all tests"
	@echo "  clean         Clean build artifacts"
	@echo "  pipeline      Run complete pipeline on sample video"
	@echo "  smoke-test    Run end-to-end smoke test"
	@echo "  ingest        Extract clips from video"
	@echo "  ai:text       Test AI text generation"
	@echo "  tts            Test voice synthesis"
	@echo "  subtitles     Test subtitle generation"
	@echo "  montage        Test video composition"

install:
	pnpm install

test:
	pnpm run test
	pnpm run test:python

clean:
	rm -rf node_modules
	rm -rf samples/clips samples/shorts samples/tts samples/subs
	rm -rf .out

pipeline:
	pnpm run pipeline ./samples/raw/video1.mp4

smoke-test:
	node scripts/smoke-test.js

ingest:
	pnpm run ingest

ai-text:
	pnpm run ai:text

tts:
	pnpm run tts

subtitles:
	pnpm run subtitles

montage:
	pnpm run build:short

# Individual pipeline steps
clips: ingest
voice: ai-text tts
subs: subtitles
final: montage

# Quick development workflow
dev: install
	@echo "Development environment ready!"
	@echo "Run 'make pipeline' to test the complete pipeline"
	@echo "Run 'make smoke-test' for end-to-end testing"

# Legacy commands
run-worker: 
	pnpm --filter @engine/worker dev

run-dashboard:
	pnpm --filter @engine/dashboard dev

build-shorts:
	pnpm run build:short