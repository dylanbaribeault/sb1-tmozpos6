import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getImageSyncService, ImageSyncConfig } from './imageSyncService';

// Task name for background image sync
const IMAGE_SYNC_TASK = 'background-image-sync';

/**
 * Register the background image sync task
 * @param config Configuration for the image sync service
 * @returns Promise that resolves when the task is registered
 */
export const registerBackgroundImageSync = async (config: Partial<ImageSyncConfig>): Promise<void> => {
  // Define the task
  TaskManager.defineTask(IMAGE_SYNC_TASK, async () => {
    try {
      // Initialize the service with the provided config
      const service = getImageSyncService(config);
      
      // Perform a sync
      await service.forceSyncNow();
      
      // Return success
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background image sync failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register the task
  const status = await BackgroundFetch.getStatusAsync();
  
  // Only register if not already registered
  if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
    await BackgroundFetch.registerTaskAsync(IMAGE_SYNC_TASK, {
      minimumInterval: Math.max(config.pollingInterval || 900000, 900000), // At least 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    console.info('Background image sync task registered');
  } else {
    console.warn('Background fetch is not available on this device');
  }
};

/**
 * Unregister the background image sync task
 * @returns Promise that resolves when the task is unregistered
 */
export const unregisterBackgroundImageSync = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(IMAGE_SYNC_TASK);
    
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(IMAGE_SYNC_TASK);
      console.info('Background image sync task unregistered');
    }
  } catch (error) {
    console.error('Failed to unregister background image sync task:', error);
  }
};

/**
 * Update the background image sync task configuration
 * @param config New configuration for the image sync service
 * @returns Promise that resolves when the task is updated
 */
export const updateBackgroundImageSyncConfig = async (config: Partial<ImageSyncConfig>): Promise<void> => {
  try {
    // Unregister the existing task
    await unregisterBackgroundImageSync();
    
    // Register with the new config
    await registerBackgroundImageSync(config);
  } catch (error) {
    console.error('Failed to update background image sync config:', error);
  }
};

/**
 * Check if the background image sync task is registered
 * @returns Promise that resolves with a boolean indicating if the task is registered
 */
export const isBackgroundImageSyncRegistered = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(IMAGE_SYNC_TASK);
  } catch (error) {
    console.error('Failed to check if background image sync task is registered:', error);
    return false;
  }
};