#!/usr/bin/env node
/**
 * Sprint 2: Text Generation CLI
 * Usage: pnpm ai:gen --clip samples/clips/clip01.mp4 --lang fr --style zen --duration 20 --context "banc de barracudas, eau claire"
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { generateNarration } from "../text";

interface CLIArgs {
  clip: string;
  lang: "fr" | "en";
  style: "zen" | "adventure";
  duration: number;
  context?: string;
  jsonOut?: string;
  force: boolean;
  quiet: boolean;
}

async function main() {
  const args = parseArgs();

  if (!args.quiet) {
    console.log("🤖 Generating AI narration...");
    console.log(`Clip: ${args.clip}`);
    console.log(`Language: ${args.lang}`);
    console.log(`Style: ${args.style}`);
    console.log(`Duration: ${args.duration}s`);
    if (args.context) console.log(`Context: ${args.context}`);
  }

  try {
    // Generate narration
    const result = await generateNarration({
      lang: args.lang,
      style: args.style,
      durationSec: args.duration,
      context: args.context,
    });

    // Write meta JSON
    const clipName = path.parse(args.clip).name;
    const metaPath = path.join("samples", "meta", `${clipName}.json`);
    await fs.mkdir(path.dirname(metaPath), { recursive: true });

    if (!args.force && (await fileExists(metaPath))) {
      if (!args.quiet)
        console.log(
          `⚠️  Meta file exists: ${metaPath} (use --force to overwrite)`
        );
    } else {
      await fs.writeFile(metaPath, JSON.stringify(result, null, 2));
      if (!args.quiet) console.log(`✅ Meta written: ${metaPath}`);
    }

    // Write narration text file
    const narrationPath = path.join(
      "samples",
      "meta",
      `${clipName}.narration.txt`
    );
    await fs.writeFile(narrationPath, result.narration);
    if (!args.quiet) console.log(`✅ Narration written: ${narrationPath}`);

    // Output JSON if requested
    if (args.jsonOut) {
      await fs.writeFile(args.jsonOut, JSON.stringify(result, null, 2));
      if (!args.quiet) console.log(`✅ JSON output: ${args.jsonOut}`);
    }

    // Print to stdout
    if (!args.quiet) {
      console.log("\n📝 Generated Content:");
      console.log(`Title: ${result.title}`);
      console.log(`Caption: ${result.caption}`);
      console.log(`Hashtags: ${result.hashtags.join(", ")}`);
      console.log(
        `Narration (${
          result.narration.split(" ").length
        } words): ${result.narration.substring(0, 100)}...`
      );
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Text generation failed:", error);
    process.exit(1);
  }
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: pnpm ai:gen --clip <path> --lang <lang> --style <style> --duration <sec> [options]

Required:
  --clip <path>        Input clip path (e.g., samples/clips/clip01.mp4)
  --lang <lang>        Language: fr|en
  --style <style>      Style: zen|adventure  
  --duration <sec>     Target duration in seconds

Optional:
  --context <text>     Context keywords (e.g., "banc de barracudas, eau claire")
  --json-out <path>    Output JSON to specific file
  --force              Overwrite existing files
  --quiet              Minimal output (JSON only)
  --help               Show this help

Examples:
  pnpm ai:gen --clip samples/clips/clip01.mp4 --lang fr --style zen --duration 20 --context "banc de barracudas, eau claire"
  pnpm ai:gen --clip samples/clips/clip02.mp4 --lang en --style adventure --duration 30
    `);
    process.exit(0);
  }

  const clip = getArg(args, "--clip");
  const lang = getArg(args, "--lang") as "fr" | "en";
  const style = getArg(args, "--style") as "zen" | "adventure";
  const duration = parseInt(getArg(args, "--duration") || "20");
  const context = getArg(args, "--context");
  const jsonOut = getArg(args, "--json-out");
  const force = args.includes("--force");
  const quiet = args.includes("--quiet");

  if (!clip) {
    console.error("❌ --clip is required");
    process.exit(1);
  }
  if (!lang || !["fr", "en"].includes(lang)) {
    console.error("❌ --lang must be 'fr' or 'en'");
    process.exit(1);
  }
  if (!style || !["zen", "adventure"].includes(style)) {
    console.error("❌ --style must be 'zen' or 'adventure'");
    process.exit(1);
  }

  return { clip, lang, style, duration, context, jsonOut, force, quiet };
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
