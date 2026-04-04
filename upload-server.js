// Simple upload proxy server for local development
import express from 'express';
import cors from 'cors';
import { put } from '@vercel/blob';
import 'dotenv/config';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

app.post('/upload', async (req, res) => {
  try {
    const { pathname, contentType } = req.query;
    
    if (!pathname) {
      return res.status(400).json({ error: 'pathname is required' });
    }

    console.log('Uploading:', pathname);
    
    const blob = await put(pathname, req.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType || 'application/octet-stream',
    });

    console.log('Upload successful:', blob.url);
    res.json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`);
  console.log('Make sure BLOB_READ_WRITE_TOKEN is set in .env');
});
