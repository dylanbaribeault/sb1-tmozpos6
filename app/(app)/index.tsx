import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, Bell, ChevronRight } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { fetchDashboardData } from '../../src/services/deviceService';
import DashboardMetricCard from '../../src/components/DashboardMetricCard';
import DashboardChart from '../../src/components/DashboardChart';
import AlertCard from '../../src/components/AlertCard';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Mock data for demonstration
  const mockDashboardData = {
    totalDevices: 5,
    activeDevices: 4,
    totalDetections: 127,
    recentAlerts: [
      { id: 1, deviceId: 'FS-1001', message: 'Low battery detected', severity: 'warning', timestamp: new Date().toISOString() },
      { id: 2, deviceId: 'FS-1003', message: 'Device offline for 24 hours', severity: 'critical', timestamp: new Date(Date.now() - 86400000).toISOString() }
    ],
    detectionData: [
      { date: '2023-06-01', count: 12 },
      { date: '2023-06-02', count: 8 },
      { date: '2023-06-03', count: 15 },
      { date: '2023-06-04', count: 10 },
      { date: '2023-06-05', count: 20 },
      { date: '2023-06-06', count: 18 },
      { date: '2023-06-07', count: 25 }
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
            <Text style={styles.subtitle}>Here's your field overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={24} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricsContainer}>
              <DashboardMetricCard
                title="Total Devices"
                value={mockDashboardData.totalDevices}
                icon="cpu"
              />
              <DashboardMetricCard
                title="Active Devices"
                value={mockDashboardData.activeDevices}
                icon="activity"
              />
              <DashboardMetricCard
                title="Total Detections"
                value={mockDashboardData.totalDetections}
                icon="eye"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/devices')}>
                <View style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <ChevronRight size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Wildlife Detections (Last 7 Days)</Text>
              <DashboardChart data={mockDashboardData.detectionData} />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/alerts')}>
                <View style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <ChevronRight size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.alertsContainer}>
              {mockDashboardData.recentAlerts.length > 0 ? (
                mockDashboardData.recentAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              ) : (
                <Text style={styles.noAlertsText}>No recent alerts</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Roboto',
    color: theme.colors.error,
    marginLeft: 8,
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.primary,
  },
  chartContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
  },
  alertsContainer: {
    marginBottom: 24,
  },
  noAlertsText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    padding: 16,
  },
});