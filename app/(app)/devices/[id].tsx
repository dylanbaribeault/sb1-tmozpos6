import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Edit2, Battery, Activity, Calendar, Camera } from 'lucide-react-native';
import { theme } from '../../../src/theme';
import { fetchDeviceDetails } from '../../../src/services/deviceService';
import MetricCard from '../../../src/components/MetricCard';
import DeviceChart from '../../../src/components/DeviceChart';
import DeviceImageGallery from '../../../src/components/DeviceImageGallery';
import Button from '../../../src/components/Button';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    const loadDeviceDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDeviceDetails(id);
        setDevice(data);
      } catch (err) {
        console.error('Error loading device details:', err);
        setError('Failed to load device details.');
      } finally {
        setLoading(false);
      }
    };

    loadDeviceDetails();
  }, [id]);

  // Mock data for demonstration
  const mockDevice = {
    id: '1',
    name: 'North Field Sensor',
    serialNumber: 'FS-1001',
    status: 'online',
    batteryLevel: 85,
    lastUpdated: new Date().toISOString(),
    location: 'North Field, Section A',
    metrics: {
      detections: 42,
      temperature: 24.5,
      humidity: 68,
      signalStrength: 'Good'
    },
    detectionData: [
      { date: '2023-06-01', count: 5 },
      { date: '2023-06-02', count: 3 },
      { date: '2023-06-03', count: 8 },
      { date: '2023-06-04', count: 4 },
      { date: '2023-06-05', count: 12 },
      { date: '2023-06-06', count: 7 },
      { date: '2023-06-07', count: 3 }
    ],
    images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1504006833117-8886a355efbf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80', timestamp: '2023-06-07T14:32:00Z' },
      { id: '2', url: 'https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80', timestamp: '2023-06-06T09:15:00Z' },
      { id: '3', url: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80', timestamp: '2023-06-05T22:45:00Z' }
    ]
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{mockDevice.name}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Edit2 size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.deviceInfo}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: mockDevice.status === 'online' ? theme.colors.success : theme.colors.error }]} />
          <Text style={styles.statusText}>{mockDevice.status === 'online' ? 'Online' : 'Offline'}</Text>
        </View>
        <Text style={styles.serialNumber}>S/N: {mockDevice.serialNumber}</Text>
        <Text style={styles.location}>{mockDevice.location}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'metrics' && styles.activeTab]}
          onPress={() => setActiveTab('metrics')}
        >
          <Text style={[styles.tabText, activeTab === 'metrics' && styles.activeTabText]}>Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'images' && styles.activeTab]}
          onPress={() => setActiveTab('images')}
        >
          <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>Images</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'metrics' && (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard 
                title="Battery" 
                value={`${mockDevice.batteryLevel}%`} 
                icon={<Battery size={24} color={theme.colors.primary} />}
                status={mockDevice.batteryLevel > 20 ? 'good' : 'warning'}
              />
              <MetricCard 
                title="Detections" 
                value={mockDevice.metrics.detections.toString()} 
                icon={<Activity size={24} color={theme.colors.primary} />}
              />
              <MetricCard 
                title="Temperature" 
                value={`${mockDevice.metrics.temperature}°C`} 
                icon={<Activity size={24} color={theme.colors.primary} />}
              />
              <MetricCard 
                title="Humidity" 
                value={`${mockDevice.metrics.humidity}%`} 
                icon={<Activity size={24} color={theme.colors.primary} />}
              />
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Detection History (Last 7 Days)</Text>
              <DeviceChart data={mockDevice.detectionData} />
            </View>

            <View style={styles.lastUpdatedContainer}>
              <Calendar size={16} color={theme.colors.textLight} />
              <Text style={styles.lastUpdatedText}>
                Last updated: {new Date(mockDevice.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'images' && (
          <View style={styles.imagesContainer}>
            <View style={styles.imagesHeader}>
              <Text style={styles.imagesTitle}>Recent Captures</Text>
              <TouchableOpacity>
                <Camera size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <DeviceImageGallery images={mockDevice.images} />
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Device Settings</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Device Name</Text>
              <Text style={styles.settingValue}>{mockDevice.name}</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Location</Text>
              <Text style={styles.settingValue}>{mockDevice.location}</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notification Preferences</Text>
              <Text style={styles.settingValue}>All alerts</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Capture Frequency</Text>
              <Text style={styles.settingValue}>Every 4 hours</Text>
            </View>
            
            <Button 
              title="Update Settings" 
              onPress={() => console.log('Update settings')} 
              style={styles.updateButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  deviceInfo: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
  },
  serialNumber: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontFamily: 'Roboto-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  lastUpdatedText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 6,
  },
  imagesContainer: {
    flex: 1,
  },
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagesTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
  },
  settingsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingValue: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 20,
  },
});