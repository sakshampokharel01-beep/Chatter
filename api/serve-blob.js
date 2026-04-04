// api/serve-blob.js — Proxy to serve private Vercel Blob files to the browser
// Browser can't directly access private blobs — this fetches them server-side

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
    // Fetch the private blob server-side using the auth token
    const blobUrl = `https://blob.vercel-storage.com/${pathname}`;
    const blobResponse = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!blobResponse.ok) {
      return response.status(blobResponse.status).json({ error: 'Failed to fetch blob' });
    }

    // Forward content-type and cache headers
    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the blob body to the client
    const arrayBuffer = await blobResponse.arrayBuffer();
    return response.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('serve-blob error:', error);
    return response.status(500).json({ error: error.message });
  }
}
