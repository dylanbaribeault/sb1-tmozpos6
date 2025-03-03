import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { format } from 'date-fns';

interface Alert {
  id: number;
  deviceId: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: string;
}

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return theme.colors.warning;
      case 'critical':
        return theme.colors.error;
      default:
        return theme.colors.info;
    }
  };

  const renderIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    
    switch (severity) {
      case 'warning':
        return <AlertTriangle size={24} color={color} />;
      case 'critical':
        return <AlertCircle size={24} color={color} />;
      default:
        return <AlertTriangle size={24} color={color} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { borderLeftColor: getSeverityColor(alert.severity), borderLeftWidth: 4 }
      ]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        {renderIcon(alert.severity)}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.deviceId}>{alert.deviceId}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.timestamp}>
          {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  deviceId: {
    fontFamily: 'Roboto-Bold',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  message: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  timestamp: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.textLight,
  },
});

export default AlertCard;