import { upload } from '@vercel/blob/client';

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VOICE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 
  'audio/wav', 
  'audio/ogg', 
  'audio/webm', 
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/x-m4a'
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

/**
 * Validate file before upload
 */
export const validateFile = (file, isVoice = false) => {
  const maxSize = isVoice ? MAX_VOICE_SIZE : MAX_FILE_SIZE;
  
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size must be less than ${sizeMB}MB`);
  }
  
  if (isVoice) {
    const isAudio = file.type.startsWith('audio/') || ALLOWED_AUDIO_TYPES.some(type => file.type.includes(type.split(';')[0]));
    if (!isAudio) {
      console.error('Invalid audio type:', file.type);
      throw new Error(`Invalid audio format: ${file.type}. Please try again.`);
    }
  } else {
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not allowed');
    }
  }
  
  return true;
};

/**
 * Upload file to Vercel Blob using client upload
 * @param {File} file - The file to upload
 * @param {string} dmId - The DM conversation ID
 * @param {string} userId - The user ID
 * @param {boolean} isVoice - Whether this is a voice message
 * @param {function} onProgress - Progress callback (percent)
 * @returns {Promise<{url: string, fileName: string, fileType: string, fileSize: number}>}
 */
export const uploadToVercelBlob = async (file, dmId, userId, isVoice = false, onProgress = null) => {
  try {
    // Validate file
    validateFile(file, isVoice);
    
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;
    
    console.log('Checking Vercel Blob token...');
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vercel Blob token not configured. Please add VITE_BLOB_READ_WRITE_TOKEN to your .env file and restart the dev server.');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Create file path
    const folder = isVoice ? 'voice' : 'files';
    const pathname = `dms/${dmId}/${folder}/${userId}/${fileName}`;
    
    console.log('Uploading to Vercel Blob:', pathname);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
    
    // Simulate progress start
    if (onProgress) {
      onProgress(10);
    }
    
    // Upload using client method
    console.log('Starting client upload...');
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload', // This will be handled by Vercel automatically
      clientPayload: JSON.stringify({ dmId, userId, isVoice }),
    });
    
    console.log('Upload response:', blob);
    
    // Simulate progress complete
    if (onProgress) {
      onProgress(100);
    }
    
    console.log('Upload successful:', blob.url);
    
    return {
      url: blob.url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath: pathname,
      downloadUrl: blob.downloadUrl || blob.url,
    };
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('token')) {
      throw new Error('Storage not configured. Please add VITE_BLOB_READ_WRITE_TOKEN to .env and restart dev server.');
    } else if (error.message.includes('quota')) {
      throw new Error('Storage quota exceeded. Please upgrade your Vercel plan.');
    } else if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
      throw new Error('CORS error. Please deploy to Vercel or use the API route method.');
    } else {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};

/**
 * Delete file from Vercel Blob (optional - for future use)
 */
export const deleteFromVercelBlob = async (fileUrl) => {
  try {
    const { del } = await import('@vercel/blob');
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;
    
    await del(fileUrl, { token });
    return true;
  } catch (error) {
    console.error('Vercel Blob delete error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
  if (fileType.startsWith('text/')) return '📃';
  return '📎';
};

/**
 * Check if file is an image
 */
export const isImageFile = (fileType) => {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
};

/**
 * Check if file is a voice message
 */
export const isVoiceFile = (fileType) => {
  return ALLOWED_AUDIO_TYPES.some(type => fileType.includes(type.split(';')[0]));
};
