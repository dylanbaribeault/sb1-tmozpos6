import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  SupportTicket, 
  TicketFilters, 
  PaginationParams, 
  TicketListResponse,
  TicketDetailsResponse,
  CreateTicketParams,
  AddTicketMessageParams,
  UpdateTicketStatusParams
} from '../types/support';
import { 
  getTickets, 
  getTicketDetails, 
  createTicket, 
  addTicketMessage, 
  updateTicketStatus,
  subscribeToTicketUpdates
} from '../services/supportService';
import { useAuth } from './AuthContext';

interface SupportContextType {
  tickets: SupportTicket[];
  totalTickets: number;
  hasMoreTickets: boolean;
  selectedTicket: SupportTicket | null;
  ticketDetails: TicketDetailsResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchTickets: (filters?: TicketFilters, pagination?: PaginationParams) => Promise<void>;
  fetchTicketDetails: (ticketId: string) => Promise<void>;
  createNewTicket: (params: CreateTicketParams) => Promise<SupportTicket>;
  addMessage: (params: AddTicketMessageParams) => Promise<void>;
  updateStatus: (params: UpdateTicketStatusParams) => Promise<SupportTicket>;
  clearSupportError: () => void;
}

const SupportContext = createContext<SupportContextType>({
  tickets: [],
  totalTickets: 0,
  hasMoreTickets: false,
  selectedTicket: null,
  ticketDetails: null,
  isLoading: false,
  error: null,
  fetchTickets: async () => {},
  fetchTicketDetails: async () => {},
  createNewTicket: async () => ({} as SupportTicket),
  addMessage: async () => {},
  updateStatus: async () => ({} as SupportTicket),
  clearSupportError: () => {},
});

export const useSupport = () => useContext(SupportContext);

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [hasMoreTickets, setHasMoreTickets] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Clear tickets when user changes
  useEffect(() => {
    if (!user) {
      setTickets([]);
      setTotalTickets(0);
      setHasMoreTickets(false);
      setSelectedTicket(null);
      setTicketDetails(null);
      
      // Unsubscribe from any active subscriptions
      if (activeSubscription) {
        activeSubscription.unsubscribe();
        setActiveSubscription(null);
      }
    }
  }, [user, activeSubscription]);

  // Fetch tickets
  const fetchTickets = async (
    filters: TicketFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getTickets(filters, pagination);
      
      if (pagination.page === 1) {
        setTickets(response.tickets);
      } else {
        setTickets(prev => [...prev, ...response.tickets]);
      }
      
      setTotalTickets(response.totalCount);
      setHasMoreTickets(response.hasMore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tickets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const details = await getTicketDetails(ticketId);
      setSelectedTicket(details.ticket);
      setTicketDetails(details);
      
      // Set up real-time subscription for this ticket
      if (activeSubscription) {
        activeSubscription.unsubscribe();
      }
      
      const subscription = subscribeToTicketUpdates(ticketId, async () => {
        // Refresh ticket details when a new message is added
        const updatedDetails = await getTicketDetails(ticketId);
        setSelectedTicket(updatedDetails.ticket);
        setTicketDetails(updatedDetails);
      });
      
      setActiveSubscription(subscription);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new ticket
  const createNewTicket = async (params: CreateTicketParams) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newTicket = await createTicket(params);
      
      // Update the tickets list
      setTickets(prev => [newTicket, ...prev]);
      setTotalTickets(prev => prev + 1);
      
      return newTicket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a message to a ticket
  const addMessage = async (params: AddTicketMessageParams) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await addTicketMessage(params);
      
      // The ticket details will be updated via the real-time subscription
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add message';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update ticket status
  const updateStatus = async (params: UpdateTicketStatusParams) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedTicket = await updateTicketStatus(params);
      
      // Update the tickets list
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === params.ticketId ? updatedTicket : ticket
        )
      );
      
      // Update selected ticket if it's the one being updated
      if (selectedTicket && selectedTicket.id === params.ticketId) {
        setSelectedTicket(updatedTicket);
      }
      
      // Update ticket details if they're loaded
      if (ticketDetails && ticketDetails.ticket.id === params.ticketId) {
        setTicketDetails({
          ...ticketDetails,
          ticket: updatedTicket,
        });
      }
      
      return updatedTicket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ticket status';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearSupportError = () => {
    setError(null);
  };

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (activeSubscription) {
        activeSubscription.unsubscribe();
      }
    };
  }, [activeSubscription]);

  const value: SupportContextType = {
    tickets,
    totalTickets,
    hasMoreTickets,
    selectedTicket,
    ticketDetails,
    isLoading,
    error,
    fetchTickets,
    fetchTicketDetails,
    createNewTicket,
    addMessage,
    updateStatus,
    clearSupportError,
  };

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
};