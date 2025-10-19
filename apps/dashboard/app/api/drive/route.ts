import { NextRequest, NextResponse } from 'next/server';
import { driveService } from '@/lib/drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || undefined;
    const pageToken = searchParams.get('pageToken') || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const query = searchParams.get('query') || undefined;

    // Check if Google Drive is configured
    const isConfigured = await driveService.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { 
          error: 'Google Drive not configured',
          message: 'Please configure GOOGLE_APPLICATION_CREDENTIALS environment variable'
        },
        { status: 503 }
      );
    }

    const result = await driveService.listFiles({
      folderId,
      pageToken,
      pageSize,
      query,
      mimeType: 'video/' // Only video files
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error listing Drive files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list Drive files',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, fileId, localPath, fileName, parentFolderId } = body;

    const isConfigured = await driveService.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Google Drive not configured' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'download':
        if (!fileId || !localPath) {
          return NextResponse.json(
            { error: 'fileId and localPath are required for download' },
            { status: 400 }
          );
        }
        
        const downloadedPath = await driveService.downloadFile(fileId, localPath);
        return NextResponse.json({
          success: true,
          localPath: downloadedPath
        });

      case 'upload':
        if (!localPath || !fileName) {
          return NextResponse.json(
            { error: 'localPath and fileName are required for upload' },
            { status: 400 }
          );
        }
        
        const uploadedFile = await driveService.uploadFile(localPath, fileName, parentFolderId);
        return NextResponse.json({
          success: true,
          file: uploadedFile
        });

      case 'create-folder':
        if (!fileName) {
          return NextResponse.json(
            { error: 'fileName is required for folder creation' },
            { status: 400 }
          );
        }
        
        const folder = await driveService.createFolder(fileName, parentFolderId);
        return NextResponse.json({
          success: true,
          folder
        });

      case 'get-metadata':
        if (!fileId) {
          return NextResponse.json(
            { error: 'fileId is required for metadata' },
            { status: 400 }
          );
        }
        
        const metadata = await driveService.getFileMetadata(fileId);
        return NextResponse.json({
          success: true,
          file: metadata
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error with Drive operation:', error);
    return NextResponse.json(
      { 
        error: 'Drive operation failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}