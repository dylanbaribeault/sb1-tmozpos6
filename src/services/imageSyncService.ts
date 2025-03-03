import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { getCurrentUser } from './authService';

// Configuration schema with validation
const ConfigSchema = z.object({
  pollingInterval: z.number().min(1000).default(300000), // Default: 5 minutes in ms
  sourceEndpoint: z.string().url(),
  maxConcurrentDownloads: z.number().min(1).max(10).default(3),
  fileTypes: z.array(z.string()).default(['jpg', 'jpeg', 'png']),
  storageLocation: z.string().default(FileSystem.documentDirectory + 'images/'),
  authToken: z.string().optional(),
  retryAttempts: z.number().min(1).default(3),
  retryDelay: z.number().min(1000).default(5000), // 5 seconds
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type ImageSyncConfig = z.infer<typeof ConfigSchema>;

// Last sync timestamp storage key
const LAST_SYNC_KEY = 'imageSyncService:lastSync';

// Image metadata interface
interface ImageMetadata {
  id: string;
  url: string;
  timestamp: string;
  deviceId: string;
  fileName: string;
}

/**
 * Image Sync Service
 * Periodically checks for and retrieves image updates from a specified source
 */
export class ImageSyncService {
  private config: ImageSyncConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private downloadQueue: ImageMetadata[] = [];
  private activeDownloads: number = 0;
  private retryMap: Map<string, number> = new Map();

  /**
   * Create a new ImageSyncService
   * @param config Configuration for the service
   */
  constructor(config: Partial<ImageSyncConfig>) {
    try {
      this.config = ConfigSchema.parse(config);
    } catch (error) {
      this.logError('Configuration validation failed', error);
      throw new Error('Invalid configuration: ' + error.message);
    }

    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  /**
   * Start the image sync service
   * @returns Promise that resolves when the service is started
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logInfo('Service is already running');
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    
    // Run initial sync immediately
    try {
      await this.syncImages();
    } catch (error) {
      this.logError('Initial sync failed', error);
    }

    // Set up interval for periodic syncing
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.syncImages();
      } catch (error) {
        this.logError('Periodic sync failed', error);
      }
    }, this.config.pollingInterval);

    this.logInfo('Image sync service started');
  }

  /**
   * Stop the image sync service
   * @returns Promise that resolves when the service is stopped
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logInfo('Service is not running');
      return;
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Abort any in-progress operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Wait for active downloads to complete
    await this.waitForActiveDownloads();

    this.isRunning = false;
    this.logInfo('Image sync service stopped');
  }

  /**
   * Update the service configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<ImageSyncConfig>): void {
    const wasRunning = this.isRunning;
    
    // Stop the service if it's running
    if (wasRunning) {
      this.stop();
    }

    // Update config
    try {
      this.config = ConfigSchema.parse({
        ...this.config,
        ...config,
      });
    } catch (error) {
      this.logError('Configuration validation failed', error);
      throw new Error('Invalid configuration: ' + error.message);
    }

    // Restart if it was running
    if (wasRunning) {
      this.start();
    }

    this.logInfo('Configuration updated');
  }

  /**
   * Get the current configuration
   * @returns Current configuration
   */
  public getConfig(): ImageSyncConfig {
    return { ...this.config };
  }

  /**
   * Get the timestamp of the last successful sync
   * @returns Promise that resolves with the timestamp or null if no sync has been performed
   */
  public async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch (error) {
      this.logError('Failed to get last sync timestamp', error);
      return null;
    }
  }

  /**
   * Force an immediate sync
   * @returns Promise that resolves when the sync is complete
   */
  public async forceSyncNow(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Service is not running');
    }

    await this.syncImages();
  }

  /**
   * Main sync function that checks for and downloads new images
   * @private
   */
  private async syncImages(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        this.logWarn('No authenticated user, skipping sync');
        return;
      }

      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();
      
      // Fetch new images from source
      const newImages = await this.fetchNewImages(lastSync);
      
      if (newImages.length === 0) {
        this.logInfo('No new images to sync');
        return;
      }
      
      this.logInfo(`Found ${newImages.length} new images to download`);
      
      // Add to download queue
      this.downloadQueue.push(...newImages);
      
      // Process download queue
      this.processDownloadQueue();
      
      // Update last sync timestamp
      await this.updateLastSyncTimestamp();
    } catch (error) {
      this.logError('Sync failed', error);
      throw error;
    }
  }

  /**
   * Fetch new images from the source
   * @param lastSync Timestamp of the last successful sync
   * @private
   */
  private async fetchNewImages(lastSync: string | null): Promise<ImageMetadata[]> {
    try {
      const params = new URLSearchParams();
      
      if (lastSync) {
        params.append('since', lastSync);
      }
      
      // Add file types filter
      if (this.config.fileTypes.length > 0) {
        params.append('fileTypes', this.config.fileTypes.join(','));
      }
      
      const url = `${this.config.sourceEndpoint}?${params.toString()}`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      // Add auth token if provided
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: this.abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response data
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }
      
      return data.map(item => ({
        id: item.id,
        url: item.url,
        timestamp: item.timestamp,
        deviceId: item.deviceId,
        fileName: item.fileName || `image_${item.id}.${this.getFileExtension(item.url)}`,
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logInfo('Fetch operation aborted');
        return [];
      }
      
      this.logError('Failed to fetch new images', error);
      throw error;
    }
  }

  /**
   * Process the download queue
   * @private
   */
  private async processDownloadQueue(): Promise<void> {
    // Process queue until empty or max concurrent downloads reached
    while (this.downloadQueue.length > 0 && this.activeDownloads < this.config.maxConcurrentDownloads) {
      const image = this.downloadQueue.shift();
      if (!image) break;
      
      this.activeDownloads++;
      
      // Download image
      this.downloadImage(image)
        .catch(error => {
          this.logError(`Failed to download image ${image.id}`, error);
          
          // Add to retry queue if attempts remain
          const attempts = this.retryMap.get(image.id) || 0;
          if (attempts < this.config.retryAttempts) {
            this.retryMap.set(image.id, attempts + 1);
            this.logInfo(`Scheduling retry ${attempts + 1}/${this.config.retryAttempts} for image ${image.id}`);
            
            // Add back to queue after delay
            setTimeout(() => {
              this.downloadQueue.push(image);
              this.processDownloadQueue();
            }, this.config.retryDelay);
          } else {
            this.logWarn(`Max retry attempts reached for image ${image.id}`);
          }
        })
        .finally(() => {
          this.activeDownloads--;
          
          // Continue processing queue
          if (this.downloadQueue.length > 0) {
            this.processDownloadQueue();
          }
        });
    }
  }

  /**
   * Download an image
   * @param image Image metadata
   * @private
   */
  private async downloadImage(image: ImageMetadata): Promise<void> {
    try {
      const filePath = `${this.config.storageLocation}${image.deviceId}/${image.fileName}`;
      
      // Ensure device directory exists
      await FileSystem.makeDirectoryAsync(
        `${this.config.storageLocation}${image.deviceId}`,
        { intermediates: true }
      );
      
      // Download file
      const downloadResult = await FileSystem.downloadAsync(
        image.url,
        filePath,
        {
          headers: this.config.authToken ? { 'Authorization': `Bearer ${this.config.authToken}` } : undefined,
          md5: true,
        }
      );
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
      
      this.logInfo(`Downloaded image ${image.id} to ${filePath}`);
      
      // Store image metadata in database
      await this.storeImageMetadata(image, filePath, downloadResult.md5);
      
      // Clear retry count if successful
      this.retryMap.delete(image.id);
    } catch (error) {
      this.logError(`Failed to download image ${image.id}`, error);
      throw error;
    }
  }

  /**
   * Store image metadata in the database
   * @param image Image metadata
   * @param localPath Local file path
   * @param md5 MD5 hash of the file
   * @private
   */
  private async storeImageMetadata(image: ImageMetadata, localPath: string, md5: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Store in Supabase
      const { error } = await supabase
        .from('device_images')
        .insert({
          id: image.id,
          device_id: image.deviceId,
          url: image.url,
          local_path: localPath,
          md5_hash: md5,
          created_at: image.timestamp,
        });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      this.logError(`Failed to store image metadata for ${image.id}`, error);
      throw error;
    }
  }

  /**
   * Update the last sync timestamp
   * @private
   */
  private async updateLastSyncTimestamp(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
    } catch (error) {
      this.logError('Failed to update last sync timestamp', error);
    }
  }

  /**
   * Wait for all active downloads to complete
   * @private
   */
  private async waitForActiveDownloads(): Promise<void> {
    return new Promise<void>(resolve => {
      const checkDownloads = () => {
        if (this.activeDownloads === 0) {
          resolve();
        } else {
          this.logInfo(`Waiting for ${this.activeDownloads} active downloads to complete...`);
          setTimeout(checkDownloads, 500);
        }
      };
      
      checkDownloads();
    });
  }

  /**
   * Ensure the storage directory exists
   * @private
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.config.storageLocation);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.config.storageLocation, { intermediates: true });
        this.logInfo(`Created storage directory: ${this.config.storageLocation}`);
      }
    } catch (error) {
      this.logError('Failed to ensure storage directory exists', error);
      throw error;
    }
  }

  /**
   * Get file extension from URL
   * @param url URL to extract extension from
   * @private
   */
  private getFileExtension(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @private
   */
  private logDebug(message: string): void {
    if (this.config.logLevel === 'debug') {
      console.debug(`[ImageSyncService] ${message}`);
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   * @private
   */
  private logInfo(message: string): void {
    if (['debug', 'info'].includes(this.config.logLevel)) {
      console.info(`[ImageSyncService] ${message}`);
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @private
   */
  private logWarn(message: string): void {
    if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
      console.warn(`[ImageSyncService] ${message}`);
    }
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object
   * @private
   */
  private logError(message: string, error?: any): void {
    console.error(`[ImageSyncService] ${message}`, error);
  }
}

// Singleton instance
let instance: ImageSyncService | null = null;

/**
 * Get the ImageSyncService instance
 * @param config Configuration for the service (only used if instance doesn't exist)
 * @returns ImageSyncService instance
 */
export const getImageSyncService = (config?: Partial<ImageSyncConfig>): ImageSyncService => {
  if (!instance && config) {
    instance = new ImageSyncService(config);
  } else if (!instance) {
    throw new Error('ImageSyncService not initialized. Provide config on first call.');
  }
  
  return instance;
};

/**
 * Reset the ImageSyncService instance (for testing)
 */
export const resetImageSyncService = (): void => {
  if (instance) {
    instance.stop();
    instance = null;
  }
};