import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
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
    const blob = await put(pathname, request.body, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: false,
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
