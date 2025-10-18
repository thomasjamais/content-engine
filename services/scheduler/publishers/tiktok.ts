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
  // Simulate API delay (shorter for TikTok)
  const delay = 800 + Math.random() * 1500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Generate mock external ID
  const externalId = `tt-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  // Create result object
  const result: PublishResult = {
    externalId,
    platform: "TIKTOK",
    clipPath: options.clipPath,
    title: options.title || "Amazing diving content",
    caption: options.caption || "Check out this amazing dive! 🤿",
    hashtags: options.hashtags || ["#diving", "#ocean", "#underwater"],
    createdAt: new Date().toISOString(),
    uploadUrl: `https://tiktok.com/@user/video/${externalId}`,
    thumbnailUrl: `https://p16-sign-sg.tiktokcdn.com/obj/${externalId}.jpg`,
    isDryRun: process.env.DRY_RUN === 'true'
  };
  
  // Write receipt to file system (unless DRY_RUN)
  if (process.env.DRY_RUN !== 'true') {
    await writeReceiptFile("tiktok", result);
  }
  
  console.log(`🎵 TikTok: Published ${options.clipPath} → ${externalId}`);
  
  return result;
}

async function writeReceiptFile(platform: string, result: PublishResult): Promise<void> {
  const outputDir = path.join(process.cwd(), '.out', 'publish', platform);
  await fs.mkdir(outputDir, { recursive: true });
  
  const fileName = `${result.externalId}.json`;
  const filePath = path.join(outputDir, fileName);
  
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
}