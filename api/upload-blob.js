import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pathname, filename, contentType } = req.query;

  if (!pathname || !filename) {
    return res.status(400).json({ error: 'Missing pathname or filename' });
  }

  try {
    const blob = await put(pathname, req, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: false,
    });

    return res.status(200).json({ 
      url: blob.url, 
      downloadUrl: blob.downloadUrl || blob.url 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
