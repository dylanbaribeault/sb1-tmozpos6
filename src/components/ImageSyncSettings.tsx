import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { useImageSync } from '../hooks/useImageSync';
import { ImageSyncConfig } from '../services/imageSyncService';
import Button from './Button';
import Input from './Input';
import { Clock, RefreshCw, Settings, Play, Square } from 'lucide-react-native';
import { format } from 'date-fns';

// Default configuration
const defaultConfig: Partial<ImageSyncConfig> = {
  pollingInterval: 300000, // 5 minutes
  sourceEndpoint: 'https://api.fieldshield.com/images',
  maxConcurrentDownloads: 3,
  fileTypes: ['jpg', 'jpeg', 'png'],
  logLevel: 'info',
};

const ImageSyncSettings: React.FC = () => {
  const {
    isRunning,
    lastSync,
    config,
    error,
    startSync,
    stopSync,
    updateConfig,
    syncNow,
    refreshLastSync,
  } = useImageSync(defaultConfig);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(config?.pollingInterval.toString() || '300000');
  const [sourceEndpoint, setSourceEndpoint] = useState(config?.sourceEndpoint || '');
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState(config?.maxConcurrentDownloads.toString() || '3');
  const [fileTypes, setFileTypes] = useState(config?.fileTypes.join(',') || 'jpg,jpeg,png');
  const [authToken, setAuthToken] = useState(config?.authToken || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Format polling interval for display
  const formatInterval = (ms: number) => {
    if (ms < 60000) {
      return `${Math.round(ms / 1000)} seconds`;
    } else if (ms < 3600000) {
      return `${Math.round(ms / 60000)} minutes`;
    } else {
      return `${Math.round(ms / 3600000)} hours`;
    }
  };

  // Handle save configuration
  const handleSaveConfig = async () => {
    setIsUpdating(true);
    try {
      const newConfig: Partial<ImageSyncConfig> = {
        pollingInterval: parseInt(pollingInterval, 10),
        sourceEndpoint,
        maxConcurrentDownloads: parseInt(maxConcurrentDownloads, 10),
        fileTypes: fileTypes.split(',').map(type => type.trim()),
      };

      if (authToken) {
        newConfig.authToken = authToken;
      }

      updateConfig(newConfig);
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle force sync
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
      await refreshLastSync();
    } catch (err) {
      console.error('Failed to force sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle toggle service
  const handleToggleService = async () => {
    if (isRunning) {
      await stopSync();
    } else {
      await startSync();
    }
  };

  if (!config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image Sync Status</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isRunning ? theme.colors.success : theme.colors.error }]} />
            <Text style={styles.statusValue}>{isRunning ? 'Running' : 'Stopped'}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sync:</Text>
            <Clock size={16} color={theme.colors.textLight} style={styles.statusIcon} />
            <Text style={styles.statusValue}>
              {lastSync ? format(new Date(lastSync), 'MMM d, yyyy h:mm a') : 'Never'}
            </Text>
            <TouchableOpacity onPress={refreshLastSync} style={styles.refreshButton}>
              <RefreshCw size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Sync Interval:</Text>
            <Text style={styles.statusValue}>{formatInterval(config.pollingInterval)}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isRunning ? "Stop Sync Service" : "Start Sync Service"}
            onPress={handleToggleService}
            style={[styles.button, { backgroundColor: isRunning ? theme.colors.error : theme.colors.success }]}
          >
            {isRunning ? (
              <Square size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
            ) : (
              <Play size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.buttonText}>
              {isRunning ? "Stop Sync Service" : "Start Sync Service"}
            </Text>
          </Button>
          
          <Button
            title="Sync Now"
            onPress={handleSyncNow}
            disabled={!isRunning || isSyncing}
            style={styles.button}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <RefreshCw size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Sync Now</Text>
              </>
            )}
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Settings size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          <Input
            label="Polling Interval (ms)"
            value={pollingInterval}
            onChangeText={setPollingInterval}
            keyboardType="numeric"
          />
          
          <Input
            label="Source Endpoint"
            value={sourceEndpoint}
            onChangeText={setSourceEndpoint}
          />
          
          <Input
            label="Max Concurrent Downloads"
            value={maxConcurrentDownloads}
            onChangeText={setMaxConcurrentDownloads}
            keyboardType="numeric"
          />
          
          <Input
            label="File Types (comma-separated)"
            value={fileTypes}
            onChangeText={setFileTypes}
          />
          
          <Input
            label="Auth Token (optional)"
            value={authToken}
            onChangeText={setAuthToken}
            secureTextEntry
          />
          
          <Button
            title="Save Configuration"
            onPress={handleSaveConfig}
            disabled={isUpdating}
            style={styles.saveButton}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Save Configuration</Text>
            )}
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontFamily: 'Roboto-Bold',
    fontSize: 14,
    color: theme.colors.text,
    width: 100,
  },
  statusValue: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.error,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
  },
  advancedToggleText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 16,
  },
});

export default ImageSyncSettings;