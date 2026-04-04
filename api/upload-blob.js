// api/upload-blob.js — Server-side proxy using @vercel/blob SDK
// Routes file uploads through the server to avoid CORS and keep token secure

import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'PUT') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return response.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not set on server' });
  }

  const { pathname, contentType } = request.query;
  if (!pathname) {
    return response.status(400).json({ error: 'Missing pathname query parameter' });
  }

  try {
    // Read raw body from the incoming request stream once
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    let blob;

    // Try public access first; fall back to private if the store requires it
    try {
      blob = await put(pathname, body, {
        access: 'public',
        token,
        contentType: contentType || 'application/octet-stream',
        addRandomSuffix: false,
      });
    } catch (publicErr) {
      if (publicErr.message && publicErr.message.includes('private store')) {
        // Store is private — retry with private access
        blob = await put(pathname, body, {
          access: 'private',
          token,
          contentType: contentType || 'application/octet-stream',
          addRandomSuffix: false,
        });
      } else {
        throw publicErr;
      }
    }

    return response.status(200).json({
      // Use our proxy URL so the browser can access the file without hitting the private blob directly
      url: `/api/serve-blob?pathname=${encodeURIComponent(blob.pathname)}`,
      downloadUrl: `/api/serve-blob?pathname=${encodeURIComponent(blob.pathname)}`,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Blob proxy error:', error);
    return response.status(500).json({ error: error.message });
  }
}
