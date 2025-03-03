import { Database } from './supabase';

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];

export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
export type TicketAttachment = Database['public']['Tables']['ticket_attachments']['Row'];

export interface TicketFilters {
  status?: 'open' | 'in_progress' | 'closed' | 'all';
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface TicketListResponse {
  tickets: SupportTicket[];
  totalCount: number;
  hasMore: boolean;
}

export interface TicketDetailsResponse {
  ticket: SupportTicket;
  messages: (TicketMessage & { attachments?: TicketAttachment[] })[];
  attachments: TicketAttachment[];
}

export interface CreateTicketParams {
  title: string;
  description: string;
  deviceId?: string | null;
  attachments?: {
    fileUrl: string;
    fileType: string;
    fileName: string;
  }[];
}

export interface AddTicketMessageParams {
  ticketId: string;
  message: string;
  attachments?: {
    fileUrl: string;
    fileType: string;
    fileName: string;
  }[];
}

export interface UpdateTicketStatusParams {
  ticketId: string;
  status: 'open' | 'in_progress' | 'closed';
}