import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pathParam = formData.get('path') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Define the path where the file will be saved
    const uploadDir = join(process.cwd(), 'public', 'images', 'upload');
    
    // Create the directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generate a unique filename if not provided
    let filePath = pathParam;
    if (!filePath) {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      filePath = `/images/upload/product-${timestamp}.${fileExtension}`;
    }
    
    // Remove leading slash if present for file system path
    const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = join(process.cwd(), 'public', relativePath);
    
    // Write the file
    await writeFile(fullPath, buffer);
    
    // Return the public URL
    return NextResponse.json({ 
      success: true,
      url: filePath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};