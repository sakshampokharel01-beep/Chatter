export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Only allow PUT requests
  if (request.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get('pathname');
  const filename = searchParams.get('filename');
  const contentType = searchParams.get('contentType');

  if (!pathname || !filename) {
    return new Response(JSON.stringify({ error: 'Missing pathname or filename' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { put } = await import('@vercel/blob');
    
    const blob = await put(pathname, request.body, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return new Response(JSON.stringify({ url: blob.url, downloadUrl: blob.downloadUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
