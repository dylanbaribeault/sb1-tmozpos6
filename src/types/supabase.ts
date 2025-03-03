export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          serial_number: string
          status: 'online' | 'offline'
          battery_level: number
          location: string | null
          user_id: string
          last_detection: string | null
          settings: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          serial_number: string
          status?: 'online' | 'offline'
          battery_level?: number
          location?: string | null
          user_id: string
          last_detection?: string | null
          settings?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          serial_number?: string
          status?: 'online' | 'offline'
          battery_level?: number
          location?: string | null
          user_id?: string
          last_detection?: string | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      device_detections: {
        Row: {
          id: string
          created_at: string
          device_id: string
          detection_type: string
          detection_data: Json | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          detection_type: string
          detection_data?: Json | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          detection_type?: string
          detection_data?: Json | null
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_detections_device_id_fkey"
            columns: ["device_id"]
            referencedRelation: "devices"
            referencedColumns: ["id"]
          }
        ]
      }
      device_images: {
        Row: {
          id: string
          created_at: string
          device_id: string
          url: string
          detection_id: string | null
          local_path?: string | null
          md5_hash?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          device_id: string
          url: string
          detection_id?: string | null
          local_path?: string | null
          md5_hash?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          device_id?: string
          url?: string
          detection_id?: string | null
          local_path?: string | null
          md5_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_images_device_id_fkey"
            columns: ["device_id"]
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_images_detection_id_fkey"
            columns: ["detection_id"]
            referencedRelation: "device_detections"
            referencedColumns: ["id"]
          }
        ]
      }
      support_tickets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'closed'
          user_id: string
          device_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'closed'
          user_id: string
          device_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'closed'
          user_id?: string
          device_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_device_id_fkey"
            columns: ["device_id"]
            referencedRelation: "devices"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_messages: {
        Row: {
          id: string
          created_at: string
          ticket_id: string
          user_id: string
          message: string
          is_from_support: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          ticket_id: string
          user_id: string
          message: string
          is_from_support?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          ticket_id?: string
          user_id?: string
          message?: string
          is_from_support?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_attachments: {
        Row: {
          id: string
          created_at: string
          ticket_id: string
          message_id: string | null
          file_url: string
          file_type: string
          file_name: string
        }
        Insert: {
          id?: string
          created_at?: string
          ticket_id: string
          message_id?: string | null
          file_url: string
          file_type: string
          file_name: string
        }
        Update: {
          id?: string
          created_at?: string
          ticket_id?: string
          message_id?: string | null
          file_url?: string
          file_type?: string
          file_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          notification_preferences: Json | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          notification_preferences?: Json | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          notification_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}