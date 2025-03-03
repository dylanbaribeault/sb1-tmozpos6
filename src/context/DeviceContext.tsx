import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  Device, 
  DeviceFilters, 
  PaginationParams, 
  DeviceListResponse,
  DeviceDetailsResponse
} from '../types/device';
import { 
  getDevices, 
  getDeviceDetails, 
  addDevice, 
  updateDevice, 
  deleteDevice,
  subscribeToDeviceUpdates
} from '../services/deviceService';
import { useAuth } from './AuthContext';

interface DeviceContextType {
  devices: Device[];
  totalDevices: number;
  hasMoreDevices: boolean;
  selectedDevice: Device | null;
  deviceDetails: DeviceDetailsResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchDevices: (filters?: DeviceFilters, pagination?: PaginationParams) => Promise<void>;
  fetchDeviceDetails: (deviceId: string) => Promise<void>;
  registerDevice: (deviceData: Omit<Device, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Device>;
  updateDeviceInfo: (deviceId: string, deviceData: Partial<Device>) => Promise<Device>;
  removeDevice: (deviceId: string) => Promise<void>;
  clearDeviceError: () => void;
}

const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  totalDevices: 0,
  hasMoreDevices: false,
  selectedDevice: null,
  deviceDetails: null,
  isLoading: false,
  error: null,
  fetchDevices: async () => {},
  fetchDeviceDetails: async () => {},
  registerDevice: async () => ({} as Device),
  updateDeviceInfo: async () => ({} as Device),
  removeDevice: async () => {},
  clearDeviceError: () => {},
});

export const useDevices = () => useContext(DeviceContext);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [totalDevices, setTotalDevices] = useState<number>(0);
  const [hasMoreDevices, setHasMoreDevices] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear devices when user changes
  useEffect(() => {
    if (!user) {
      setDevices([]);
      setTotalDevices(0);
      setHasMoreDevices(false);
      setSelectedDevice(null);
      setDeviceDetails(null);
    }
  }, [user]);

  // Fetch devices
  const fetchDevices = async (
    filters: DeviceFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getDevices(filters, pagination);
      
      if (pagination.page === 1) {
        setDevices(response.devices);
      } else {
        setDevices(prev => [...prev, ...response.devices]);
      }
      
      setTotalDevices(response.totalCount);
      setHasMoreDevices(response.hasMore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch device details
  const fetchDeviceDetails = async (deviceId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const details = await getDeviceDetails(deviceId);
      setSelectedDevice(details.device);
      setDeviceDetails(details);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch device details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new device
  const registerDevice = async (deviceData: Omit<Device, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newDevice = await addDevice(deviceData);
      
      // Update the devices list
      setDevices(prev => [newDevice, ...prev]);
      setTotalDevices(prev => prev + 1);
      
      return newDevice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register device';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update device information
  const updateDeviceInfo = async (deviceId: string, deviceData: Partial<Device>) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDevice = await updateDevice(deviceId, deviceData);
      
      // Update the devices list
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId ? updatedDevice : device
        )
      );
      
      // Update selected device if it's the one being updated
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(updatedDevice);
      }
      
      // Update device details if they're loaded
      if (deviceDetails && deviceDetails.device.id === deviceId) {
        setDeviceDetails({
          ...deviceDetails,
          device: updatedDevice,
        });
      }
      
      return updatedDevice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update device';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a device
  const removeDevice = async (deviceId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteDevice(deviceId);
      
      // Update the devices list
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      setTotalDevices(prev => prev - 1);
      
      // Clear selected device if it's the one being deleted
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(null);
        setDeviceDetails(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete device';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearDeviceError = () => {
    setError(null);
  };

  // Set up real-time subscription for device updates
  useEffect(() => {
    if (!user) return;
    
    const subscription = subscribeToDeviceUpdates((updatedDevice) => {
      // Update the devices list
      setDevices(prev => 
        prev.map(device => 
          device.id === updatedDevice.id ? updatedDevice : device
        )
      );
      
      // Update selected device if it's the one being updated
      if (selectedDevice && selectedDevice.id === updatedDevice.id) {
        setSelectedDevice(updatedDevice);
      }
      
      // Update device details if they're loaded
      if (deviceDetails && deviceDetails.device.id === updatedDevice.id) {
        setDeviceDetails({
          ...deviceDetails,
          device: updatedDevice,
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedDevice, deviceDetails]);

  const value: DeviceContextType = {
    devices,
    totalDevices,
    hasMoreDevices,
    selectedDevice,
    deviceDetails,
    isLoading,
    error,
    fetchDevices,
    fetchDeviceDetails,
    registerDevice,
    updateDeviceInfo,
    removeDevice,
    clearDeviceError,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};