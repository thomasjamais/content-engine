#!/usr/bin/env node
/**
 * Simple JavaScript version of the worker for testing
 */

const { spawn } = require('node:child_process');
const { promises: fs } = require('node:fs');
const path = require('node:path');

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { 
      stdio: 'inherit', 
      ...options 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function runPipeline(config) {
  const startTime = Date.now();
  console.log('🚀 Starting content-engine pipeline...');
  console.log(`Input: ${config.inputVideo}`);
  console.log(`Output: ${config.outputDir}`);
  
  // Ensure output directories exist
  await fs.mkdir(path.join(config.outputDir, 'clips'), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'tts'), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'subs'), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'shorts'), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'music'), { recursive: true });
  
  try {
    // Step 1: Ingest video and create clips
    console.log('\n📹 Step 1: Ingesting video and creating clips...');
    await runCommand('python3', [
      'services/vision/ingest.py',
      '--input', config.inputVideo,
      '--out', path.join(config.outputDir, 'clips'),
      '--min', config.minDuration.toString(),
      '--max', config.maxDuration.toString(),
      '--top', config.topClips.toString(),
      '--json'
    ]);
    
    // Step 2: Generate narration for each clip (stub)
    console.log('\n🤖 Step 2: Generating narration for clips...');
    const clips = await getClipsList(path.join(config.outputDir, 'clips'));
    
    for (const clip of clips) {
      console.log(`Processing ${clip.name}...`);
      
      // Generate narration (stub)
      const narration = {
        title: "Breath with the Ocean",
        narration: "Dive deep into the tranquil waters where time slows and the world above fades away. Feel the gentle rhythm of your breath as you explore the underwater realm, surrounded by vibrant coral and curious marine life.",
        caption: "Experience the serenity of underwater exploration. Dive into a world of peace and wonder.",
        hashtags: ["#ocean", "#diving", "#underwater", "#meditation", "#nature", "#peace"]
      };
      
      // Save narration metadata
      const metadataPath = path.join(config.outputDir, 'subs', `${clip.baseName}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(narration, null, 2));
      
      // Generate voice (stub)
      const voicePath = path.join(config.outputDir, 'tts', `${clip.baseName}.wav`);
      await fs.writeFile(voicePath, `# Placeholder voice file for ${clip.name}\n# Narration: ${narration.narration.substring(0, 50)}...\n`);
      
      // Generate subtitles
      const srtPath = path.join(config.outputDir, 'subs', `${clip.baseName}.srt`);
      await generateSubtitles(narration.narration, clip.duration, srtPath);
    }
    
    // Step 3: Compose final shorts
    console.log('\n🎬 Step 3: Composing final shorts...');
    for (const clip of clips) {
      const clipPath = path.join(config.outputDir, 'clips', clip.name);
      const voicePath = path.join(config.outputDir, 'tts', `${clip.baseName}.wav`);
      const srtPath = path.join(config.outputDir, 'subs', `${clip.baseName}.srt`);
      const musicPath = path.join(config.outputDir, 'music', 'ambient01.mp3');
      const outputPath = path.join(config.outputDir, 'shorts', `${clip.baseName}_final.mp4`);
      
      await runCommand('python3', [
        'services/montage/auto_edit.py',
        '--clip', clipPath,
        '--voice', voicePath,
        '--srt', srtPath,
        '--music', musicPath,
        '--out', outputPath
      ]);
    }
    
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Pipeline completed in ${elapsed.toFixed(1)}s`);
    console.log(`📁 Output files in: ${config.outputDir}`);
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

async function getClipsList(clipsDir) {
  const files = await fs.readdir(clipsDir);
  const clips = files
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({
      name: f,
      baseName: path.parse(f).name,
      duration: 30 // TODO: get actual duration from video
    }));
  
  return clips;
}

async function generateSubtitles(text, duration, outputPath) {
  // Simple subtitle generation - split text into sentences and distribute over duration
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const timePerSentence = duration / sentences.length;
  
  let srt = '';
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
  
  await fs.writeFile(outputPath, srt, 'utf8');
}

function formatSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node apps/worker/index.js <input-video> [options]

Options:
  --output-dir <dir>     Output directory (default: ./samples)
  --min-duration <sec>   Minimum clip duration (default: 12)
  --max-duration <sec>   Maximum clip duration (default: 45)
  --top-clips <num>      Number of top clips (default: 8)
  --lang <lang>          Language: fr|en (default: en)
  --style <style>        Style: zen|adventure (default: zen)
  --help                 Show this help
    `);
    process.exit(0);
  }
  
  const inputVideo = args[0];
  const outputDir = getArg(args, '--output-dir') || './samples';
  const minDuration = parseInt(getArg(args, '--min-duration') || '12');
  const maxDuration = parseInt(getArg(args, '--max-duration') || '45');
  const topClips = parseInt(getArg(args, '--top-clips') || '8');
  const lang = getArg(args, '--lang') || 'en';
  const style = getArg(args, '--style') || 'zen';
  
  const config = {
    inputVideo,
    outputDir,
    minDuration,
    maxDuration,
    topClips,
    lang,
    style
  };
  
  runPipeline(config).catch(console.error);
}

function getArg(args, flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}
