// pages/api/uploads/[...slug].js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const filePathSegments = req.query.slug;

    if (!filePathSegments || filePathSegments.length === 0) {
      return res.status(400).json({ error: 'File path is missing' });
    }

    const relativeFilePath = path.join(...filePathSegments);

    // IMPORTANT: The path now includes /public
    const absoluteFilePath = path.join('/app/public/uploads', relativeFilePath);

    // --- Security Check: Prevent path traversal attacks ---
    const safePath = path.resolve(absoluteFilePath);
    const volumeRoot = path.resolve('/app/public/uploads');
    if (!safePath.startsWith(volumeRoot)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // --- End Security Check ---

    // Check if the file exists
    const stats = await fs.promises.stat(safePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File Not Found' });
    }

    // Set the correct headers for a PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(safePath)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the file to the response
    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving file:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File Not Found' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}