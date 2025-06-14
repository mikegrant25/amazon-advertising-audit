export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          analysis_results: Json | null
          recommendations: Json | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          goal: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
          date_range_start: string
          date_range_end: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          analysis_results?: Json | null
          recommendations?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          goal?: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
          date_range_start?: string
          date_range_end?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          analysis_results?: Json | null
          recommendations?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          file_hash: string | null
          status: 'pending' | 'processing' | 'processed' | 'failed'
          error_message: string | null
          processed_data: Json | null
          created_at: string
          updated_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          audit_id: string
          file_type: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
          original_filename: string
          storage_path: string
          file_size_bytes: number
          file_hash?: string | null
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          error_message?: string | null
          processed_data?: Json | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          audit_id?: string
          file_type?: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
          original_filename?: string
          storage_path?: string
          file_size_bytes?: number
          file_hash?: string | null
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          error_message?: string | null
          processed_data?: Json | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_files_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_audit_summary: {
        Row: {
          user_id: string
          email: string
          total_audits: number
          completed_audits: number
          processing_audits: number
          last_audit_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {
      audit_goal: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
      audit_status: 'pending' | 'processing' | 'completed' | 'failed'
      file_status: 'pending' | 'processing' | 'processed' | 'failed'
      file_type: 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'
    }
    CompositeTypes: {}
  }
}