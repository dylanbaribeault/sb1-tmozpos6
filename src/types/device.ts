import { Database } from './supabase';

export type Device = Database['public']['Tables']['devices']['Row'];
export type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
export type DeviceUpdate = Database['public']['Tables']['devices']['Update'];

export type DeviceDetection = Database['public']['Tables']['device_detections']['Row'];
export type DeviceImage = Database['public']['Tables']['device_images']['Row'];

export interface DeviceWithStats extends Device {
  detectionCount?: number;
  lastDetectionDate?: string | null;
  imageCount?: number;
}

export interface DeviceFilters {
  status?: 'online' | 'offline' | 'all';
  search?: string;
  sortBy?: 'name' | 'created_at' | 'battery_level' | 'last_detection';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface DeviceListResponse {
  devices: DeviceWithStats[];
  totalCount: number;
  hasMore: boolean;
}

export interface DeviceMetrics {
  batteryLevel: number;
  detections: number;
  temperature?: number;
  humidity?: number;
  signalStrength?: string;
}

export interface DeviceSettings {
  captureFrequency: string;
  notificationPreferences: string[];
  sensitivityLevel?: number;
  nightMode?: boolean;
}

export interface DeviceDetectionData {
  date: string;
  count: number;
}

export interface DeviceDetailsResponse {
  device: Device;
  metrics: DeviceMetrics;
  detectionData: DeviceDetectionData[];
  images: DeviceImage[];
}