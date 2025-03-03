import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../src/theme';
import { createSupportTicket } from '../../../src/services/supportService';
import Input from '../../../src/components/Input';
import Button from '../../../src/components/Button';

export default function NewTicketScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant camera roll permissions to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!title) {
      setError('Please enter a title for your ticket');
      return;
    }

    if (!description) {
      setError('Please enter a description of your issue');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createSupportTicket({
        title,
        description,
        deviceId: deviceId || null,
        images
      });
      
      Alert.alert(
        'Success',
        'Support ticket created successfully',
        [{ text: 'OK', onPress: () => router.push('/support') }]
      );
    } catch (err) {
      console.error('Error creating support ticket:', err);
      setError('Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Support Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Please provide details about your issue</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.form}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Brief description of the issue"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide as much detail as possible..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Input
            label="Related Device (Optional)"
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="Select a device"
          />

          <Text style={styles.label}>Attachments (Optional)</Text>
          <View style={styles.attachmentsContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.attachmentActions}>
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={pickImage}
              >
                <Text style={styles.attachButtonText}>Choose Image</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={takePhoto}
              >
                <Camera size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Button 
            title="Submit Ticket" 
            onPress={handleSubmit} 
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Submit Ticket</Text>
            )}
          </Button>
        </View>
      </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Roboto-Bold',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
    height: 120,
  },
  attachmentsContainer: {
    marginBottom: 20,
  },
  attachmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  attachButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  attachButtonText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.primary,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.white,
  },
});