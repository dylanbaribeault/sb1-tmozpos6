import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  lastUpdated: string;
  description: string;
}

interface SupportTicketCardProps {
  ticket: Ticket;
  onPress: () => void;
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ ticket, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      case 'closed':
        return theme.colors.success;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{ticket.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
          <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {ticket.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>
          Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
        </Text>
        <Text style={styles.date}>
          Updated: {format(new Date(ticket.lastUpdated), 'MMM d, yyyy')}
        </Text>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.white,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.textLight,
  },
});

export default SupportTicketCard;