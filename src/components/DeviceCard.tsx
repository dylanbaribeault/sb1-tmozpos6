import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Battery, Clock } from 'lucide-react-native';
import { theme } from '../theme';
import { format, formatDistanceToNow } from 'date-fns';

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: 'online' | 'offline';
  batteryLevel: number;
  lastUpdated: string;
}

interface DeviceCardProps {
  device: Device;
  onPress: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  const getBatteryColor = (level: number) => {
    if (level > 50) return theme.colors.success;
    if (level > 20) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? theme.colors.success : theme.colors.error;
  };

  const getLastUpdatedText = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{device.name}</Text>
          <Text style={styles.serialNumber}>S/N: {device.serialNumber}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(device.status) }]} />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.batteryContainer}>
          <Battery size={16} color={getBatteryColor(device.batteryLevel)} />
          <Text style={styles.batteryText}>{device.batteryLevel}%</Text>
        </View>
        
        <View style={styles.lastUpdatedContainer}>
          <Clock size={14} color={theme.colors.textLight} />
          <Text style={styles.lastUpdatedText}>
            {getLastUpdatedText(device.lastUpdated)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  serialNumber: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 6,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
});

export default DeviceCard;