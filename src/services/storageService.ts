import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { getCurrentUser } from './authService';

/**
 * Request camera and media library permissions
 * @returns Promise with permission status
 */
export const requestMediaPermissions = async () => {
  if (Platform.OS !== 'web') {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      cameraPermissionGranted: cameraPermission.status === 'granted',
      libraryPermissionGranted: libraryPermission.status === 'granted',
    };
  }
  
  return {
    cameraPermissionGranted: true,
    libraryPermissionGranted: true,
  };
};

/**
 * Pick an image from the device's media library
 * @returns Promise with the selected image info
 */
export const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw new Error('Failed to pick image from library');
  }
};

/**
 * Take a photo using the device's camera
 * @returns Promise with the captured image info
 */
export const takePhoto = async () => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw new Error('Failed to take photo');
  }
};

/**
 * Upload a file to Supabase Storage
 * @param uri - The local URI of the file to upload
 * @param bucket - The storage bucket to upload to
 * @param path - The path within the bucket
 * @returns Promise with the uploaded file URL
 */
export const uploadFile = async (
  uri: string,
  bucket: string,
  path: string
): Promise<string> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Generate a unique filename
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob);
    
    if (error) throw error;
    if (!data) throw new Error('Upload failed');
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload file error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Upload an image for a device
 * @param deviceId - The ID of the device
 * @param uri - The local URI of the image
 * @returns Promise with the uploaded image URL
 */
export const uploadDeviceImage = async (deviceId: string, uri: string): Promise<string> => {
  return uploadFile(uri, 'device-images', `devices/${deviceId}`);
};

/**
 * Upload an attachment for a support ticket
 * @param ticketId - The ID of the ticket
 * @param uri - The local URI of the file
 * @returns Promise with the uploaded file URL
 */
export const uploadTicketAttachment = async (ticketId: string, uri: string): Promise<string> => {
  return uploadFile(uri, 'ticket-attachments', `tickets/${ticketId}`);
};

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket
 * @param path - The full path of the file to delete
 * @returns Promise<void>
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error('Failed to delete file');
  }
};