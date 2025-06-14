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
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          full_name: string | null
          company_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          id: string
          user_id: string
          name: string
          goal: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
          date_range_start: string
          date_range_end: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
          completed_at: string | null
          analysis_result: Json | null
          performance_metrics: Json | null
          recommendations: Json | null
          recommendations_generated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          goal: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
          date_range_start: string
          date_range_end: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          analysis_result?: Json | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          recommendations_generated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          goal?: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
          date_range_start?: string
          date_range_end?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          analysis_result?: Json | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          recommendations_generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audits_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      audit_files: {
        Row: {
          id: string
          audit_id: string
          file_type: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
          original_filename: string
          storage_path: string
          file_size_bytes: number
          status: 'pending' | 'processing' | 'completed' | 'error' | 'warning'
          created_at: string
          updated_at: string
          processed_at: string | null
          validation_result: Json | null
          error_message: string | null
          parsed_data: Json | null
        }
        Insert: {
          id?: string
          audit_id: string
          file_type: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
          original_filename: string
          storage_path: string
          file_size_bytes: number
          status?: 'pending' | 'processing' | 'completed' | 'error' | 'warning'
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          validation_result?: Json | null
          error_message?: string | null
          parsed_data?: Json | null
        }
        Update: {
          id?: string
          audit_id?: string
          file_type?: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
          original_filename?: string
          storage_path?: string
          file_size_bytes?: number
          status?: 'pending' | 'processing' | 'completed' | 'error' | 'warning'
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          validation_result?: Json | null
          error_message?: string | null
          parsed_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_files_audit_id_fkey'
            columns: ['audit_id']
            referencedRelation: 'audits'
            referencedColumns: ['id']
          }
        ]
      }
      parsed_data: {
        Row: {
          id: string
          file_id: string
          file_type: string
          row_number: number
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          file_type: string
          row_number: number
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          file_type?: string
          row_number?: number
          data?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'parsed_data_file_id_fkey'
            columns: ['file_id']
            referencedRelation: 'audit_files'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      user_audit_summary: {
        Row: {
          user_id: string | null
          total_audits: number | null
          completed_audits: number | null
          pending_audits: number | null
          last_audit_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {
      audit_goal: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
      audit_status: 'pending' | 'processing' | 'completed' | 'failed'
      file_status: 'pending' | 'processing' | 'completed' | 'error' | 'warning'
      file_type: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
    }
    CompositeTypes: {}
  }
}