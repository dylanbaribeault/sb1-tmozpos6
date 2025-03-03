import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, Cpu, Eye } from 'lucide-react-native';
import { theme } from '../theme';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({ title, value, icon }) => {
  const renderIcon = () => {
    switch (icon) {
      case 'cpu':
        return <Cpu size={24} color={theme.colors.primary} />;
      case 'activity':
        return <Activity size={24} color={theme.colors.primary} />;
      case 'eye':
        return <Eye size={24} color={theme.colors.primary} />;
      default:
        return <Activity size={24} color={theme.colors.primary} />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
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
    width: '31%',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default DashboardMetricCard;