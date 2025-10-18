/**
 * Shared types for the Content Engine
 * Used across dashboard, worker, and services
 */

// Existing types from prompts and AI modules
export type NarrationStyle = "zen" | "adventure";
export type Lang = "fr" | "en";

export type NarrationRequest = {
  lang: Lang;
  style: NarrationStyle;
  durationSec: number; // target duration of clip
  context?: string; // optional keywords from scene
};

export type NarrationResult = {
  title: string;
  narration: string; // 90-120 words
  caption: string;
  hashtags: string[];
};

// New scheduling types for Sprint 4
export type Platform = "YOUTUBE" | "TIKTOK" | "META";
export type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "ERROR" | "CANCELLED";

export interface ScheduleRequest {
  clipPath: string;
  platforms: Platform[];
  runAtISO: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
}

export type ScheduleResponse = {
  ok: true;
  jobs: Array<{ 
    id: string; 
    platform: Platform; 
    runAt: string; 
    status: JobStatus;
  }>;
} | {
  ok: false;
  error: string;
  details?: string;
}

export interface JobData {
  jobId: string;
  clipPath: string;
  platform: Platform;
  title?: string;
  caption?: string;
  hashtags?: string[];
}

export interface PublishResult {
  externalId: string;
  clipPath: string;
  platform: Platform;
  title?: string;
  caption?: string;
  hashtags?: string[];
  createdAt: string;
  uploadUrl?: string;
  thumbnailUrl?: string;
  isDryRun?: boolean;
}

export interface ClipMetadata {
  path: string;
  title?: string;
  duration?: number; // seconds
  fileSize?: number; // bytes
  width?: number;
  height?: number;
  fps?: number;
  createdAt: string;
}

export interface JobWithClip {
  id: string;
  platform: Platform;
  status: JobStatus;
  runAt: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
  resultJson?: string;
  retryCount: number;
  clip: {
    id: string;
    path: string;
    title?: string;
    duration?: number;
  };
}

export interface SystemHealth {
  ffmpeg: {
    available: boolean;
    version?: string;
    path?: string;
  };
  redis: {
    connected: boolean;
    url?: string;
    error?: string;
  };
  database: {
    connected: boolean;
    url?: string;
    error?: string;
  };
  storage: {
    samplesDir: boolean;
    outputDir: boolean;
    freeSpace?: number; // bytes
  };
}

// API Response helpers
export interface ApiSuccess<T = any> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Pagination
export interface PaginatedRequest {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Filters for job queries
export interface JobFilters {
  platform?: Platform;
  status?: JobStatus;
  clipId?: string;
  dateFrom?: string;
  dateTo?: string;
}