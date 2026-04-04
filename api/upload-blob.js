// api/upload-blob.js — Server-side proxy for Vercel Blob uploads
// Prevents CORS issues by keeping the token server-side only

export const config = {
  api: {
    bodyParser: false, // We handle raw body ourselves
  },
};

export default async function handler(request, response) {
  // Only allow PUT requests
  if (request.method !== 'PUT') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return response.status(500).json({ error: 'Blob token not configured on server' });
  }

  // Get pathname and filename from query params
  const { pathname, filename, contentType } = request.query;

  if (!pathname) {
    return response.status(400).json({ error: 'Missing pathname query parameter' });
  }

  try {
    // Read raw body from request
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Forward the upload to Vercel Blob server-side
    const blobUrl = `https://blob.vercel-storage.com/${pathname}`;
    const params = new URLSearchParams();
    if (filename) params.set('filename', filename);

    const blobResponse = await fetch(`${blobUrl}?${params.toString()}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-content-type': contentType || 'application/octet-stream',
        'x-access': 'private',   // match the private store configuration
        'Content-Length': String(body.length),
      },
      body,
    });

    if (!blobResponse.ok) {
      const errText = await blobResponse.text();
      console.error('Vercel Blob error:', blobResponse.status, errText);
      return response.status(blobResponse.status).json({
        error: `Blob upload failed: ${blobResponse.status} - ${errText}`,
      });
    }

    const result = await blobResponse.json();

    // For private stores, downloadUrl is a signed URL; url is the permanent path.
    // Return both so the client can use whichever is appropriate.
    return response.status(200).json({
      url: result.downloadUrl || result.url, // prefer signed URL for private stores
      downloadUrl: result.downloadUrl || result.url,
      pathname: result.pathname,
    });
  } catch (error) {
    console.error('Proxy upload error:', error);
    return response.status(500).json({ error: error.message });
  }
}
