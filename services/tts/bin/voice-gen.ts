#!/usr/bin/env node
/**
 * Sprint 2: TTS Voice Generation CLI
 * Usage: pnpm tts:gen --text-file samples/meta/clip01.txt --out samples/tts/clip01.wav --voice-id "<id>"
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { synthesizeVoice } from "../voice_gen";

interface CLIArgs {
  textFile?: string;
  text?: string;
  out: string;
  voiceId?: string;
  force: boolean;
  sampleRate: number;
}

async function main() {
  const args = parseArgs();

  console.log("🗣️  Generating voice synthesis...");
  console.log(`Output: ${args.out}`);
  console.log(`Sample rate: ${args.sampleRate}Hz`);
  if (args.voiceId) console.log(`Voice ID: ${args.voiceId}`);

  try {
    // Read text content
    let text: string;
    if (args.textFile) {
      if (!(await fileExists(args.textFile))) {
        console.error(`❌ Text file not found: ${args.textFile}`);
        process.exit(1);
      }
      text = await fs.readFile(args.textFile, "utf8");
      console.log(`📄 Text from file: ${args.textFile}`);
    } else if (args.text) {
      text = args.text;
      console.log(`📄 Text from argument: ${text.substring(0, 50)}...`);
    } else {
      console.error("❌ Either --text-file or --text is required");
      process.exit(1);
    }

    // Check if output exists
    if (!args.force && (await fileExists(args.out))) {
      console.log(
        `⚠️  Output file exists: ${args.out} (use --force to overwrite)`
      );
      return;
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(args.out), { recursive: true });

    // Generate voice
    const startTime = Date.now();
    const result = await synthesizeVoice({
      text,
      voiceId: args.voiceId,
      outPath: args.out,
    });
    const elapsed = (Date.now() - startTime) / 1000;

    console.log(`✅ Voice generated: ${result}`);
    console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}s`);

    // Validate output file
    const stats = await fs.stat(result);
    if (stats.size < 1000) {
      console.warn("⚠️  Output file is very small - may be a placeholder");
    }
  } catch (error) {
    console.error("❌ Voice generation failed:", error);
    process.exit(1);
  }
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: pnpm tts:gen [options]

Options:
  --text-file <path>   Read text from file (e.g., samples/meta/clip01.txt)
  --text <string>      Text content directly
  --out <path>         Output WAV file path (required)
  --voice-id <id>      Voice ID for TTS provider
  --force              Overwrite existing files
  --sample-rate <hz>   Sample rate (default: 44100)
  --help               Show this help

Examples:
  pnpm tts:gen --text-file samples/meta/clip01.txt --out samples/tts/clip01.wav
  pnpm tts:gen --text "Hello world" --out samples/tts/test.wav --voice-id "21m00Tcm4TlvDq8ikWAM"
    `);
    process.exit(0);
  }

  const textFile = getArg(args, "--text-file");
  const text = getArg(args, "--text");
  const out = getArg(args, "--out");
  const voiceId = getArg(args, "--voice-id");
  const force = args.includes("--force");
  const sampleRate = parseInt(getArg(args, "--sample-rate") || "44100");

  if (!out) {
    console.error("❌ --out is required");
    process.exit(1);
  }
  if (!textFile && !text) {
    console.error("❌ Either --text-file or --text is required");
    process.exit(1);
  }
  if (textFile && text) {
    console.error("❌ Cannot specify both --text-file and --text");
    process.exit(1);
  }

  return { textFile, text, out, voiceId, force, sampleRate };
}

function getArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
