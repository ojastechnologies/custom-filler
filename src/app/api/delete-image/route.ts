import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl || !imageUrl.startsWith('/images/upload/')) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Extract the filename from the URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct the full path to the file
    const filePath = path.join(process.cwd(), 'public', 'images', 'upload', filename);
    
    // Delete the file
    await unlink(filePath);
    
    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}