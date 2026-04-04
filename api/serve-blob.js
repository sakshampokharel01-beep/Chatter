// api/serve-blob.js — Proxy to serve private Vercel Blob files to the browser
// We find the exact URL via the SDK, then fetch it server-side using our token
// and stream the bytes to the browser. This bypasses the 403 Forbidden.
import { list } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return response.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  const { pathname } = request.query;
  if (!pathname) {
    return response.status(400).json({ error: 'Missing pathname' });
  }

  try {
    // 1. Locate the exact blob using its pathname to get the correct absolute URL
    const { blobs } = await list({
      prefix: pathname,
      limit: 1,
      token,
    });

    if (!blobs || blobs.length === 0) {
      return response.status(404).json({ error: 'File not found' });
    }

    const blob = blobs[0];

    // 2. Fetch the blob server-side using the token since it's private
    const blobResponse = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!blobResponse.ok) {
      const errText = await blobResponse.text();
      return response.status(blobResponse.status).json({ error: `Failed to fetch blob: ${errText}` });
    }

    // 3. Forward the content type and cache headers
    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'private, max-age=3600');
    
    // We must handle range requests for audio/video seeking if needed,
    // but for now, sending the full buffer works reliably.
    const arrayBuffer = await blobResponse.arrayBuffer();
    return response.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('serve-blob error:', error);
    return response.status(500).json({ error: error.message });
  }
}
