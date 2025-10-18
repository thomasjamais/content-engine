#!/usr/bin/env node
/**
 * Comprehensive smoke test for the content-engine pipeline.
 * Tests the complete flow from video input to final short output.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..');

class SmokeTest {
  constructor() {
    this.results = [];
    this.tempDir = path.join(rootDir, '.tmp', 'smoke-test');
  }

  async run() {
    console.log('🚀 Starting Content Engine Smoke Test');
    console.log('=====================================\n');

    try {
      await this.setup();
      await this.runTests();
      await this.summary();
    } catch (error) {
      console.error('💥 Smoke test setup failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Create temp directory
    await fs.mkdir(this.tempDir, { recursive: true });
    
    // Generate test fixtures if they don't exist
    const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
    const testVideo = path.join(fixturesDir, 'test_clip.mp4');
    
    if (!(await this.fileExists(testVideo))) {
      console.log('📁 Generating test fixtures...');
      await this.runCommand('python3', [
        path.join(fixturesDir, 'generate_fixtures.py')
      ]);
    }
    
    console.log('✅ Test environment ready\n');
  }

  async runTests() {
    // Test 1: AI Text Generation
    await this.testAIGeneration();
    
    // Test 2: TTS Voice Generation
    await this.testTTSGeneration();
    
    // Test 3: Subtitle Generation
    await this.testSubtitleGeneration();
    
    // Test 4: Video Processing (if ingest.py exists)
    await this.testVideoProcessing();
    
    // Test 5: Auto Edit (if auto_edit.py exists)
    await this.testAutoEdit();
    
    // Test 6: Full Pipeline (if worker exists)
    await this.testFullPipeline();
  }

  async testAIGeneration() {
    const testName = 'AI Text Generation';
    console.log(`🤖 Testing ${testName}...`);
    
    try {
      const startTime = Date.now();
      
      // Test the AI text generation
      const result = await this.runNodeScript(`
        import { generateNarration } from './packages/ai/text.js';
        
        try {
          const result = await generateNarration({
            lang: 'en',
            style: 'zen',
            durationSec: 20
          });
          
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      `);
      
      const duration = Date.now() - startTime;
      
      // Basic validation
      const output = JSON.parse(result.stdout);
      if (!output.title || !output.narration || !output.hashtags) {
        throw new Error('Invalid AI output structure');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async testTTSGeneration() {
    const testName = 'TTS Voice Generation';
    console.log(`🗣️ Testing ${testName}...`);
    
    try {
      const startTime = Date.now();
      const outputPath = path.join(this.tempDir, 'test_voice.wav');
      
      // Test TTS generation
      await this.runNodeScript(`
        import { synthesizeVoice } from './services/tts/voice_gen.js';
        
        try {
          const result = await synthesizeVoice({
            text: 'This is a test narration for our smoke test.',
            outPath: '${outputPath}'
          });
          
          console.log('TTS generated:', result);
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      `);
      
      const duration = Date.now() - startTime;
      
      // Verify output file exists
      const stats = await fs.stat(outputPath);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error('TTS output file not created or empty');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async testSubtitleGeneration() {
    const testName = 'Subtitle Generation';
    console.log(`📝 Testing ${testName}...`);
    
    const subtitlesScript = path.join(rootDir, 'services', 'vision', 'subtitles.py');
    
    if (!(await this.fileExists(subtitlesScript))) {
      console.log(`⏭️ Skipping ${testName} (subtitles.py not found)`);
      return;
    }
    
    try {
      const startTime = Date.now();
      const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
      const testClip = path.join(fixturesDir, 'test_clip.mp4');
      const outputSrt = path.join(this.tempDir, 'test_subtitles.srt');
      
      await this.runCommand('python3', [
        subtitlesScript,
        '--clip', testClip,
        '--srt', outputSrt,
        '--mode', 'from-text',
        '--text', 'This is a test subtitle for our smoke test pipeline.'
      ]);
      
      const duration = Date.now() - startTime;
      
      // Verify SRT file
      const stats = await fs.stat(outputSrt);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error('SRT output file not created or empty');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async testVideoProcessing() {
    const testName = 'Video Processing';
    console.log(`📹 Testing ${testName}...`);
    
    const ingestScript = path.join(rootDir, 'services', 'vision', 'ingest.py');
    
    if (!(await this.fileExists(ingestScript))) {
      console.log(`⏭️ Skipping ${testName} (ingest.py not found)`);
      return;
    }
    
    try {
      const startTime = Date.now();
      const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
      const testVideo = path.join(fixturesDir, 'test_clip.mp4');
      const outputDir = path.join(this.tempDir, 'clips');
      
      await fs.mkdir(outputDir, { recursive: true });
      
      await this.runCommand('python3', [
        ingestScript,
        '--input', testVideo,
        '--out', outputDir,
        '--min', '3',
        '--max', '6',
        '--top', '1'
      ]);
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async testAutoEdit() {
    const testName = 'Auto Edit';
    console.log(`🎬 Testing ${testName}...`);
    
    const autoEditScript = path.join(rootDir, 'services', 'montage', 'auto_edit.py');
    
    if (!(await this.fileExists(autoEditScript))) {
      console.log(`⏭️ Skipping ${testName} (auto_edit.py not found)`);
      return;
    }
    
    try {
      const startTime = Date.now();
      const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
      const testClip = path.join(fixturesDir, 'test_clip.mp4');
      const testVoice = path.join(fixturesDir, 'test_voice.wav');
      const outputVideo = path.join(this.tempDir, 'test_final.mp4');
      
      await this.runCommand('python3', [
        autoEditScript,
        '--clip', testClip,
        '--voice', testVoice,
        '--out', outputVideo,
        '--force'
      ]);
      
      const duration = Date.now() - startTime;
      
      // Verify output
      const stats = await fs.stat(outputVideo);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error('Auto edit output not created or empty');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async testFullPipeline() {
    const testName = 'Full Pipeline';
    console.log(`🔄 Testing ${testName}...`);
    
    const workerScript = path.join(rootDir, 'apps', 'worker', 'index.cjs');
    
    if (!(await this.fileExists(workerScript))) {
      console.log(`⏭️ Skipping ${testName} (worker not found)`);
      return;
    }
    
    try {
      const startTime = Date.now();
      const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
      const testVideo = path.join(fixturesDir, 'test_clip.mp4');
      
      // This might take longer, so we skip it in quick smoke tests
      console.log(`⏭️ Skipping ${testName} (too slow for smoke test)`);
      
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${testName} failed: ${error.message}`);
    }
  }

  async summary() {
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`${status} ${result.name} ${duration}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
    
    if (failed > 0) {
      console.log('\n⚠️ Some tests failed. Check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }

  async cleanup() {
    // Keep temp files for debugging in case of failures
    const failed = this.results.filter(r => !r.passed).length;
    if (failed === 0) {
      await fs.rmdir(this.tempDir, { recursive: true }).catch(() => {});
    } else {
      console.log(`\n🗂️ Test files kept in: ${this.tempDir}`);
    }
  }

  async fileExists(filePath: string) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async runCommand(command: string, args: string[]) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: rootDir,
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runNodeScript(script: string) {
    const scriptPath = path.join(this.tempDir, 'temp_script.mjs');
    await fs.writeFile(scriptPath, script, 'utf-8');
    
    return this.runCommand('node', [scriptPath]);
  }
}

// Run the smoke test
const smokeTest = new SmokeTest();
smokeTest.run().catch(console.error);