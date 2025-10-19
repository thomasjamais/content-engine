import { Job } from 'bullmq';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export async function processClip(clipId: string, job: Job) {
  console.log(`🎬 Processing clip: ${clipId}`);
  
  const jobData = job.data;
  const isFromDrive = jobData.driveFile;
  
  try {
    await job.updateProgress(5);
    
    // Step 1: Download from Drive if needed
    let localVideoPath: string;
    if (isFromDrive) {
      console.log('📥 Step 1: Downloading from Google Drive...');
      localVideoPath = await downloadFromDrive(jobData.fileId, clipId, job);
      await job.updateProgress(15);
    } else {
      localVideoPath = path.join(process.cwd(), '../../samples/clips', `${clipId}.mp4`);
    }
    
    // Step 2: Video ingestion and scene detection
    console.log('🔍 Step 2: Analyzing video and detecting scenes...');
    const clipsInfo = await ingestVideo(localVideoPath, clipId, job);
    await job.updateProgress(35);
    
    // Step 3: Generate AI narration for each clip
    console.log('🤖 Step 3: Generating AI narration...');
    const narrationsInfo = await generateNarrations(Array.isArray(clipsInfo) ? clipsInfo : [clipsInfo], job);
    await job.updateProgress(55);
    
    // Step 4: Generate TTS and subtitles
    console.log('🎤 Step 4: Generating voice and subtitles...');
    const audioInfo = await generateAudioAndSubtitles(narrationsInfo, job);
    await job.updateProgress(75);
    
    // Step 5: Final montage (vertical format)
    console.log('🎞️ Step 5: Creating final vertical videos...');
    const finalVideos = await createFinalMontage(audioInfo, job);
    await job.updateProgress(90);
    
    // Step 6: Upload results to Drive if source was from Drive
    let uploadResults = null;
    if (isFromDrive) {
      console.log('☁️ Step 6: Uploading results to Google Drive...');
      uploadResults = await uploadResultsToDrive(finalVideos, jobData.driveFile, job);
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      clipId,
      inputPath: localVideoPath,
      finalVideos,
      uploadResults,
      processedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error processing clip ${clipId}:`, error);
    throw error;
  }
}

async function downloadFromDrive(fileId: string, clipId: string, job: Job) {
  const localPath = path.join(process.cwd(), '../../samples/raw', `${clipId}_drive.mp4`);
  
  // Call Drive API to download
  const response = await fetch(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/api/drive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'download',
      fileId,
      localPath
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download from Drive: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.localPath;
}

async function ingestVideo(videoPath: string, clipId: string, job: Job) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(process.cwd(), '../../samples/clips');
    
    const pythonProcess = spawn('python3', [
      '../../services/vision/ingest.py',
      '--input', videoPath,
      '--out', outputDir,
      '--min', '10',
      '--max', '60',
      '--top', '5',
      '--json'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`Ingest: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output from ingest.py
          const result = JSON.parse(stdout.trim());
          resolve(result.clips || []);
        } catch (e) {
          resolve([`${clipId}_clip1.mp4`, `${clipId}_clip2.mp4`]); // Fallback
        }
      } else {
        reject(new Error(`Ingest failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function generateNarrations(clips: any[], job: Job) {
  const { generateNarration } = require('../../../packages/ai/text');
  
  const results = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    
    try {
      const narration = await generateNarration({
        lang: 'en', // TODO: Make configurable
        style: 'zen', // TODO: Make configurable  
        durationSec: 30
      });
      
      results.push({
        clipPath: clip,
        narration,
        index: i
      });
    } catch (error) {
      console.warn(`Failed to generate narration for clip ${i}:`, error);
      // Continue with other clips
    }
  }
  
  return results;
}

async function generateAudioAndSubtitles(narrationsInfo: any[], job: Job) {
  const { synthesizeVoice } = require('../../../services/tts/voice_gen');
  
  const results = [];
  for (const info of narrationsInfo) {
    try {
      const audioPath = path.join(process.cwd(), '../../samples/tts', `${info.index}_voice.wav`);
      const srtPath = path.join(process.cwd(), '../../samples/subs', `${info.index}.srt`);
      
      // Generate TTS
      await synthesizeVoice({
        text: info.narration.narration,
        outPath: audioPath
      });
      
      // Generate SRT from text (simple timing)
      const srtContent = generateSimpleSRT(info.narration.narration);
      await fs.writeFile(srtPath, srtContent);
      
      results.push({
        ...info,
        audioPath,
        srtPath
      });
    } catch (error) {
      console.warn(`Failed to generate audio/subs for clip ${info.index}:`, error);
    }
  }
  
  return results;
}

async function createFinalMontage(audioInfo: any[], job: Job) {
  const results = [];
  
  for (const info of audioInfo) {
    try {
      const outputPath = path.join(process.cwd(), '../../samples/shorts', `${info.index}_final.mp4`);
      
      // Use Python auto_edit.py for final montage
      await new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
          '../../services/montage/auto_edit.py',
          '--clip', info.clipPath,
          '--voice', info.audioPath,
          '--srt', info.srtPath,
          '--out', outputPath,
          '--quiet'
        ]);
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`Montage failed with code ${code}`));
          }
        });
      });
      
      results.push({
        ...info,
        finalPath: outputPath,
        metadata: {
          title: info.narration.title,
          caption: info.narration.caption,
          hashtags: info.narration.hashtags
        }
      });
    } catch (error) {
      console.warn(`Failed to create montage for clip ${info.index}:`, error);
    }
  }
  
  return results;
}

async function uploadResultsToDrive(finalVideos: any[], originalDriveFile: any, job: Job) {
  const results = [];
  
  // Create a folder for results
  const folderName = `ContentEngine_${originalDriveFile.name}_${new Date().toISOString().split('T')[0]}`;
  
  const folderResponse = await fetch(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/api/drive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-folder',
      fileName: folderName
    })
  });
  
  if (!folderResponse.ok) {
    throw new Error('Failed to create Drive folder');
  }
  
  const folder = await folderResponse.json();
  const folderId = folder.folder.id;
  
  // Upload each final video
  for (const video of finalVideos) {
    try {
      const uploadResponse = await fetch(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/api/drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          localPath: video.finalPath,
          fileName: path.basename(video.finalPath),
          parentFolderId: folderId
        })
      });
      
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        results.push({
          ...video,
          driveFile: uploadResult.file,
          driveLink: uploadResult.file.webViewLink
        });
      }
    } catch (error) {
      console.warn(`Failed to upload ${video.finalPath}:`, error);
    }
  }
  
  return {
    folderId,
    folderLink: folder.folder.webViewLink,
    uploadedFiles: results
  };
}

function generateSimpleSRT(text: string): string {
  const words = text.split(' ');
  const wordsPerSecond = 2.5;
  const duration = Math.max(30, words.length / wordsPerSecond);
  
  // Simple timing: split text into 3-second chunks
  const chunks = [];
  const wordsPerChunk = Math.ceil(wordsPerSecond * 3);
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  let srt = '';
  chunks.forEach((chunk, index) => {
    const startTime = index * 3;
    const endTime = Math.min((index + 1) * 3, duration);
    
    srt += `${index + 1}\n`;
    srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srt += `${chunk}\n\n`;
  });
  
  return srt;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}