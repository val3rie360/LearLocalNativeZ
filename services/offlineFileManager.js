import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const OFFLINE_FILES_KEY = 'offline_files';
const MAX_STORAGE_SIZE = 500 * 1024 * 1024; // 500MB limit

class OfflineFileManager {
  constructor() {
    if (OfflineFileManager.instance) {
      return OfflineFileManager.instance;
    }
    OfflineFileManager.instance = this;
  }
  
  static getInstance() {
    if (!OfflineFileManager.instance) {
      OfflineFileManager.instance = new OfflineFileManager();
    }
    return OfflineFileManager.instance;
  }

  /**
   * Save file metadata to AsyncStorage
   */
  async saveFileMetadata(file) {
    try {
      const existingFiles = await this.getOfflineFiles();
      const updatedFiles = [...existingFiles, file];
      await AsyncStorage.setItem(OFFLINE_FILES_KEY, JSON.stringify(updatedFiles));
      console.log('✅ File metadata saved:', file.title);
    } catch (error) {
      console.error('❌ Error saving file metadata:', error);
      throw error;
    }
  }

  /**
   * Get all offline files from AsyncStorage
   */
  async getOfflineFiles() {
    try {
      const filesJson = await AsyncStorage.getItem(OFFLINE_FILES_KEY);
      if (!filesJson) return [];
      
      const files = JSON.parse(filesJson);
      // Convert date strings back to Date objects
      return files.map((file) => ({
        ...file,
        downloadedAt: new Date(file.downloadedAt),
        lastAccessedAt: new Date(file.lastAccessedAt)
      }));
    } catch (error) {
      console.error('❌ Error getting offline files:', error);
      return [];
    }
  }

  /**
   * Download and save a file for offline access
   */
  async downloadFileForOffline(resource, downloadUrl, userId, onProgress = null) {
    try {
      console.log('🔄 Starting offline download:', resource.title);
      
      // Generate safe filename
      const safeFileName = this.generateSafeFileName(
        resource.fileName || resource.displayName || resource.title
      );
      const filePath = FileSystem.documentDirectory + `offline_${safeFileName}`;
      
      // Use legacy FileSystem API
      console.log('📥 Downloading from URL:', downloadUrl);
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, filePath);
      
      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed - no URI returned');
      }
      
      console.log('📁 File downloaded to:', downloadResult.uri);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      // Create offline file metadata
      const offlineFile = {
        id: resource.id,
        title: resource.displayName || resource.title,
        fileName: safeFileName,
        filePath: downloadResult.uri,
        fileSize: fileInfo.size || 0,
        fileType: resource.fileType || 'application/pdf',
        organizationName: resource.organizationName || 'Organization',
        downloadedAt: new Date(),
        lastAccessedAt: new Date(),
        cloudinaryId: resource.cloudinaryPublicId,
        description: resource.description,
        category: resource.category
      };

      // Save metadata
      await this.saveFileMetadata(offlineFile);
      
      // Check storage limit and clean up if needed
      await this.manageStorageLimit();
      
      console.log('✅ File downloaded for offline access:', offlineFile.title);
      return offlineFile;
      
    } catch (error) {
      console.error('❌ Error downloading file for offline:', error);
      throw error;
    }
  }

  /**
   * Open a file for viewing
   */
  async openFile(file) {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(file.filePath);
      if (!fileInfo.exists) {
        throw new Error('File not found on device');
      }

      // Update last accessed time
      await this.updateLastAccessed(file.id);
      
      return file.filePath;
    } catch (error) {
      console.error('❌ Error opening file:', error);
      throw error;
    }
  }

  /**
   * Delete a file from offline storage
   */
  async deleteOfflineFile(fileId) {
    try {
      const files = await this.getOfflineFiles();
      const fileToDelete = files.find(f => f.id === fileId);
      
      if (!fileToDelete) {
        throw new Error('File not found');
      }

      // Delete physical file
      const fileInfo = await FileSystem.getInfoAsync(fileToDelete.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileToDelete.filePath);
      }

      // Remove from metadata
      const updatedFiles = files.filter(f => f.id !== fileId);
      await AsyncStorage.setItem(OFFLINE_FILES_KEY, JSON.stringify(updatedFiles));
      
      console.log('✅ Offline file deleted:', fileToDelete.title);
    } catch (error) {
      console.error('❌ Error deleting offline file:', error);
      throw error;
    }
  }

  /**
   * Get total storage used by offline files
   */
  async getStorageUsed() {
    try {
      const files = await this.getOfflineFiles();
      let totalSize = 0;
      
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(file.filePath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('❌ Error calculating storage used:', error);
      return 0;
    }
  }

  /**
   * Check if a file is already downloaded
   */
  async isFileDownloaded(fileId) {
    try {
      const files = await this.getOfflineFiles();
      return files.some(f => f.id === fileId);
    } catch (error) {
      console.error('❌ Error checking if file is downloaded:', error);
      return false;
    }
  }

  /**
   * Update last accessed time for a file
   */
  async updateLastAccessed(fileId) {
    try {
      const files = await this.getOfflineFiles();
      const updatedFiles = files.map(file => 
        file.id === fileId 
          ? { ...file, lastAccessedAt: new Date() }
          : file
      );
      await AsyncStorage.setItem(OFFLINE_FILES_KEY, JSON.stringify(updatedFiles));
    } catch (error) {
      console.error('❌ Error updating last accessed time:', error);
    }
  }

  /**
   * Generate a safe filename
   */
  generateSafeFileName(originalName) {
    return originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100) + '.pdf';
  }

  /**
   * Manage storage limit by removing oldest files
   */
  async manageStorageLimit() {
    try {
      const currentSize = await this.getStorageUsed();
      
      if (currentSize > MAX_STORAGE_SIZE) {
        console.log('⚠️ Storage limit exceeded, cleaning up old files...');
        
        const files = await this.getOfflineFiles();
        const sortedFiles = files.sort((a, b) => 
          a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime()
        );
        
        // Remove oldest files until under limit
        for (const file of sortedFiles) {
          await this.deleteOfflineFile(file.id);
          const newSize = await this.getStorageUsed();
          if (newSize <= MAX_STORAGE_SIZE * 0.8) { // Keep 20% buffer
            break;
          }
        }
        
        console.log('✅ Storage cleanup completed');
      }
    } catch (error) {
      console.error('❌ Error managing storage limit:', error);
    }
  }

  /**
   * Clear all offline files
   */
  async clearAllOfflineFiles() {
    try {
      const files = await this.getOfflineFiles();
      
      // Delete all physical files
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(file.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(file.filePath);
        }
      }
      
      // Clear metadata
      await AsyncStorage.removeItem(OFFLINE_FILES_KEY);
      
      console.log('✅ All offline files cleared');
    } catch (error) {
      console.error('❌ Error clearing offline files:', error);
      throw error;
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    try {
      const used = await this.getStorageUsed();
      const files = await this.getOfflineFiles();
      
      return {
        used,
        limit: MAX_STORAGE_SIZE,
        percentage: (used / MAX_STORAGE_SIZE) * 100,
        filesCount: files.length
      };
    } catch (error) {
      console.error('❌ Error getting storage info:', error);
      return {
        used: 0,
        limit: MAX_STORAGE_SIZE,
        percentage: 0,
        filesCount: 0
      };
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export default OfflineFileManager.getInstance();
