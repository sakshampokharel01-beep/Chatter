import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

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
    // For voice messages, check if it's any audio type
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
 * Upload file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} dmId - The DM conversation ID
 * @param {string} userId - The user ID
 * @param {boolean} isVoice - Whether this is a voice message
 * @param {function} onProgress - Progress callback (percent)
 * @returns {Promise<{url: string, fileName: string, fileType: string, fileSize: number}>}
 */
export const uploadFile = (file, dmId, userId, isVoice = false, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate file
      validateFile(file, isVoice);
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      // Create storage reference
      const folder = isVoice ? 'voice' : 'files';
      const storageRef = ref(storage, `dms/${dmId}/${folder}/${userId}/${fileName}`);
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          // Error callback
          console.error('Upload error:', error);
          reject(new Error('Upload failed: ' + error.message));
        },
        async () => {
          // Success callback
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              storagePath: `dms/${dmId}/${folder}/${userId}/${fileName}`
            });
          } catch (error) {
            reject(new Error('Failed to get download URL: ' + error.message));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFile = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
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
  return ALLOWED_AUDIO_TYPES.includes(fileType);
};
