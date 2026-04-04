// api/serve-blob.js — Proxy to serve private Vercel Blob files to the browser
// Instead of guessing the private domain, we use the SDK to locate the file
// and issue a 307 redirect to the Vercel-provided signed downloadUrl.
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
    // 1. Locate the exact blob using its pathname
    const { blobs } = await list({
      prefix: pathname,
      limit: 1,
      token,
    });

    if (!blobs || blobs.length === 0) {
      return response.status(404).json({ error: 'File not found' });
    }

    const blob = blobs[0];

    // 2. Redirect the browser to the short-lived signed URL provided by Vercel.
    // This allows the browser to download/stream the private file directly from Vercel's CDN,
    // which is much faster and saves serverless function bandwidth.
    response.setHeader('Cache-Control', 'private, max-age=3600');
    return response.redirect(307, blob.downloadUrl || blob.url);
  } catch (error) {
    console.error('serve-blob error:', error);
    return response.status(500).json({ error: error.message });
  }
}
