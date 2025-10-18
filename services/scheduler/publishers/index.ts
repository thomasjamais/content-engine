import * as youtube from "./youtube";
import * as tiktok from "./tiktok";
import * as meta from "./meta";
import { Platform, PublishResult } from "../../../packages/core/types";

export interface PublishOptions {
  clipPath: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
}

export async function publishToplatform(
  platform: Platform,
  options: PublishOptions
): Promise<PublishResult> {
  switch (platform) {
    case "YOUTUBE":
      return youtube.publish(options);
    case "TIKTOK":
      return tiktok.publish(options);
    case "META":
      return meta.publish(options);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export { youtube, tiktok, meta };