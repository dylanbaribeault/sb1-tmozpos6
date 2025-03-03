import { supabase, handleSupabaseError } from '../lib/supabase';
import { 
  SupportTicket, 
  SupportTicketInsert, 
  SupportTicketUpdate, 
  TicketFilters, 
  PaginationParams, 
  TicketListResponse,
  TicketDetailsResponse,
  CreateTicketParams,
  AddTicketMessageParams,
  UpdateTicketStatusParams
} from '../types/support';
import { getCurrentUser } from './authService';

/**
 * Fetch support tickets with pagination and filtering
 * @param filters - Optional filters for the query
 * @param pagination - Pagination parameters
 * @returns Promise with tickets data
 */
export const getTickets = async (
  filters: TicketFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<TicketListResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building the query
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortOrder || 'desc';
      query = query.order(filters.sortBy, { ascending: order === 'asc' });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) throw error;

    return {
      tickets: data || [],
      totalCount: count || 0,
      hasMore: count ? from + pageSize < count : false,
    };
  } catch (error) {
    console.error('Get tickets error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Fetch a single ticket by ID with messages and attachments
 * @param ticketId - The ID of the ticket to fetch
 * @returns Promise with ticket details
 */
export const getTicketDetails = async (ticketId: string): Promise<TicketDetailsResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Ticket not found');

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId);

    if (attachmentsError) throw attachmentsError;

    // Group attachments by message
    const messagesWithAttachments = (messages || []).map(message => {
      const messageAttachments = (attachments || []).filter(
        attachment => attachment.message_id === message.id
      );
      
      return {
        ...message,
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
      };
    });

    // Get ticket-level attachments (not associated with any message)
    const ticketAttachments = (attachments || []).filter(
      attachment => !attachment.message_id
    );

    return {
      ticket,
      messages: messagesWithAttachments,
      attachments: ticketAttachments,
    };
  } catch (error) {
    console.error('Get ticket details error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Create a new support ticket
 * @param params - The ticket data to create
 * @returns Promise with the created ticket
 */
export const createTicket = async (params: CreateTicketParams): Promise<SupportTicket> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!params.title || !params.title.trim()) {
      throw new Error('Ticket title is required');
    }
    
    if (!params.description || !params.description.trim()) {
      throw new Error('Ticket description is required');
    }

    // Start a transaction
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        title: params.title,
        description: params.description,
        status: 'open',
        user_id: user.id,
        device_id: params.deviceId || null,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Failed to create ticket');

    // Add the initial message (the description)
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: params.description,
        is_from_support: false,
      });

    if (messageError) throw messageError;

    // Add attachments if any
    if (params.attachments && params.attachments.length > 0) {
      const attachmentsToInsert = params.attachments.map(attachment => ({
        ticket_id: ticket.id,
        file_url: attachment.fileUrl,
        file_type: attachment.fileType,
        file_name: attachment.fileName,
      }));

      const { error: attachmentsError } = await supabase
        .from('ticket_attachments')
        .insert(attachmentsToInsert);

      if (attachmentsError) throw attachmentsError;
    }

    return ticket;
  } catch (error) {
    console.error('Create ticket error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Add a message to an existing ticket
 * @param params - The message data to add
 * @returns Promise with the created message
 */
export const addTicketMessage = async (params: AddTicketMessageParams) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!params.ticketId) {
      throw new Error('Ticket ID is required');
    }
    
    if (!params.message || !params.message.trim()) {
      throw new Error('Message content is required');
    }

    // Check if ticket exists and belongs to user
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', params.ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) {
      throw new Error('Ticket not found or you do not have permission to add a message');
    }

    // Add the message
    const { data: message, error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        user_id: user.id,
        message: params.message,
        is_from_support: false,
      })
      .select()
      .single();

    if (messageError) throw messageError;
    if (!message) throw new Error('Failed to add message');

    // Update ticket's updated_at timestamp
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.ticketId);

    if (updateError) throw updateError;

    // Add attachments if any
    if (params.attachments && params.attachments.length > 0) {
      const attachmentsToInsert = params.attachments.map(attachment => ({
        ticket_id: params.ticketId,
        message_id: message.id,
        file_url: attachment.fileUrl,
        file_type: attachment.fileType,
        file_name: attachment.fileName,
      }));

      const { error: attachmentsError } = await supabase
        .from('ticket_attachments')
        .insert(attachmentsToInsert);

      if (attachmentsError) throw attachmentsError;
    }

    return message;
  } catch (error) {
    console.error('Add ticket message error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Update a ticket's status
 * @param params - The status update parameters
 * @returns Promise with the updated ticket
 */
export const updateTicketStatus = async (params: UpdateTicketStatusParams): Promise<SupportTicket> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if ticket exists and belongs to user
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      . select('*')
      .eq('id', params.ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) {
      throw new Error('Ticket not found or you do not have permission to update it');
    }

    // Update the ticket status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: params.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.ticketId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedTicket) throw new Error('Failed to update ticket status');

    // Add a system message about the status change
    const statusMessage = `Ticket status changed to ${params.status}`;
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        user_id: user.id,
        message: statusMessage,
        is_from_support: false,
      });

    if (messageError) {
      console.error('Error adding status change message:', messageError);
      // We don't throw here because the status was updated successfully
    }

    return updatedTicket;
  } catch (error) {
    console.error('Update ticket status error:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Subscribe to real-time ticket updates
 * @param ticketId - The ID of the ticket to subscribe to
 * @param callback - Function to call when ticket is updated
 * @returns Subscription object with unsubscribe method
 */
export const subscribeToTicketUpdates = (ticketId: string, callback: (payload: any) => void) => {
  const subscription = supabase
    .channel(`ticket-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
};