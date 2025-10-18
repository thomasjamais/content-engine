import { PublishResult } from "../../../packages/core/types";
import { promises as fs } from "fs";
import * as path from "path";

export interface PublishOptions {
  clipPath: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
}

export async function publish(options: PublishOptions): Promise<PublishResult> {
  // Simulate API delay (1-3 seconds)
  const delay = 1000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Generate mock external ID
  const externalId = `yt-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  // Create result object
  const result: PublishResult = {
    externalId,
    platform: "YOUTUBE",
    clipPath: options.clipPath,
    title: options.title || "Untitled Video",
    caption: options.caption || "Uploaded via Content Engine",
    hashtags: options.hashtags || [],
    createdAt: new Date().toISOString(),
    uploadUrl: `https://youtube.com/watch?v=${externalId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${externalId}/maxresdefault.jpg`,
    isDryRun: process.env.DRY_RUN === 'true'
  };
  
  // Write receipt to file system (unless DRY_RUN)
  if (process.env.DRY_RUN !== 'true') {
    await writeReceiptFile("youtube", result);
  }
  
  console.log(`📺 YouTube: Published ${options.clipPath} → ${externalId}`);
  
  return result;
}

async function writeReceiptFile(platform: string, result: PublishResult): Promise<void> {
  const outputDir = path.join(process.cwd(), '.out', 'publish', platform);
  await fs.mkdir(outputDir, { recursive: true });
  
  const fileName = `${result.externalId}.json`;
  const filePath = path.join(outputDir, fileName);
  
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
}