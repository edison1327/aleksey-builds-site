export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      about_content: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          mission: string | null
          mission_en: string | null
          title: string
          title_en: string | null
          updated_at: string
          values: string[] | null
          values_en: string[] | null
          vision: string | null
          vision_en: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          mission?: string | null
          mission_en?: string | null
          title: string
          title_en?: string | null
          updated_at?: string
          values?: string[] | null
          values_en?: string[] | null
          vision?: string | null
          vision_en?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          mission?: string | null
          mission_en?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string
          values?: string[] | null
          values_en?: string[] | null
          vision?: string | null
          vision_en?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_user_id: string | null
          rate_limit_per_min: number
          revoked_at: string | null
          scopes: string[]
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_user_id?: string | null
          rate_limit_per_min?: number
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_user_id?: string | null
          rate_limit_per_min?: number
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          id: number
          ip: string | null
          method: string
          response_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          id?: number
          ip?: string | null
          method: string
          response_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          id?: number
          ip?: string | null
          method?: string
          response_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string
          content_en: string | null
          cover_image: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          excerpt_en: string | null
          id: string
          preview_token: string | null
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          content: string
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          excerpt_en?: string | null
          id?: string
          preview_token?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string
          content_en?: string | null
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          excerpt_en?: string | null
          id?: string
          preview_token?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      company_benefits: {
        Row: {
          created_at: string
          description: string
          description_en: string | null
          icon: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          description_en?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          description_en?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address: string | null
          address_en: string | null
          business_hours: string | null
          business_hours_en: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          google_maps_url: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          business_hours?: string | null
          business_hours_en?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_maps_url?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_en?: string | null
          business_hours?: string | null
          business_hours_en?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_maps_url?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          created_at: string
          crm_next_action: string | null
          crm_next_action_at: string | null
          crm_notes: string | null
          crm_order: number
          crm_stage: Database["public"]["Enums"]["crm_stage"]
          crm_stage_updated_at: string | null
          crm_value_pen: number | null
          deleted_at: string | null
          email: string
          id: string
          is_read: boolean
          landing_page: string | null
          lead_score: number
          location_id: string | null
          message: string
          name: string
          phone: string | null
          referral_code: string | null
          segment: string | null
          status: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          crm_next_action?: string | null
          crm_next_action_at?: string | null
          crm_notes?: string | null
          crm_order?: number
          crm_stage?: Database["public"]["Enums"]["crm_stage"]
          crm_stage_updated_at?: string | null
          crm_value_pen?: number | null
          deleted_at?: string | null
          email: string
          id?: string
          is_read?: boolean
          landing_page?: string | null
          lead_score?: number
          location_id?: string | null
          message: string
          name: string
          phone?: string | null
          referral_code?: string | null
          segment?: string | null
          status?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          crm_next_action?: string | null
          crm_next_action_at?: string | null
          crm_notes?: string | null
          crm_order?: number
          crm_stage?: Database["public"]["Enums"]["crm_stage"]
          crm_stage_updated_at?: string | null
          crm_value_pen?: number | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_read?: boolean
          landing_page?: string | null
          lead_score?: number
          location_id?: string | null
          message?: string
          name?: string
          phone?: string | null
          referral_code?: string | null
          segment?: string | null
          status?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          service_slug: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          service_slug?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          service_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          amount: number | null
          body: string
          code: string
          created_at: string
          currency: string
          customer_address: string | null
          customer_document: string | null
          customer_email: string | null
          customer_name: string
          id: string
          invoice_id: string | null
          notes: string | null
          quote_id: string | null
          sent_at: string | null
          service_slug: string | null
          sign_token: string
          signature_data_url: string | null
          signature_ip: string | null
          signature_user_agent: string | null
          signed_at: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          body: string
          code: string
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_document?: string | null
          customer_email?: string | null
          customer_name: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          quote_id?: string | null
          sent_at?: string | null
          service_slug?: string | null
          sign_token?: string
          signature_data_url?: string | null
          signature_ip?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          body?: string
          code?: string
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          quote_id?: string | null
          sent_at?: string | null
          service_slug?: string | null
          sign_token?: string
          signature_data_url?: string | null
          signature_ip?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checksum: string | null
          client_email: string | null
          created_at: string
          description: string | null
          doc_type: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          file_name: string
          id: string
          is_current: boolean
          issued_at: string | null
          mime_type: string | null
          parent_id: string | null
          size_bytes: number | null
          storage_path: string
          supplier_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number
          visibility: string
        }
        Insert: {
          checksum?: string | null
          client_email?: string | null
          created_at?: string
          description?: string | null
          doc_type?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          file_name: string
          id?: string
          is_current?: boolean
          issued_at?: string | null
          mime_type?: string | null
          parent_id?: string | null
          size_bytes?: number | null
          storage_path: string
          supplier_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          visibility?: string
        }
        Update: {
          checksum?: string | null
          client_email?: string | null
          created_at?: string
          description?: string | null
          doc_type?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          file_name?: string
          id?: string
          is_current?: boolean
          issued_at?: string | null
          mime_type?: string | null
          parent_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          supplier_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string
          employee_id: string
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          cert_number?: string | null
          cert_type: string
          created_at?: string
          employee_id: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          employee_id?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          birth_date: string | null
          branch_id: string | null
          code: string | null
          created_at: string
          currency: string | null
          document: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          location_id: string | null
          monthly_base: number | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          role: string
          status: string
          termination_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string | null
          document?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          location_id?: string | null
          monthly_base?: number | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string
          status?: string
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string | null
          document?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          location_id?: string | null
          monthly_base?: number | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string
          status?: string
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_bookings: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          end_date: string
          equipment_id: string
          equipment_type: string
          id: string
          location_id: string | null
          notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_date: string
          equipment_id: string
          equipment_type: string
          id?: string
          location_id?: string | null
          notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_date?: string
          equipment_id?: string
          equipment_type?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          equipment_id: string
          equipment_type: string
          id: string
          notes: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          equipment_id: string
          equipment_type: string
          id?: string
          notes?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          equipment_id?: string
          equipment_type?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_service_log: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string | null
          equipment_id: string
          equipment_type: string
          hours_added: number | null
          hours_at_service: number | null
          id: string
          notes: string | null
          performed_at: string
          performed_by: string | null
          service_type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          equipment_id: string
          equipment_type: string
          hours_added?: number | null
          hours_at_service?: number | null
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          service_type: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          equipment_id?: string
          equipment_type?: string
          hours_added?: number | null
          hours_at_service?: number | null
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          service_type?: string
        }
        Relationships: []
      }
      error_log: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          resolved: boolean
          severity: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
          severity?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
          severity?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          accident_free_hours: number | null
          active_projects_count: number | null
          background_image_url: string | null
          background_type: string | null
          badge_text: string | null
          badge_text_en: string | null
          clients_percentage: number | null
          created_at: string
          description: string | null
          description_en: string | null
          employees_count: number | null
          engineers_count: number | null
          helpers_count: number | null
          id: string
          overlay_color: string | null
          overlay_opacity: number | null
          projects_count: number | null
          subtitle: string
          subtitle_en: string | null
          technicians_count: number | null
          title: string
          title_en: string | null
          updated_at: string
          video_url: string | null
          years_count: number | null
        }
        Insert: {
          accident_free_hours?: number | null
          active_projects_count?: number | null
          background_image_url?: string | null
          background_type?: string | null
          badge_text?: string | null
          badge_text_en?: string | null
          clients_percentage?: number | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          employees_count?: number | null
          engineers_count?: number | null
          helpers_count?: number | null
          id?: string
          overlay_color?: string | null
          overlay_opacity?: number | null
          projects_count?: number | null
          subtitle?: string
          subtitle_en?: string | null
          technicians_count?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
          video_url?: string | null
          years_count?: number | null
        }
        Update: {
          accident_free_hours?: number | null
          active_projects_count?: number | null
          background_image_url?: string | null
          background_type?: string | null
          badge_text?: string | null
          badge_text_en?: string | null
          clients_percentage?: number | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          employees_count?: number | null
          engineers_count?: number | null
          helpers_count?: number | null
          id?: string
          overlay_color?: string | null
          overlay_opacity?: number | null
          projects_count?: number | null
          subtitle?: string
          subtitle_en?: string | null
          technicians_count?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
          video_url?: string | null
          years_count?: number | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: string
          notes: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          booking_id: string | null
          branch_id: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_tax_id: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms: string | null
          total: number
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          amount_paid?: number
          booking_id?: string | null
          branch_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_tax_id?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          amount_paid?: number
          booking_id?: string | null
          branch_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_tax_id?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "equipment_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string
          position: string
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          position: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          position?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_positions: {
        Row: {
          created_at: string
          department: string
          department_en: string | null
          description: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          location: string
          location_en: string | null
          location_id: string | null
          requirements: Json | null
          requirements_en: Json | null
          salary: string | null
          sort_order: number | null
          title: string
          title_en: string | null
          type: string
          type_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          department_en?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          location_en?: string | null
          location_id?: string | null
          requirements?: Json | null
          requirements_en?: Json | null
          salary?: string | null
          sort_order?: number | null
          title: string
          title_en?: string | null
          type?: string
          type_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          department_en?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          location_en?: string | null
          location_id?: string | null
          requirements?: Json | null
          requirements_en?: Json | null
          salary?: string | null
          sort_order?: number | null
          title?: string
          title_en?: string | null
          type?: string
          type_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_positions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_rules: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          name: string
          points: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          name: string
          points?: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          days: number | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days?: number | null
          employee_id: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          hours: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      machinery: {
        Row: {
          branch_id: string | null
          brand: string | null
          category: string | null
          category_en: string | null
          created_at: string
          daily_rate: number | null
          deposit_amount: number | null
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean
          is_marketplace: boolean
          location_id: string | null
          min_rental_days: number
          model: string | null
          name: string
          name_en: string | null
          next_service_hours: number | null
          price: string | null
          rental_terms: string | null
          service_interval_hours: number | null
          sort_order: number | null
          specs: Json | null
          updated_at: string
          usage_hours: number | null
        }
        Insert: {
          branch_id?: string | null
          brand?: string | null
          category?: string | null
          category_en?: string | null
          created_at?: string
          daily_rate?: number | null
          deposit_amount?: number | null
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean
          is_marketplace?: boolean
          location_id?: string | null
          min_rental_days?: number
          model?: string | null
          name: string
          name_en?: string | null
          next_service_hours?: number | null
          price?: string | null
          rental_terms?: string | null
          service_interval_hours?: number | null
          sort_order?: number | null
          specs?: Json | null
          updated_at?: string
          usage_hours?: number | null
        }
        Update: {
          branch_id?: string | null
          brand?: string | null
          category?: string | null
          category_en?: string | null
          created_at?: string
          daily_rate?: number | null
          deposit_amount?: number | null
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean
          is_marketplace?: boolean
          location_id?: string | null
          min_rental_days?: number
          model?: string | null
          name?: string
          name_en?: string | null
          next_service_hours?: number | null
          price?: string | null
          rental_terms?: string | null
          service_interval_hours?: number | null
          sort_order?: number | null
          specs?: Json | null
          updated_at?: string
          usage_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaign_steps: {
        Row: {
          body: string
          campaign_id: string
          created_at: string
          delay_hours: number
          id: string
          step_order: number
          subject: string | null
        }
        Insert: {
          body: string
          campaign_id: string
          created_at?: string
          delay_hours?: number
          id?: string
          step_order?: number
          subject?: string | null
        }
        Update: {
          body?: string
          campaign_id?: string
          created_at?: string
          delay_hours?: number
          id?: string
          step_order?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          channel: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          segment_filter: Json
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          segment_filter?: Json
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          segment_filter?: Json
          updated_at?: string
        }
        Relationships: []
      }
      marketing_enrollments: {
        Row: {
          campaign_id: string
          created_at: string
          current_step: number
          id: string
          lead_id: string
          next_send_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_step?: number
          id?: string
          lead_id: string
          next_send_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_step?: number
          id?: string
          lead_id?: string
          next_send_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          author_id: string | null
          author_name: string | null
          author_role: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          message_id: string
          read_by_admin: boolean
          read_by_customer: boolean
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          author_role: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          message_id: string
          read_by_admin?: boolean
          read_by_customer?: boolean
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          message_id?: string
          read_by_admin?: boolean
          read_by_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          label_en: string | null
          location: string
          path: string
          sort_order: number | null
          title: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_en?: string | null
          location?: string
          path: string
          sort_order?: number | null
          title?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_en?: string | null
          location?: string
          path?: string
          sort_order?: number | null
          title?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          legal_name: string | null
          logo_url: string | null
          name: string
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          base_pay: number | null
          bonuses: number | null
          created_at: string
          deductions: number | null
          employee_id: string
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          net_pay: number | null
          notes: string | null
          payroll_run_id: string
          updated_at: string
        }
        Insert: {
          base_pay?: number | null
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          employee_id: string
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          net_pay?: number | null
          notes?: string | null
          payroll_run_id: string
          updated_at?: string
        }
        Update: {
          base_pay?: number | null
          bonuses?: number | null
          created_at?: string
          deductions?: number | null
          employee_id?: string
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          net_pay?: number | null
          notes?: string | null
          payroll_run_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          processed_at: string | null
          processed_by: string | null
          status: string
          total_gross: number | null
          total_net: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pdf_settings: {
        Row: {
          address: string | null
          company_name: string
          created_at: string
          email: string | null
          footer_note: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary_color: string
          tagline: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      po_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string
          notes: string | null
          paid_at: string
          purchase_order_id: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          purchase_order_id: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          purchase_order_id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          notes: string | null
          planned_amount: number
          project_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          branch_id: string | null
          category: string | null
          category_en: string | null
          challenge: string | null
          challenge_en: string | null
          client: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          description_en: string | null
          duration: string | null
          duration_en: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_case_study: boolean
          is_featured: boolean | null
          location: string | null
          location_en: string | null
          metrics: Json
          outcome: string | null
          outcome_en: string | null
          preview_token: string | null
          services_used: string[]
          slug: string | null
          solution: string | null
          solution_en: string | null
          sort_order: number | null
          title: string
          title_en: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          branch_id?: string | null
          category?: string | null
          category_en?: string | null
          challenge?: string | null
          challenge_en?: string | null
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_en?: string | null
          duration?: string | null
          duration_en?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_case_study?: boolean
          is_featured?: boolean | null
          location?: string | null
          location_en?: string | null
          metrics?: Json
          outcome?: string | null
          outcome_en?: string | null
          preview_token?: string | null
          services_used?: string[]
          slug?: string | null
          solution?: string | null
          solution_en?: string | null
          sort_order?: number | null
          title: string
          title_en?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          branch_id?: string | null
          category?: string | null
          category_en?: string | null
          challenge?: string | null
          challenge_en?: string | null
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_en?: string | null
          duration?: string | null
          duration_en?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_case_study?: boolean
          is_featured?: boolean | null
          location?: string | null
          location_en?: string | null
          metrics?: Json
          outcome?: string | null
          outcome_en?: string | null
          preview_token?: string | null
          services_used?: string[]
          slug?: string | null
          solution?: string | null
          solution_en?: string | null
          sort_order?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          purchase_order_id: string
          quantity: number
          received_qty: number
          subtotal: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          purchase_order_id: string
          quantity?: number
          received_qty?: number
          subtotal?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          purchase_order_id?: string
          quantity?: number
          received_qty?: number
          subtotal?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_paid: number
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          delivered_at: string | null
          expected_at: string | null
          id: string
          notes: string | null
          payment_status: string
          payment_terms: string | null
          requisition_id: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          tax: number
          title: string
          total: number
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          amount_paid?: number
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          delivered_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          payment_terms?: string | null
          requisition_id?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          title: string
          total?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          amount_paid?: number
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          delivered_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          payment_terms?: string | null
          requisition_id?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_reception_items: {
        Row: {
          id: string
          notes: string | null
          po_item_id: string
          quantity: number
          reception_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          po_item_id: string
          quantity?: number
          reception_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          po_item_id?: string
          quantity?: number
          reception_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_reception_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_reception_items_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "purchase_receptions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receptions: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_note: string | null
          id: string
          notes: string | null
          purchase_order_id: string
          received_at: string
          received_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_note?: string | null
          id?: string
          notes?: string | null
          purchase_order_id: string
          received_at?: string
          received_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_note?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string
          received_at?: string
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receptions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code_used: string
          contact_message_id: string | null
          converted_at: string | null
          created_at: string
          id: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          reward_note: string | null
          source: string | null
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          code_used: string
          contact_message_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          reward_note?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          code_used?: string
          contact_message_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_note?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_contact_message_id_fkey"
            columns: ["contact_message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          message: string
          name: string
          offset_hours: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          message: string
          name: string
          offset_hours?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          message?: string
          name?: string
          offset_hours?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      requisition_items: {
        Row: {
          created_at: string
          description: string
          id: string
          notes: string | null
          quantity: number
          requisition_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          quantity?: number
          requisition_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          quantity?: number
          requisition_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          code: string
          converted_po_id: string | null
          created_at: string
          id: string
          notes: string | null
          requester_id: string | null
          requester_name: string | null
          status: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          code: string
          converted_po_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requester_id?: string | null
          requester_name?: string | null
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          code?: string
          converted_po_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requester_id?: string | null
          requester_name?: string | null
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_converted_po_id_fkey"
            columns: ["converted_po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      response_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rfq_invitations: {
        Row: {
          access_token: string
          created_at: string
          id: string
          rfq_id: string
          sent_at: string | null
          status: string
          supplier_id: string
          viewed_at: string | null
        }
        Insert: {
          access_token?: string
          created_at?: string
          id?: string
          rfq_id: string
          sent_at?: string | null
          status?: string
          supplier_id: string
          viewed_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          rfq_id?: string
          sent_at?: string | null
          status?: string
          supplier_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_invitations_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_invitations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          rfq_id: string
          sort_order: number
          specifications: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          rfq_id: string
          sort_order?: number
          specifications?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          rfq_id?: string
          sort_order?: number
          specifications?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_responses: {
        Row: {
          created_at: string
          currency: string
          delivery_days: number | null
          id: string
          invitation_id: string | null
          items_json: Json
          notes: string | null
          payment_terms: string | null
          rfq_id: string
          status: string
          submitted_at: string
          submitted_ip: string | null
          supplier_id: string
          total_amount: number
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          id?: string
          invitation_id?: string | null
          items_json?: Json
          notes?: string | null
          payment_terms?: string | null
          rfq_id: string
          status?: string
          submitted_at?: string
          submitted_ip?: string | null
          supplier_id: string
          total_amount?: number
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          id?: string
          invitation_id?: string | null
          items_json?: Json
          notes?: string | null
          payment_terms?: string | null
          rfq_id?: string
          status?: string
          submitted_at?: string
          submitted_ip?: string | null
          supplier_id?: string
          total_amount?: number
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "rfq_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          awarded_response_id: string | null
          branch_id: string | null
          category: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          deadline: string | null
          description: string | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          awarded_response_id?: string | null
          branch_id?: string | null
          category?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          awarded_response_id?: string | null
          branch_id?: string | null
          category?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          features: string[] | null
          features_en: string[] | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          features?: string[] | null
          features_en?: string[] | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          features?: string[] | null
          features_en?: string[] | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          company_name: string | null
          created_at: string
          footer_copyright: string | null
          footer_copyright_en: string | null
          footer_description: string | null
          footer_description_en: string | null
          id: string
          logo_url: string | null
          tagline: string | null
          tagline_en: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          footer_copyright?: string | null
          footer_copyright_en?: string | null
          footer_description?: string | null
          footer_description_en?: string | null
          id?: string
          logo_url?: string | null
          tagline?: string | null
          tagline_en?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          footer_copyright?: string | null
          footer_copyright_en?: string | null
          footer_description?: string | null
          footer_description_en?: string | null
          id?: string
          logo_url?: string | null
          tagline?: string | null
          tagline_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          platform: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          branch_id: string | null
          created_at: string
          current_qty: number
          id: string
          is_active: boolean
          location: string | null
          min_qty: number
          name: string
          notes: string | null
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          current_qty?: number
          id?: string
          is_active?: boolean
          location?: string | null
          min_qty?: number
          name: string
          notes?: string | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          current_qty?: number
          id?: string
          is_active?: boolean
          location?: string | null
          min_qty?: number
          name?: string
          notes?: string | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          po_id: string | null
          quantity: number
          reference: string | null
          stock_item_id: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          po_id?: string | null
          quantity: number
          reference?: string | null
          stock_item_id: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          po_id?: string | null
          quantity?: number
          reference?: string | null
          stock_item_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontracts: {
        Row: {
          amount: number | null
          code: string
          created_at: string
          currency: string
          end_date: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          scope: string | null
          start_date: string | null
          status: string
          supplier_id: string
          title: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          amount?: number | null
          code: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          scope?: string | null
          start_date?: string | null
          status?: string
          supplier_id: string
          title: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          amount?: number | null
          code?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          scope?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string
          title?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontracts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_badge_awards: {
        Row: {
          awarded_at: string
          badge_id: string
          created_at: string
          id: string
          notes: string | null
          supplier_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          created_at?: string
          id?: string
          notes?: string | null
          supplier_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "supplier_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_badge_awards_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_badges: {
        Row: {
          code: string
          color: string | null
          created_at: string
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      supplier_certifications: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          notes: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          cert_number?: string | null
          cert_type: string
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          notes?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          notes?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_evaluations: {
        Row: {
          comments: string | null
          communication_score: number
          created_at: string
          evaluated_at: string
          evaluated_by: string | null
          id: string
          overall_score: number | null
          project_id: string | null
          project_name: string | null
          punctuality_score: number
          quality_score: number
          safety_score: number
          subcontract_id: string | null
          supplier_id: string
          updated_at: string
          would_rehire: boolean
        }
        Insert: {
          comments?: string | null
          communication_score: number
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          id?: string
          overall_score?: number | null
          project_id?: string | null
          project_name?: string | null
          punctuality_score: number
          quality_score: number
          safety_score: number
          subcontract_id?: string | null
          supplier_id: string
          updated_at?: string
          would_rehire?: boolean
        }
        Update: {
          comments?: string | null
          communication_score?: number
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          id?: string
          overall_score?: number | null
          project_id?: string | null
          project_name?: string | null
          punctuality_score?: number
          quality_score?: number
          safety_score?: number
          subcontract_id?: string | null
          supplier_id?: string
          updated_at?: string
          would_rehire?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "supplier_evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_evaluations_subcontract_id_fkey"
            columns: ["subcontract_id"]
            isOneToOne: false
            referencedRelation: "subcontracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_evaluations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          ruc: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          ruc?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          ruc?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_stats: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          label_en: string | null
          sort_order: number | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_en?: string | null
          sort_order?: number | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_en?: string | null
          sort_order?: number | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          booking_id: string | null
          company: string
          company_en: string | null
          content: string
          content_en: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number
          role: string
          role_en: string | null
          sort_order: number | null
          status: string
          submitted_by_email: string | null
          updated_at: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          booking_id?: string | null
          company: string
          company_en?: string | null
          content: string
          content_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          rating?: number
          role: string
          role_en?: string | null
          sort_order?: number | null
          status?: string
          submitted_by_email?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          booking_id?: string | null
          company?: string
          company_en?: string | null
          content?: string
          content_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number
          role?: string
          role_en?: string | null
          sort_order?: number | null
          status?: string
          submitted_by_email?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "equipment_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          check_in: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_out: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          created_at: string
          employee_id: string
          entry_date: string
          hours: number | null
          id: string
          notes: string | null
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          check_in?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          employee_id: string
          entry_date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          check_in?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          employee_id?: string
          entry_date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role_in_branch: string | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role_in_branch?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role_in_branch?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          branch_id: string | null
          brand: string | null
          category: string | null
          category_en: string | null
          created_at: string
          daily_rate: number | null
          deposit_amount: number | null
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean
          is_marketplace: boolean
          location_id: string | null
          min_rental_days: number
          model: string | null
          name: string
          name_en: string | null
          next_service_hours: number | null
          price: string | null
          rental_terms: string | null
          service_interval_hours: number | null
          sort_order: number | null
          specs: Json | null
          updated_at: string
          usage_hours: number | null
        }
        Insert: {
          branch_id?: string | null
          brand?: string | null
          category?: string | null
          category_en?: string | null
          created_at?: string
          daily_rate?: number | null
          deposit_amount?: number | null
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean
          is_marketplace?: boolean
          location_id?: string | null
          min_rental_days?: number
          model?: string | null
          name: string
          name_en?: string | null
          next_service_hours?: number | null
          price?: string | null
          rental_terms?: string | null
          service_interval_hours?: number | null
          sort_order?: number | null
          specs?: Json | null
          updated_at?: string
          usage_hours?: number | null
        }
        Update: {
          branch_id?: string | null
          brand?: string | null
          category?: string | null
          category_en?: string | null
          created_at?: string
          daily_rate?: number | null
          deposit_amount?: number | null
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean
          is_marketplace?: boolean
          location_id?: string | null
          min_rental_days?: number
          model?: string | null
          name?: string
          name_en?: string | null
          next_service_hours?: number | null
          price?: string | null
          rental_terms?: string | null
          service_interval_hours?: number | null
          sort_order?: number | null
          specs?: Json | null
          updated_at?: string
          usage_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          event: string
          id: string
          ok: boolean
          payload: Json
          response: string | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ok?: boolean
          payload: Json
          response?: string | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ok?: boolean
          payload?: Json
          response?: string | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      work_order_incidents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          photo_url: string | null
          reported_by: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_incidents_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_material_reservations: {
        Row: {
          consumed_at: string | null
          created_at: string
          id: string
          notes: string | null
          quantity: number
          requested_by: string | null
          status: string
          stock_item_id: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quantity: number
          requested_by?: string | null
          status?: string
          stock_item_id: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          requested_by?: string | null
          status?: string
          stock_item_id?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_material_reservations_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_material_reservations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: string
          lat: number | null
          lng: number | null
          storage_path: string
          uploaded_by: string | null
          work_order_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          storage_path: string
          uploaded_by?: string | null
          work_order_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          storage_path?: string
          uploaded_by?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          branch_id: string | null
          checklist: Json
          client_signature_at: string | null
          client_signature_name: string | null
          client_signature_url: string | null
          code: string
          completed_at: string | null
          completion_lat: number | null
          completion_lng: number | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          equipment_id: string | null
          equipment_type: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          site_address: string | null
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          branch_id?: string | null
          checklist?: Json
          client_signature_at?: string | null
          client_signature_name?: string | null
          client_signature_url?: string | null
          code?: string
          completed_at?: string | null
          completion_lat?: number | null
          completion_lng?: number | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          equipment_id?: string | null
          equipment_type?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_address?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          branch_id?: string | null
          checklist?: Json
          client_signature_at?: string | null
          client_signature_name?: string | null
          client_signature_url?: string | null
          code?: string
          completed_at?: string | null
          completion_lat?: number | null
          completion_lng?: number | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          equipment_id?: string | null
          equipment_type?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_address?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      marketplace_listings: {
        Row: {
          branch_id: string | null
          brand: string | null
          category: string | null
          daily_rate: number | null
          deposit_amount: number | null
          description: string | null
          description_en: string | null
          equipment_type: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          location_id: string | null
          min_rental_days: number | null
          model: string | null
          name: string | null
          name_en: string | null
          price: string | null
          rental_terms: string | null
          sort_order: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_invite_top_suppliers: {
        Args: { _limit?: number; _rfq_id: string }
        Returns: number
      }
      award_supplier_badges: { Args: never; Returns: number }
      check_equipment_availability: {
        Args: {
          _end_date: string
          _equipment_id: string
          _equipment_type: string
          _start_date: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _bucket: string
          _identifier: string
          _max_requests: number
          _window_seconds: number
        }
        Returns: boolean
      }
      create_api_key: {
        Args: {
          _expires_at?: string
          _name: string
          _rate_limit?: number
          _scopes?: string[]
        }
        Returns: {
          id: string
          key_prefix: string
          raw_key: string
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
      get_cash_forecast: {
        Args: never
        Returns: {
          inflow: number
          net: number
          outflow: number
          week: string
        }[]
      }
      get_consolidated_pnl: {
        Args: { _from?: string; _to?: string }
        Returns: {
          branch_id: string
          branch_name: string
          invoiced: number
          labor_cost: number
          net: number
          organization_id: string
          organization_name: string
          paid: number
          purchase_cost: number
        }[]
      }
      get_contract_by_token: {
        Args: { _token: string }
        Returns: {
          amount: number
          body: string
          code: string
          currency: string
          customer_address: string
          customer_document: string
          customer_email: string
          customer_name: string
          id: string
          sent_at: string
          service_slug: string
          signature_data_url: string
          signed_at: string
          status: string
          title: string
        }[]
      }
      get_cross_sell: {
        Args: never
        Returns: {
          pair_count: number
          service_a: string
          service_b: string
        }[]
      }
      get_customer_churn: {
        Args: never
        Returns: {
          customer_email: string
          customer_name: string
          days_inactive: number
          last_activity: string
          total_orders: number
        }[]
      }
      get_demand_forecast: {
        Args: never
        Returns: {
          bookings: number
          forecast_next: number
          month: string
          service: string
        }[]
      }
      get_expiring_documents: {
        Args: { _days?: number }
        Returns: {
          days_left: number
          doc_type: string
          expires_at: string
          id: string
          title: string
        }[]
      }
      get_maintenance_predictions: {
        Args: never
        Returns: {
          hours_remaining: number
          machinery_id: string
          name: string
          next_service_hours: number
          risk: string
          usage_hours: number
        }[]
      }
      get_monthly_pnl: {
        Args: never
        Returns: {
          invoiced: number
          labor_cost: number
          month: string
          net: number
          paid: number
          purchase_cost: number
        }[]
      }
      get_pending_supplier_evaluations: {
        Args: never
        Returns: {
          days_overdue: number
          end_date: string
          subcontract_code: string
          subcontract_id: string
          subcontract_title: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_project_pnl: {
        Args: never
        Returns: {
          invoiced_total: number
          labor_cost: number
          margin: number
          margin_pct: number
          materials_cost: number
          paid_total: number
          planned_total: number
          project_id: string
          project_title: string
          subcontract_cost: number
          total_cost: number
        }[]
      }
      get_rfq_by_token: {
        Args: { _token: string }
        Returns: {
          category: string
          code: string
          currency: string
          deadline: string
          description: string
          invitation_id: string
          items: Json
          rfq_id: string
          status: string
          supplier_id: string
          supplier_name: string
          title: string
        }[]
      }
      get_supplier_gamification: {
        Args: { _supplier_id?: string }
        Returns: {
          badge_codes: string[]
          badges_count: number
          category: string
          evaluations_count: number
          points: number
          rank: number
          rating: number
          supplier_id: string
          supplier_name: string
          tier: string
        }[]
      }
      get_top_suppliers: {
        Args: { _category?: string; _limit?: number }
        Returns: {
          category: string
          email: string
          evaluations_count: number
          last_evaluated_at: string
          name: string
          rating: number
          supplier_id: string
          would_rehire_pct: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_text: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          _link: string
          _message: string
          _metadata?: Json
          _title: string
          _type: string
        }
        Returns: undefined
      }
      notify_pending_supplier_evaluations: { Args: never; Returns: number }
      sign_contract_with_token: {
        Args: {
          _ip: string
          _signature_data_url: string
          _token: string
          _ua: string
        }
        Returns: boolean
      }
      slugify: { Args: { input: string }; Returns: string }
      submit_rfq_response: {
        Args: {
          _currency: string
          _delivery_days: number
          _ip: string
          _items: Json
          _notes: string
          _payment_terms: string
          _token: string
          _total: number
          _validity_days: number
        }
        Returns: string
      }
      user_has_branch_access: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      verify_api_key: {
        Args: { _raw_key: string }
        Returns: {
          id: string
          owner_user_id: string
          rate_limit_per_min: number
          scopes: string[]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "viewer" | "client"
      crm_stage: "new" | "contacted" | "quoted" | "negotiation" | "won" | "lost"
      referral_status: "pending" | "registered" | "converted" | "rewarded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "editor", "viewer", "client"],
      crm_stage: ["new", "contacted", "quoted", "negotiation", "won", "lost"],
      referral_status: ["pending", "registered", "converted", "rewarded"],
    },
  },
} as const
