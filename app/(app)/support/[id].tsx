import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native';
import { theme } from '../../../src/theme';
import { fetchTicketDetails, addTicketReply } from '../../../src/services/supportService';
import Button from '../../../src/components/Button';
import { format } from 'date-fns';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const loadTicketDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTicketDetails(id);
        setTicket(data);
      } catch (err) {
        console.error('Error loading ticket details:', err);
        setError('Failed to load ticket details.');
      } finally {
        setLoading(false);
      }
    };

    loadTicketDetails();
  }, [id]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      await addTicketReply(id, replyText);
      // Update the ticket with the new reply
      const updatedTicket = { ...ticket };
      updatedTicket.messages.push({
        id: Date.now().toString(),
        text: replyText,
        sender: 'user',
        timestamp: new Date().toISOString(),
      });
      setTicket(updatedTicket);
      setReplyText('');
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Mock data for demonstration
  const mockTicket = {
    id: '1',
    title: 'Device not connecting',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
    description: 'My device has been offline for 3 days despite being powered on. I've checked the power supply and it seems to be working fine. The device is showing a green light but not connecting to the network.',
    messages: [
      {
        id: '1',
        text: 'My device has been offline for 3 days despite being powered on. I've checked the power supply and it seems to be working fine. The device is showing a green light but not connecting to the network.',
        sender: 'user',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '2',
        text: 'Thank you for reporting this issue. Could you please provide the device serial number and let us know if you've tried resetting the device?',
        sender: 'support',
        timestamp: new Date(Date.now() - 158400000).toISOString(),
      },
      {
        id: '3',
        text: 'The serial number is FS-1001. Yes, I've tried resetting it twice but no change.',
        sender: 'user',
        timestamp: new Date(Date.now() - 144000000).toISOString(),
      },
      {
        id: '4',
        text: 'We've identified the issue with your device. It appears to be a network configuration problem. We'll be pushing an update to your device remotely. Please keep it powered on for the next 24 hours.',
        sender: 'support',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
  };

  const getStatusColor = (status) => {
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

  const getStatusText = (status) => {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ticket #{mockTicket.id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle}>{mockTicket.title}</Text>
        <View style={styles.ticketMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mockTicket.status) }]}>
            <Text style={styles.statusText}>{getStatusText(mockTicket.status)}</Text>
          </View>
          <Text style={styles.dateText}>
            Opened on {format(new Date(mockTicket.createdAt), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {mockTicket.messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.supportMessage
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.messageTime}>
              {format(new Date(message.timestamp), 'MMM d, h:mm a')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {mockTicket.status !== 'closed' && (
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <View style={styles.replyActions}>
            <TouchableOpacity style={styles.attachButton}>
              <Paperclip size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!replyText.trim() || sendingReply) && styles.sendButtonDisabled
              ]}
              onPress={handleSendReply}
              disabled={!replyText.trim() || sendingReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Send size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
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
    fontSize: 18,
    color: theme.colors.text,
  },
  ticketInfo: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ticketTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.white,
  },
  dateText: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: theme.colors.textLight,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  supportMessage: {
    backgroundColor: theme.colors.backgroundLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: props => props.sender === 'user' ? theme.colors.white : theme.colors.text,
  },
  messageTime: {
    fontFamily: 'Roboto',
    fontSize: 10,
    color: props => props.sender === 'user' ? 'rgba(255,255,255,0.7)' : theme.colors.textLight,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  replyContainer: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  replyInput: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    maxHeight: 100,
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.text,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
});