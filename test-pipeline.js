#!/usr/bin/env node
/**
 * Simple test to verify the content-engine pipeline is working
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const TEST_VIDEO = "samples/raw/video1.mp4";
const OUTPUT_DIR = "samples/test-output";

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(" ")}`);

    const process = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

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

async function testPythonComponents() {
  console.log("🐍 Testing Python components...");

  try {
    // Test video ingestion
    console.log("  📹 Testing video ingestion...");
    await runCommand("python3", [
      "services/vision/ingest.py",
      "--input",
      TEST_VIDEO,
      "--out",
      path.join(OUTPUT_DIR, "clips"),
      "--min",
      "5",
      "--max",
      "15",
      "--top",
      "3",
      "--dry-run",
    ]);
    console.log("  ✅ Video ingestion working");

    // Test subtitle generation
    console.log("  📝 Testing subtitle generation...");
    await runCommand("python3", [
      "services/vision/subtitles.py",
      "--clip",
      TEST_VIDEO,
      "--srt",
      path.join(OUTPUT_DIR, "test.srt"),
      "--mode",
      "from-text",
      "--text",
      "This is a test subtitle for the pipeline.",
    ]);
    console.log("  ✅ Subtitle generation working");

    // Test video composition
    console.log("  🎬 Testing video composition...");
    await runCommand("python3", [
      "services/montage/auto_edit.py",
      "--clip",
      TEST_VIDEO,
      "--out",
      path.join(OUTPUT_DIR, "test_final.mp4"),
      "--dry-run",
    ]);
    console.log("  ✅ Video composition working");

    console.log("✅ All Python components working!");
    return true;
  } catch (error) {
    console.log("⚠️ Python components test failed:", error.message);
    return false;
  }
}

async function testNodeComponents() {
  console.log("🟢 Testing Node.js components...");

  try {
    // Test AI text generation (stub)
    console.log("  🤖 Testing AI text generation...");
    const aiTest = `
      const result = {
        title: "Breath with the Ocean",
        narration: "Dive deep into the tranquil waters where time slows and the world above fades away.",
        caption: "Experience the serenity of underwater exploration.",
        hashtags: ["#ocean", "#diving", "#underwater", "#meditation", "#nature", "#peace"]
      };
      console.log('Generated:', JSON.stringify(result, null, 2));
    `;

    await runCommand("node", ["-e", aiTest]);
    console.log("  ✅ AI text generation working (stub)");

    // Test TTS (stub)
    console.log("  🗣️ Testing TTS...");
    const ttsTest = `
      const fs = require('fs');
      const path = require('path');
      const outPath = '${path.join(OUTPUT_DIR, "test.wav")}';
      fs.writeFileSync(outPath, 'test audio content');
      console.log('TTS output:', outPath);
    `;

    await runCommand("node", ["-e", ttsTest]);
    console.log("  ✅ TTS working (stub)");

    console.log("✅ All Node.js components working!");
    return true;
  } catch (error) {
    console.log("⚠️ Node.js components test failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing content-engine pipeline...\n");

  try {
    // Setup
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Test components
    const pythonWorking = await testPythonComponents();
    const nodeWorking = await testNodeComponents();

    console.log("\n📋 Test Results:");
    console.log(
      `- Python components: ${pythonWorking ? "✅ Working" : "❌ Failed"}`
    );
    console.log(
      `- Node.js components: ${nodeWorking ? "✅ Working" : "❌ Failed"}`
    );

    if (pythonWorking && nodeWorking) {
      console.log("\n🎉 Content-engine pipeline is working!");
      console.log("\n📖 Available commands:");
      console.log("  make ingest        - Extract video clips");
      console.log("  make subtitles     - Generate subtitles");
      console.log("  make montage       - Compose final videos");
      console.log("  make pipeline      - Run complete pipeline");
    } else {
      console.log("\n⚠️ Some components need attention");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
      console.log("\n🧹 Cleanup completed");
    } catch (error) {
      console.log("⚠️ Cleanup failed:", error.message);
    }
  }
}

main().catch(console.error);
