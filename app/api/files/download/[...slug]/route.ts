import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// --- MUST match the path used in the POST route and Coolify volume mount
// Reading from an environment variable provides flexibility in deployment.
const PERSISTENT_DIR = process.env.UPLOAD_STORAGE_PATH || "/app/persistent_uploads"; 

export const runtime = "nodejs";

// Utility to guess the Content-Type (MIME type) based on filename
function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.mp4': return 'video/mp4';
    case '.mov': return 'video/quicktime';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default: return 'application/octet-stream'; 
  }
}

/**
 * GET /api/files/download/[...slug]
 * This route reads the file from the private persistent directory and streams it to the client.
 */
export async function GET(
  request: Request,
  // FIX: Change the type of context.params from Promise<{ slug: string[] }> to the synchronous structure 
  // expected by the Next.js App Router: { params: { slug: string[] } }
  context: { params: { slug: string[] } }
) {
  // The filename (e.g., "1700000000-document-name.pdf") will be the first item in the slug array
  const filename = context.params.slug.join('/'); 
  
  // Construct the absolute path on the container's file system
  const filePath = path.join(PERSISTENT_DIR, filename);

  try {
    // 1. Read the file content from the persistent volume
    const fileBuffer = await fs.readFile(filePath);

    // 2. Determine the file type for the browser
    const mimeType = getMimeType(filename);

    // 3. Convert Node.js Buffer content to a standard ArrayBuffer
    // This robust conversion creates a new Buffer copy, ensuring the underlying buffer 
    // is a standard ArrayBuffer type that satisfies the Blob constructor requirements,
    // resolving the persistent SharedArrayBuffer type conflict.
    const arrayBuffer = Buffer.from(fileBuffer).buffer;

    // 4. Return the file as a response with correct headers
    return new NextResponse(new Blob([arrayBuffer]), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        // Recommended headers for downloads/media streaming
        'Content-Disposition': `inline; filename="${filename}"`,
        // Set a Cache-Control policy for public assets
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // If the file is not found on disk, return 404
    console.error(`Attempted access to missing file: ${filename}`, error);
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
