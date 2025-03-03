import { useState, useEffect } from 'react';
import { getImageSyncService, ImageSyncConfig } from '../services/imageSyncService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing the image sync service
 * @param initialConfig Initial configuration for the service
 * @returns Object with service state and control functions
 */
export const useImageSync = (initialConfig: Partial<ImageSyncConfig>) => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [config, setConfig] = useState<ImageSyncConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize service when user is authenticated
  useEffect(() => {
    if (!user) return;

    try {
      const service = getImageSyncService(initialConfig);
      setConfig(service.getConfig());
      
      // Get last sync timestamp
      service.getLastSyncTimestamp().then(timestamp => {
        setLastSync(timestamp);
      });
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to initialize image sync service');
    }
  }, [user, initialConfig]);

  // Start the service
  const startSync = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const service = getImageSyncService();
      await service.start();
      setIsRunning(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to start image sync service');
    }
  };

  // Stop the service
  const stopSync = async () => {
    if (!user) return;

    try {
      const service = getImageSyncService();
      await service.stop();
      setIsRunning(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to stop image sync service');
    }
  };

  // Update service configuration
  const updateConfig = (newConfig: Partial<ImageSyncConfig>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const service = getImageSyncService();
      service.updateConfig(newConfig);
      setConfig(service.getConfig());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update image sync configuration');
    }
  };

  // Force an immediate sync
  const syncNow = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!isRunning) {
      setError('Service is not running');
      return;
    }

    try {
      const service = getImageSyncService();
      await service.forceSyncNow();
      
      // Update last sync timestamp
      const timestamp = await service.getLastSyncTimestamp();
      setLastSync(timestamp);
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to force sync');
    }
  };

  // Refresh last sync timestamp
  const refreshLastSync = async () => {
    if (!user) return;

    try {
      const service = getImageSyncService();
      const timestamp = await service.getLastSyncTimestamp();
      setLastSync(timestamp);
    } catch (err) {
      setError(err.message || 'Failed to get last sync timestamp');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRunning) {
        getImageSyncService().stop().catch(console.error);
      }
    };
  }, [isRunning]);

  return {
    isRunning,
    lastSync,
    config,
    error,
    startSync,
    stopSync,
    updateConfig,
    syncNow,
    refreshLastSync,
  };
};