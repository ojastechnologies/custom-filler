import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'images', 'upload');
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log(`Directory created or already exists: ${uploadDir}`);
    } catch (error) {
      console.error('Error creating directory:', error);
      return NextResponse.json(
        { error: 'Failed to create upload directory' },
        { status: 500 }
      );
    }


    const filename = path.basename(pathParam);
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);
    

    const fileUrl = `/images/upload/${filename}`;
    
    return NextResponse.json({ 
      url: fileUrl,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
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