import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return 'transparent';
    }
  };

  return (
    <View style={[styles.card, status && { borderLeftColor: getStatusColor(), borderLeftWidth: 3 }]}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  value: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
});

export default MetricCard;