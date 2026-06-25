// api/serve-blob.js — Proxy to serve private Vercel Blob files to the browser
// We construct the blob URL directly and fetch it server-side using our token
// and stream the bytes to the browser. This bypasses the 403 Forbidden.
import { head } from '@vercel/blob';

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
    console.log('Serving blob with pathname:', pathname);

    // 1. Get blob metadata using head() to verify it exists and get the URL
    const blobInfo = await head(pathname, { token });

    if (!blobInfo || !blobInfo.url) {
      console.log('Blob not found:', pathname);
      return response.status(404).json({ error: 'File not found', pathname });
    }

    console.log('Found blob:', blobInfo.url);

    // 2. Fetch the blob server-side using the token since it's private
    const fetchOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Forward range requests for audio/video seeking
    if (request.headers.range) {
      fetchOptions.headers.Range = request.headers.range;
    }

    const blobResponse = await fetch(blobInfo.url, fetchOptions);

    if (!blobResponse.ok && blobResponse.status !== 206) {
      const errText = await blobResponse.text();
      console.error('Failed to fetch blob:', errText);
      return response.status(blobResponse.status).json({ error: `Failed to fetch blob: ${errText}` });
    }

    // 3. Forward the content headers needed for media streaming
    const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    forwardHeaders.forEach(hdr => {
      const val = blobResponse.headers.get(hdr);
      if (val) {
        response.setHeader(hdr, val);
      }
    });

    // Fallback if content-type is missing
    if (!response.getHeader('content-type')) {
      response.setHeader('Content-Type', blobInfo.contentType || 'application/octet-stream');
    }

    // Pass the original status (200 or 206)
    response.status(blobResponse.status);

    // Read the array buffer and return
    const arrayBuffer = await blobResponse.arrayBuffer();
    return response.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('serve-blob error:', error);
    return response.status(500).json({ error: error.message, pathname });
  }
}
