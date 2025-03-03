import { supabase, handleSupabaseError } from '../lib/supabase';
import { 
  Device, 
  DeviceInsert, 
  DeviceUpdate, 
  DeviceFilters, 
  PaginationParams, 
  DeviceListResponse,
  DeviceDetailsResponse,
  DeviceSettings
} from '../types/device';
import { getCurrentUser } from './authService';

/**
 * Fetch devices with pagination and filtering
 * @param filters - Optional filters for the query
 * @param pagination - Pagination parameters
 * @returns Promise with devices data
 */
export const getDevices = async (
  filters: DeviceFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<DeviceListResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building the query
    let query = supabase
      .from('devices')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      query = query.order(filters.sortBy, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch additional stats for each device
    const devicesWithStats = await Promise.all(
      (data || []).map(async (device) => {
        // Get detection count
        const { count: detectionCount, error: detectionError } = await supabase
          .from('device_detections')
          .select('*', { count: 'exact', head: true })
          .eq('device_id', device.id);

        // Get image count
        const { count: imageCount, error: imageError } = await supabase
          .from('device_images')
          .select('*', { count: 'exact', head: true })
          .eq('device_id', device.id);

        if (detectionError) console.error('Error fetching detection count:', detectionError);
        if (imageError) console.error('Error fetching image count:', imageError);

        return {
          ...device,
          detectionCount: detectionCount || 0,
          imageCount: imageCount || 0,
        };
      })
    );

    return {
      devices: devicesWithStats,
      totalCount: count || 0,
      hasMore: count ? from + pageSize < count : false,
    };
  } catch (error) {
    console.error('Get devices error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Fetch a single device by ID with detailed information
 * @param deviceId - The ID of the device to fetch
 * @returns Promise with device details
 */
export const getDeviceDetails = async (deviceId: string): Promise<DeviceDetailsResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch the device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (deviceError) throw deviceError;
    if (!device) throw new Error('Device not found');

    // Fetch detection data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: detections, error: detectionsError } = await supabase
      .from('device_detections')
      .select('*')
      .eq('device_id', deviceId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (detectionsError) throw detectionsError;

    // Fetch images
    const { data: images, error: imagesError } = await supabase
      .from('device_images')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (imagesError) throw imagesError;

    // Process detection data for chart
    const detectionsByDay = (detections || []).reduce((acc, detection) => {
      const date = new Date(detection.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const detectionData = Object.entries(detectionsByDay).map(([date, count]) => ({
      date,
      count,
    }));

    // Fill in missing days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (!detectionsByDay[dateStr]) {
        detectionData.push({ date: dateStr, count: 0 });
      }
    }

    // Sort by date
    detectionData.sort((a, b) => a.date.localeCompare(b.date));

    // Prepare metrics
    const metrics = {
      batteryLevel: device.battery_level,
      detections: detections?.length || 0,
      temperature: 24.5, // Mock data, would come from device.settings in a real app
      humidity: 68, // Mock data, would come from device.settings in a real app
      signalStrength: 'Good', // Mock data, would come from device.settings in a real app
    };

    return {
      device,
      metrics,
      detectionData,
      images: images || [],
    };
  } catch (error) {
    console.error('Get device details error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Add a new device
 * @param deviceData - The device data to insert
 * @returns Promise with the created device
 */
export const addDevice = async (deviceData: Omit<DeviceInsert, 'user_id'>): Promise<Device> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!deviceData.name || !deviceData.serial_number) {
      throw new Error('Device name and serial number are required');
    }

    // Check if device with this serial number already exists
    const { data: existingDevice, error: checkError } = await supabase
      .from('devices')
      .select('id')
      .eq('serial_number', deviceData.serial_number)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingDevice) {
      throw new Error('A device with this serial number is already registered');
    }

    // Insert the new device
    const { data, error } = await supabase
      .from('devices')
      .insert({
        ...deviceData,
        user_id: user.id,
        status: 'online',
        battery_level: 100,
        settings: {
          captureFrequency: 'Every 4 hours',
          notificationPreferences: ['All alerts'],
          sensitivityLevel: 5,
          nightMode: true,
        },
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create device');

    return data;
  } catch (error) {
    console.error('Add device error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Update an existing device
 * @param deviceId - The ID of the device to update
 * @param deviceData - The device data to update
 * @returns Promise with the updated device
 */
export const updateDevice = async (deviceId: string, deviceData: DeviceUpdate): Promise<Device> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if device exists and belongs to user
    const { data: existingDevice, error: checkError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (checkError) throw checkError;
    if (!existingDevice) {
      throw new Error('Device not found or you do not have permission to update it');
    }

    // Update the device
    const { data, error } = await supabase
      .from('devices')
      .update({
        ...deviceData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update device');

    return data;
  } catch (error) {
    console.error('Update device error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Update device settings
 * @param deviceId - The ID of the device to update
 * @param settings - The settings to update
 * @returns Promise with the updated device
 */
export const updateDeviceSettings = async (deviceId: string, settings: DeviceSettings): Promise<Device> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if device exists and belongs to user
    const { data: existingDevice, error: checkError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (checkError) throw checkError;
    if (!existingDevice) {
      throw new Error('Device not found or you do not have permission to update it');
    }

    // Update the device settings
    const { data, error } = await supabase
      .from('devices')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update device settings');

    return data;
  } catch (error) {
    console.error('Update device settings error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Delete a device
 * @param deviceId - The ID of the device to delete
 * @returns Promise<void>
 */
export const deleteDevice = async (deviceId: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if device exists and belongs to user
    const { data: existingDevice, error: checkError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (checkError) throw checkError;
    if (!existingDevice) {
      throw new Error('Device not found or you do not have permission to delete it');
    }

    // Delete the device (cascade deletion will handle related records)
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete device error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Subscribe to real-time device status updates
 * @param callback - Function to call when device status changes
 * @returns Subscription object with unsubscribe method
 */
export const subscribeToDeviceUpdates = (callback: (device: Device) => void) => {
  const subscription = supabase
    .channel('device-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'devices',
      },
      (payload) => {
        callback(payload.new as Device);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
};