import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Search, Filter } from 'lucide-react-native';
import { theme } from '../../../src/theme';
import { fetchDevices } from '../../../src/services/deviceService';
import DeviceCard from '../../../src/components/DeviceCard';
import Button from '../../../src/components/Button';

export default function DevicesScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDevices();
      setDevices(data);
      setFilteredDevices(data);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDevices(filtered);
    }
  }, [searchQuery, devices]);

  // Mock data for demonstration
  const mockDevices = [
    { id: '1', name: 'North Field Sensor', serialNumber: 'FS-1001', status: 'online', batteryLevel: 85, lastUpdated: new Date().toISOString() },
    { id: '2', name: 'East Boundary', serialNumber: 'FS-1002', status: 'online', batteryLevel: 72, lastUpdated: new Date().toISOString() },
    { id: '3', name: 'South Gate', serialNumber: 'FS-1003', status: 'offline', batteryLevel: 15, lastUpdated: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', name: 'West Perimeter', serialNumber: 'FS-1004', status: 'online', batteryLevel: 63, lastUpdated: new Date().toISOString() },
    { id: '5', name: 'Central Hub', serialNumber: 'FS-1005', status: 'online', batteryLevel: 91, lastUpdated: new Date().toISOString() },
  ];

  const handleDevicePress = (deviceId) => {
    router.push(`/devices/${deviceId}`);
  };

  const renderDeviceItem = ({ item }) => (
    <DeviceCard 
      device={item} 
      onPress={() => handleDevicePress(item.id)} 
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Devices</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/devices/register')}
        >
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search devices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textLight}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Retry" 
            onPress={loadDevices} 
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={mockDevices}
          renderItem={renderDeviceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.colors.primary]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No devices found</Text>
              <Button 
                title="Register New Device" 
                onPress={() => router.push('/devices/register')} 
                style={styles.registerButton}
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 50,
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
  },
});