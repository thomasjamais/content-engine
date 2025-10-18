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
  // Simulate API delay (Meta/Instagram usually faster)
  const delay = 500 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Generate mock external ID
  const externalId = `ig-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  // Create result object
  const result: PublishResult = {
    externalId,
    platform: "META",
    clipPath: options.clipPath,
    title: options.title || "Diving Adventures",
    caption: options.caption || "Exploring the depths 🌊 #DivingLife",
    hashtags: options.hashtags || ["#diving", "#reels", "#underwater", "#ocean"],
    createdAt: new Date().toISOString(),
    uploadUrl: `https://instagram.com/reel/${externalId}`,
    thumbnailUrl: `https://scontent.cdninstagram.com/v/t51.2885-15/${externalId}.jpg`,
    isDryRun: process.env.DRY_RUN === 'true'
  };
  
  // Write receipt to file system (unless DRY_RUN)
  if (process.env.DRY_RUN !== 'true') {
    await writeReceiptFile("meta", result);
  }
  
  console.log(`📷 Meta/Instagram: Published ${options.clipPath} → ${externalId}`);
  
  return result;
}

async function writeReceiptFile(platform: string, result: PublishResult): Promise<void> {
  const outputDir = path.join(process.cwd(), '.out', 'publish', platform);
  await fs.mkdir(outputDir, { recursive: true });
  
  const fileName = `${result.externalId}.json`;
  const filePath = path.join(outputDir, fileName);
  
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
}