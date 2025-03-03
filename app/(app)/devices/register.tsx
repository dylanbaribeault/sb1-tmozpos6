import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, QrCode, Check } from 'lucide-react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { theme } from '../../../src/theme';
import { registerDevice } from '../../../src/services/deviceService';
import Button from '../../../src/components/Button';
import Input from '../../../src/components/Input';

export default function RegisterDeviceScreen() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setScanning(true);
    } else {
      Alert.alert('Permission Denied', 'Please grant camera permission to scan QR codes.');
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);
    // Assuming QR code contains the serial number
    setSerialNumber(data);
  };

  const handleRegister = async () => {
    if (!serialNumber) {
      setError('Serial number is required');
      return;
    }

    if (!deviceName) {
      setError('Device name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await registerDevice({
        serialNumber,
        name: deviceName,
        location
      });
      
      Alert.alert(
        'Success',
        'Device registered successfully',
        [{ text: 'OK', onPress: () => router.push('/devices') }]
      );
    } catch (err) {
      console.error('Error registering device:', err);
      setError('Failed to register device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {scanning ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
          </View>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Register New Device</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>Enter device details or scan QR code</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              <View style={styles.serialNumberContainer}>
                <Input
                  label="Serial Number"
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="Enter device serial number"
                  containerStyle={{ flex: 1 }}
                />
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={requestCameraPermission}
                >
                  <QrCode size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>

              <Input
                label="Device Name"
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="Give your device a name"
              />

              <Input
                label="Location (Optional)"
                value={location}
                onChangeText={setLocation}
                placeholder="Where is this device installed?"
              />

              <Button 
                title="Register Device" 
                onPress={handleRegister} 
                disabled={loading}
                style={styles.registerButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Register Device</Text>
                  </>
                )}
              </Button>
            </View>
          </ScrollView>
        </>
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
  serialNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.white,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
  },
});