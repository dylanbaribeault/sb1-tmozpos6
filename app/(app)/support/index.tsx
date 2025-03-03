import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, MessageSquare } from 'lucide-react-native';
import { theme } from '../../../src/theme';
import { fetchSupportTickets } from '../../../src/services/supportService';
import SupportTicketCard from '../../../src/components/SupportTicketCard';
import Button from '../../../src/components/Button';

export default function SupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupportTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error loading support tickets:', err);
      setError('Failed to load support tickets. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Mock data for demonstration
  const mockTickets = [
    { id: '1', title: 'Device not connecting', status: 'open', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), description: 'My device has been offline for 3 days despite being powered on.' },
    { id: '2', title: 'False alerts', status: 'in_progress', createdAt: new Date(Date.now() - 172800000).toISOString(), lastUpdated: new Date(Date.now() - 86400000).toISOString(), description: 'Getting too many false positive alerts from my south field sensor.' },
    { id: '3', title: 'Battery draining quickly', status: 'closed', createdAt: new Date(Date.now() - 604800000).toISOString(), lastUpdated: new Date(Date.now() - 345600000).toISOString(), description: 'Battery is draining much faster than expected, only lasting about 2 days.' },
  ];

  const handleTicketPress = (ticketId) => {
    router.push(`/support/${ticketId}`);
  };

  const renderTicketItem = ({ item }) => (
    <SupportTicketCard 
      ticket={item} 
      onPress={() => handleTicketPress(item.id)} 
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support</Text>
        <TouchableOpacity 
          style={styles.newTicketButton}
          onPress={() => router.push('/support/new')}
        >
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Retry" 
            onPress={loadTickets} 
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={mockTickets}
          renderItem={renderTicketItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.colors.primary]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No support tickets found</Text>
              <Button 
                title="Create New Ticket" 
                onPress={() => router.push('/support/new')} 
                style={styles.createButton}
              />
            </View>
          }
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: theme.colors.text,
  },
  newTicketButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 50,
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 16,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
  },
});