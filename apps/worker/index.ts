#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateNarration } from "../../packages/ai/text";
import { synthesizeVoice } from "../../services/tts/voice_gen";

export type PipelineConfig = {
  inputVideo: string;
  outputDir: string;
  minDuration: number;
  maxDuration: number;
  topClips: number;
  lang: "fr" | "en";
  style: "zen" | "adventure";
  ttsProvider?: "elevenlabs" | "openai" | "beep";
  aiProvider?: "openai" | "gemini";
};

export async function runPipeline(config: PipelineConfig): Promise<void> {
  const startTime = Date.now();
  console.log("🚀 Starting content-engine pipeline...");
  console.log(`Input: ${config.inputVideo}`);
  console.log(`Output: ${config.outputDir}`);

  // Ensure output directories exist
  await fs.mkdir(path.join(config.outputDir, "clips"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "tts"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "subs"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "shorts"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "music"), { recursive: true });

  try {
    // Step 1: Ingest video and create clips
    console.log("\n📹 Step 1: Ingesting video and creating clips...");
    await runCommand("python3", [
      "services/vision/ingest.py",
      "--input",
      config.inputVideo,
      "--out",
      path.join(config.outputDir, "clips"),
      "--min",
      config.minDuration.toString(),
      "--max",
      config.maxDuration.toString(),
      "--top",
      config.topClips.toString(),
      "--json",
    ]);

    // Step 2: Generate narration for each clip
    console.log("\n🤖 Step 2: Generating narration for clips...");
    const clips = await getClipsList(path.join(config.outputDir, "clips"));

    for (const clip of clips) {
      console.log(`Processing ${clip.name}...`);

      // Generate narration
      const narration = await generateNarration({
        lang: config.lang,
        style: config.style,
        durationSec: clip.duration,
        context: "diving underwater",
      });

      // Save narration metadata
      const metadataPath = path.join(
        config.outputDir,
        "subs",
        `${clip.baseName}.json`
      );
      await fs.writeFile(metadataPath, JSON.stringify(narration, null, 2));

      // Generate voice
      const voicePath = path.join(
        config.outputDir,
        "tts",
        `${clip.baseName}.wav`
      );
      await synthesizeVoice({
        text: narration.narration,
        outPath: voicePath,
        provider: config.ttsProvider,
      });

      // Generate subtitles (simple timing for now)
      const srtPath = path.join(
        config.outputDir,
        "subs",
        `${clip.baseName}.srt`
      );
      await generateSubtitles(narration.narration, clip.duration, srtPath);
    }

    // Step 3: Compose final shorts
    console.log("\n🎬 Step 3: Composing final shorts...");
    for (const clip of clips) {
      const clipPath = path.join(config.outputDir, "clips", clip.name);
      const voicePath = path.join(
        config.outputDir,
        "tts",
        `${clip.baseName}.wav`
      );
      const srtPath = path.join(
        config.outputDir,
        "subs",
        `${clip.baseName}.srt`
      );
      const musicPath = path.join(config.outputDir, "music", "ambient01.mp3");
      const outputPath = path.join(
        config.outputDir,
        "shorts",
        `${clip.baseName}_final.mp4`
      );

      await runCommand("python3", [
        "services/montage/auto_edit.py",
        "--clip",
        clipPath,
        "--voice",
        voicePath,
        "--srt",
        srtPath,
        "--music",
        musicPath,
        "--out",
        outputPath,
      ]);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Pipeline completed in ${elapsed.toFixed(1)}s`);
    console.log(`📁 Output files in: ${config.outputDir}`);
  } catch (error) {
    console.error("❌ Pipeline failed:", error);
    process.exit(1);
  }
}

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

async function getClipsList(
  clipsDir: string
): Promise<Array<{ name: string; baseName: string; duration: number }>> {
  const files = await fs.readdir(clipsDir);
  const clips = files
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => ({
      name: f,
      baseName: path.parse(f).name,
      duration: 30, // TODO: get actual duration from video
    }));

  return clips;
}

async function generateSubtitles(
  text: string,
  duration: number,
  outputPath: string
): Promise<void> {
  // Simple subtitle generation - split text into sentences and distribute over duration
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const timePerSentence = duration / sentences.length;

  let srt = "";
  let startTime = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const endTime = Math.min(startTime + timePerSentence, duration);
    const startSrt = formatSrtTime(startTime);
    const endSrt = formatSrtTime(endTime);

    srt += `${i + 1}\n${startSrt} --> ${endSrt}\n${sentence}\n\n`;
    startTime = endTime;
  }

  await fs.writeFile(outputPath, srt, "utf8");
}

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node apps/worker/index.js <input-video> [options]

Options:
  --output-dir <dir>     Output directory (default: ./samples)
  --min-duration <sec>   Minimum clip duration (default: 12)
  --max-duration <sec>   Maximum clip duration (default: 45)
  --top-clips <num>      Number of top clips (default: 8)
  --lang <lang>          Language: fr|en (default: en)
  --style <style>        Style: zen|adventure (default: zen)
  --tts-provider <prov>  TTS provider: elevenlabs|openai|beep (default: beep)
  --ai-provider <prov>   AI provider: openai|gemini (default: openai)
  --help                 Show this help
    `);
    process.exit(0);
  }

  const inputVideo = args[0];
  const outputDir = getArg(args, "--output-dir") || "./samples";
  const minDuration = parseInt(getArg(args, "--min-duration") || "12");
  const maxDuration = parseInt(getArg(args, "--max-duration") || "45");
  const topClips = parseInt(getArg(args, "--top-clips") || "8");
  const lang = (getArg(args, "--lang") || "en") as "fr" | "en";
  const style = (getArg(args, "--style") || "zen") as "zen" | "adventure";
  const ttsProvider = getArg(args, "--tts-provider") as
    | "elevenlabs"
    | "openai"
    | "beep";
  const aiProvider = getArg(args, "--ai-provider") as "openai" | "gemini";

  const config: PipelineConfig = {
    inputVideo,
    outputDir,
    minDuration,
    maxDuration,
    topClips,
    lang,
    style,
    ttsProvider,
    aiProvider,
  };

  runPipeline(config).catch(console.error);
}

function getArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

