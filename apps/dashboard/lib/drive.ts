import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

interface DriveListOptions {
  folderId?: string;
  pageToken?: string;
  pageSize?: number;
  query?: string;
  mimeType?: string;
}

class GoogleDriveService {
  private auth: GoogleAuth;
  private drive: any;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * List files in a Google Drive folder
   */
  async listFiles(options: DriveListOptions = {}): Promise<{
    files: DriveFile[];
    nextPageToken?: string;
    totalFiles?: number;
  }> {
    const {
      folderId,
      pageToken,
      pageSize = 50,
      query,
      mimeType = 'video/'
    } = options;

    let q = `trashed = false`;
    
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }
    
    if (mimeType) {
      q += ` and mimeType contains '${mimeType}'`;
    }
    
    if (query) {
      q += ` and name contains '${query}'`;
    }

    try {
      const response = await this.drive.files.list({
        q,
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
        orderBy: 'modifiedTime desc'
      });

      const files: DriveFile[] = response.data.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : undefined,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
      })) || [];

      return {
        files,
        nextPageToken: response.data.nextPageToken,
        totalFiles: files.length
      };
    } catch (error) {
      console.error('Error listing Drive files:', error);
      throw new Error(`Failed to list Drive files: ${error.message}`);
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string, localPath: string): Promise<string> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'stream'
      });

      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(localPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file ${fileId}: ${error.message}`);
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(localPath: string, fileName: string, parentFolderId?: string): Promise<DriveFile> {
    try {
      const fileMetadata: any = {
        name: fileName,
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const media = {
        mimeType: this.getMimeType(localPath),
        body: require('fs').createReadStream(localPath),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink',
      });

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size ? parseInt(response.data.size) : undefined,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file ${localPath}: ${error.message}`);
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    try {
      const fileMetadata: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink',
      });

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder ${name}: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink',
      });

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size ? parseInt(response.data.size) : undefined,
        modifiedTime: response.data.modifiedTime,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        thumbnailLink: response.data.thumbnailLink,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata for ${fileId}: ${error.message}`);
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      '.json': 'application/json',
      '.srt': 'text/plain',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if credentials are configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      await this.auth.getClient();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const driveService = new GoogleDriveService();
export type { DriveFile, DriveListOptions };