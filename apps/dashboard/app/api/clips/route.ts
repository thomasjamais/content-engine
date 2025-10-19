import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import type { Clip } from '../../../../../packages/core/types';

export async function GET() {
  try {
    const clips = await prisma.clip.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ clips });
  } catch (error) {
    console.error('Failed to fetch clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, duration, filePath } = body;

    if (!name || !filePath) {
      return NextResponse.json(
        { error: 'Name and filePath are required' },
        { status: 400 }
      );
    }

    const clip = await prisma.clip.create({
      data: {
        name,
        description,
        duration: duration || 0,
        filePath
      }
    });

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    console.error('Failed to create clip:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    );
  }
}