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
 * Upload file to Vercel Blob using direct API call
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
    
    if (!token) {
      throw new Error('Please add VITE_BLOB_READ_WRITE_TOKEN to .env and restart server');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Create file path
    const folder = isVoice ? 'voice' : 'files';
    const pathname = `dms/${dmId}/${folder}/${userId}/${fileName}`;
    
    console.log('Uploading:', pathname);
    
    if (onProgress) onProgress(20);
    
    // Direct upload to Vercel Blob API
    const response = await fetch(
      `https://blob.vercel-storage.com/${pathname}?filename=${encodeURIComponent(fileName)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-content-type': file.type,
        },
        body: file,
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    if (onProgress) onProgress(100);
    
    console.log('Upload successful:', result.url);
    
    return {
      url: result.url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath: pathname,
      downloadUrl: result.downloadUrl || result.url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Upload failed: ' + error.message);
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
