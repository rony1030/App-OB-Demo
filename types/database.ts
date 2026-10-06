// Generated from Supabase; Insert.public_code is optional because BEFORE INSERT triggers assign it.
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          completed_at: string | null
          contact_id: number | null
          created_at: string
          created_by: string | null
          details: string | null
          due_at: string | null
          id: number
          kind: string
          opportunity_id: number | null
          organization_id: number
          subject: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: never
          kind: string
          opportunity_id?: number | null
          organization_id: number
          subject: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: never
          kind?: string
          opportunity_id?: number | null
          organization_id?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_onboarding_submissions: {
        Row: {
          agency_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: number
          invitation_id: number
          legal_address: string | null
          legal_name: string | null
          organization_id: number
          representative_email: string
          representative_name: string
          representative_phone: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_payload: Json
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          agency_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: never
          invitation_id: number
          legal_address?: string | null
          legal_name?: string | null
          organization_id: number
          representative_email: string
          representative_name: string
          representative_phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_payload?: Json
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: never
          invitation_id?: number
          legal_address?: string | null
          legal_name?: string | null
          organization_id?: number
          representative_email?: string
          representative_name?: string
          representative_phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_payload?: Json
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_onboarding_submissions_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_onboarding_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_document_requirements: {
        Row: {
          created_at: string
          document_type: string
          id: number
          is_required: boolean
          label: string | null
          master_broker_organization_id: number
          project_id: number | null
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: never
          is_required?: boolean
          label?: string | null
          master_broker_organization_id: number
          project_id?: number | null
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: never
          is_required?: boolean
          label?: string | null
          master_broker_organization_id?: number
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_document_requiremen_master_broker_organization_i_fkey"
            columns: ["master_broker_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_document_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_notification_recipients: {
        Row: {
          created_at: string
          email: string
          id: number
          is_active: boolean
          label: string | null
          organization_id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "agreement_notification_recipients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          broker_organization_id: number
          commission_rate: number | null
          commission_terms: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: number
          is_manual: boolean
          kind: string
          manual_upload_bucket: string | null
          manual_upload_path: string | null
          master_broker_organization_id: number
          master_broker_rep_email: string | null
          master_broker_rep_id: string | null
          master_broker_rep_name: string | null
          master_broker_rep_position: string | null
          project_id: number | null
          public_code: string
          revoked_at: string | null
          signature_document_id: number | null
          signed_at: string | null
          signer_membership_id: number | null
          status: string
          updated_at: string
          valid_months: number
        }
        Insert: {
          broker_organization_id: number
          commission_rate?: number | null
          commission_terms?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: never
          is_manual?: boolean
          kind?: string
          manual_upload_bucket?: string | null
          manual_upload_path?: string | null
          master_broker_organization_id: number
          master_broker_rep_email?: string | null
          master_broker_rep_id?: string | null
          master_broker_rep_name?: string | null
          master_broker_rep_position?: string | null
          project_id?: number | null
          public_code?: string
          revoked_at?: string | null
          signature_document_id?: number | null
          signed_at?: string | null
          signer_membership_id?: number | null
          status?: string
          updated_at?: string
          valid_months: number
        }
        Update: {
          broker_organization_id?: number
          commission_rate?: number | null
          commission_terms?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: never
          is_manual?: boolean
          kind?: string
          manual_upload_bucket?: string | null
          manual_upload_path?: string | null
          master_broker_organization_id?: number
          master_broker_rep_email?: string | null
          master_broker_rep_id?: string | null
          master_broker_rep_name?: string | null
          master_broker_rep_position?: string | null
          project_id?: number | null
          public_code?: string
          revoked_at?: string | null
          signature_document_id?: number | null
          signed_at?: string | null
          signer_membership_id?: number | null
          status?: string
          updated_at?: string
          valid_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "agreements_broker_organization_id_fkey"
            columns: ["broker_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_master_broker_organization_id_fkey"
            columns: ["master_broker_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_signature_document_id_fkey"
            columns: ["signature_document_id"]
            isOneToOne: false
            referencedRelation: "signature_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_signer_membership_id_fkey"
            columns: ["signer_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          icon: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          icon?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          metadata: Json
          occurred_at: string
          organization_id: number
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          organization_id: number
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          organization_id?: number
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          accent_color: string
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          favicon_path: string | null
          id: number
          is_default: boolean
          logo_dark_path: string | null
          logo_path: string | null
          name: string
          organization_id: number
          primary_color: string
          secondary_color: string
          surface_color: string
          updated_at: string
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          favicon_path?: string | null
          id?: never
          is_default?: boolean
          logo_dark_path?: string | null
          logo_path?: string | null
          name: string
          organization_id: number
          primary_color?: string
          secondary_color?: string
          surface_color?: string
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          favicon_path?: string | null
          id?: never
          is_default?: boolean
          logo_dark_path?: string | null
          logo_path?: string | null
          name?: string
          organization_id?: number
          primary_color?: string
          secondary_color?: string
          surface_color?: string
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_access_requests: {
        Row: {
          agency: string | null
          created_at: string
          email: string
          full_name: string
          id: number
          message: string | null
          organization_id: number
          phone: string
          project_interest: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_type: string
          status: string
          updated_at: string
        }
        Insert: {
          agency?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: never
          message?: string | null
          organization_id: number
          phone: string
          project_interest?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: never
          message?: string | null
          organization_id?: number
          phone?: string
          project_interest?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_access_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: string
          expires_at: string | null
          id: number
          issued_at: string | null
          membership_id: number
          mime_type: string
          organization_id: number
          public_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          status: string
          storage_bucket: string
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type: string
          expires_at?: string | null
          id?: never
          issued_at?: string | null
          membership_id: number
          mime_type: string
          organization_id: number
          public_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          storage_bucket?: string
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: string
          expires_at?: string | null
          id?: never
          issued_at?: string | null
          membership_id?: number
          mime_type?: string
          organization_id?: number
          public_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          storage_bucket?: string
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_documents_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          contact_id: number
          created_at: string
          document_type: string
          file_name: string
          id: number
          mime_type: string
          opportunity_id: number | null
          organization_id: number
          public_code: string
          reservation_request_id: number | null
          size_bytes: number
          storage_bucket: string
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          contact_id: number
          created_at?: string
          document_type?: string
          file_name: string
          id?: never
          mime_type: string
          opportunity_id?: number | null
          organization_id: number
          public_code?: string
          reservation_request_id?: number | null
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          contact_id?: number
          created_at?: string
          document_type?: string
          file_name?: string
          id?: never
          mime_type?: string
          opportunity_id?: number | null
          organization_id?: number
          public_code?: string
          reservation_request_id?: number | null
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_claim_documents: {
        Row: {
          claim_id: number
          created_at: string
          document_type: string
          file_name: string
          id: number
          mime_type: string
          organization_id: number
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          claim_id: number
          created_at?: string
          document_type: string
          file_name: string
          id?: never
          mime_type: string
          organization_id: number
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          claim_id?: number
          created_at?: string
          document_type?: string
          file_name?: string
          id?: never
          mime_type?: string
          organization_id?: number
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "commission_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claim_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_claims: {
        Row: {
          commission_id: number | null
          commission_rate: number | null
          created_at: string
          currency: string
          developer_payment_confirmed_at: string | null
          developer_payment_confirmed_by: string | null
          developer_payment_notes: string | null
          developer_payment_reference: string | null
          final_invoice_mime_type: string | null
          final_invoice_number: string | null
          final_invoice_size_bytes: number | null
          final_invoice_storage_bucket: string | null
          final_invoice_storage_path: string | null
          final_invoice_submitted_at: string | null
          gross_commission_amount: number
          id: number
          opportunity_id: number | null
          organization_id: number
          paid_at: string | null
          paid_by: string | null
          payment_reference: string | null
          proforma_generated_at: string | null
          proforma_number: string | null
          proforma_snapshot: Json
          proforma_submitted_at: string | null
          project_id: number
          public_code: string
          released_amount: number
          released_percentage: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sale_id: number | null
          status: string
          submitted_by_membership_id: number | null
          unit_id: number | null
          updated_at: string
        }
        Insert: {
          commission_id?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          developer_payment_confirmed_at?: string | null
          developer_payment_confirmed_by?: string | null
          developer_payment_notes?: string | null
          developer_payment_reference?: string | null
          final_invoice_mime_type?: string | null
          final_invoice_number?: string | null
          final_invoice_size_bytes?: number | null
          final_invoice_storage_bucket?: string | null
          final_invoice_storage_path?: string | null
          final_invoice_submitted_at?: string | null
          gross_commission_amount: number
          id?: never
          opportunity_id?: number | null
          organization_id: number
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          proforma_generated_at?: string | null
          proforma_number?: string | null
          proforma_snapshot?: Json
          proforma_submitted_at?: string | null
          project_id: number
          public_code?: string
          released_amount?: number
          released_percentage?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_id?: number | null
          status?: string
          submitted_by_membership_id?: number | null
          unit_id?: number | null
          updated_at?: string
        }
        Update: {
          commission_id?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          developer_payment_confirmed_at?: string | null
          developer_payment_confirmed_by?: string | null
          developer_payment_notes?: string | null
          developer_payment_reference?: string | null
          final_invoice_mime_type?: string | null
          final_invoice_number?: string | null
          final_invoice_size_bytes?: number | null
          final_invoice_storage_bucket?: string | null
          final_invoice_storage_path?: string | null
          final_invoice_submitted_at?: string | null
          gross_commission_amount?: number
          id?: never
          opportunity_id?: number | null
          organization_id?: number
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          proforma_generated_at?: string | null
          proforma_number?: string | null
          proforma_snapshot?: Json
          proforma_submitted_at?: string | null
          project_id?: number
          public_code?: string
          released_amount?: number
          released_percentage?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_id?: number | null
          status?: string
          submitted_by_membership_id?: number | null
          unit_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_claims_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_submitted_by_membership_id_fkey"
            columns: ["submitted_by_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_claims_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_participants: {
        Row: {
          amount: number
          commission_id: number
          id: number
          membership_id: number | null
          organization_id: number | null
          percentage: number
        }
        Insert: {
          amount: number
          commission_id: number
          id?: never
          membership_id?: number | null
          organization_id?: number | null
          percentage: number
        }
        Update: {
          amount?: number
          commission_id?: number
          id?: never
          membership_id?: number | null
          organization_id?: number | null
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_participants_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_participants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          created_at: string
          currency: string
          gross_amount: number
          id: number
          organization_id: number
          sale_id: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          gross_amount: number
          id?: never
          organization_id: number
          sale_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: never
          organization_id?: number
          sale_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_preferences: {
        Row: {
          channel: string
          contact_id: number
          id: number
          organization_id: number
          recorded_at: string
          source: string | null
          status: string
        }
        Insert: {
          channel: string
          contact_id: number
          id?: never
          organization_id: number
          recorded_at?: string
          source?: string | null
          status: string
        }
        Update: {
          channel?: string
          contact_id?: number
          id?: never
          organization_id?: number
          recorded_at?: string
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: number
          tag_id: number
        }
        Insert: {
          contact_id: number
          tag_id: number
        }
        Update: {
          contact_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          classification: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          first_name: string
          id: number
          last_name: string | null
          organization_id: number
          phone: string
          phone_last4: string | null
          phone_normalized: string | null
          preferred_language: string
          public_code: string
          source: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: never
          last_name?: string | null
          organization_id: number
          phone: string
          phone_last4?: string | null
          phone_normalized?: string | null
          preferred_language?: string
          public_code?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: never
          last_name?: string | null
          organization_id?: number
          phone?: string
          phone_last4?: string | null
          phone_normalized?: string | null
          preferred_language?: string
          public_code?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_translation_reviews: {
        Row: {
          created_at: string
          error_message: string | null
          findings: Json
          id: number
          model: string | null
          organization_id: number
          provider: string | null
          score: number | null
          status: string
          suggested_text: string | null
          translation_id: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          findings?: Json
          id?: never
          model?: string | null
          organization_id: number
          provider?: string | null
          score?: number | null
          status: string
          suggested_text?: string | null
          translation_id: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          findings?: Json
          id?: never
          model?: string | null
          organization_id?: number
          provider?: string | null
          score?: number | null
          status?: string
          suggested_text?: string | null
          translation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_translation_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_translation_reviews_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "content_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_translations: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          field_path: string
          generated_at: string | null
          id: number
          last_reviewed_at: string | null
          model: string | null
          organization_id: number
          provider: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_hash: string
          source_locale: string
          source_text: string
          status: string
          target_locale: string
          translated_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          field_path: string
          generated_at?: string | null
          id?: never
          last_reviewed_at?: string | null
          model?: string | null
          organization_id: number
          provider?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_hash: string
          source_locale: string
          source_text: string
          status?: string
          target_locale: string
          translated_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          field_path?: string
          generated_at?: string | null
          id?: never
          last_reviewed_at?: string | null
          model?: string | null
          organization_id?: number
          provider?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_hash?: string
          source_locale?: string
          source_text?: string
          status?: string
          target_locale?: string
          translated_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_translations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          created_by: string | null
          document_id: number
          id: number
          mime_type: string
          published_at: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          version_number: number
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          created_by?: string | null
          document_id: number
          id?: never
          mime_type: string
          published_at?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          version_number: number
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: number
          id?: never
          mime_type?: string
          published_at?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_events: {
        Row: {
          event_type: string
          id: number
          metadata: Json
          occurred_at: string
          organization_id: number
          shared_link_id: number | null
        }
        Insert: {
          event_type: string
          id?: never
          metadata?: Json
          occurred_at?: string
          organization_id: number
          shared_link_id?: number | null
        }
        Update: {
          event_type?: string
          id?: never
          metadata?: Json
          occurred_at?: string
          organization_id?: number
          shared_link_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_events_shared_link_id_fkey"
            columns: ["shared_link_id"]
            isOneToOne: false
            referencedRelation: "shared_links"
            referencedColumns: ["id"]
          },
        ]
      }
      external_unit_mappings: {
        Row: {
          connection_id: number
          created_at: string
          external_unit_code: string
          external_unit_id: string
          first_seen_at: string
          id: number
          is_active: boolean
          last_seen_at: string
          project_id: number
          source_hash: string | null
          unit_id: number | null
          updated_at: string
        }
        Insert: {
          connection_id: number
          created_at?: string
          external_unit_code: string
          external_unit_id: string
          first_seen_at?: string
          id?: never
          is_active?: boolean
          last_seen_at?: string
          project_id: number
          source_hash?: string | null
          unit_id?: number | null
          updated_at?: string
        }
        Update: {
          connection_id?: number
          created_at?: string
          external_unit_code?: string
          external_unit_id?: string
          first_seen_at?: string
          id?: never
          is_active?: boolean
          last_seen_at?: string
          project_id?: number
          source_hash?: string | null
          unit_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_unit_mappings_connection_id_project_id_fkey"
            columns: ["connection_id", "project_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id", "project_id"]
          },
          {
            foreignKeyName: "external_unit_mappings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          base_url: string
          config: Json
          created_at: string
          credentials_secret_name: string
          display_name: string
          external_project_id: string
          id: number
          last_attempt_at: string | null
          last_error_code: string | null
          last_success_at: string | null
          project_id: number
          provider: string
          status: string
          sync_interval_seconds: number
          updated_at: string
        }
        Insert: {
          base_url: string
          config?: Json
          created_at?: string
          credentials_secret_name: string
          display_name: string
          external_project_id: string
          id?: never
          last_attempt_at?: string | null
          last_error_code?: string | null
          last_success_at?: string | null
          project_id: number
          provider: string
          status?: string
          sync_interval_seconds?: number
          updated_at?: string
        }
        Update: {
          base_url?: string
          config?: Json
          created_at?: string
          credentials_secret_name?: string
          display_name?: string
          external_project_id?: string
          id?: never
          last_attempt_at?: string | null
          last_error_code?: string | null
          last_success_at?: string | null
          project_id?: number
          provider?: string
          status?: string
          sync_interval_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_source_snapshots: {
        Row: {
          canonical_status: string
          created_at: string
          external_unit_code: string
          external_unit_id: string
          id: number
          payload_hash: string
          project_id: number
          source_payload: Json
          sync_run_id: number
        }
        Insert: {
          canonical_status: string
          created_at?: string
          external_unit_code: string
          external_unit_id: string
          id?: never
          payload_hash: string
          project_id: number
          source_payload: Json
          sync_run_id: number
        }
        Update: {
          canonical_status?: string
          created_at?: string
          external_unit_code?: string
          external_unit_id?: string
          id?: never
          payload_hash?: string
          project_id?: number
          source_payload?: Json
          sync_run_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_source_snapshots_sync_run_id_project_id_fkey"
            columns: ["sync_run_id", "project_id"]
            isOneToOne: false
            referencedRelation: "inventory_sync_runs"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      inventory_sync_runs: {
        Row: {
          connection_id: number
          created_at: string
          created_count: number
          diff_summary: Json
          error_code: string | null
          error_summary: string | null
          finished_at: string | null
          id: number
          invalid_count: number
          missing_count: number
          mode: string
          project_id: number
          received_count: number
          source_payload_hash: string | null
          started_at: string
          status: string
          unchanged_count: number
          updated_count: number
        }
        Insert: {
          connection_id: number
          created_at?: string
          created_count?: number
          diff_summary?: Json
          error_code?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: never
          invalid_count?: number
          missing_count?: number
          mode?: string
          project_id: number
          received_count?: number
          source_payload_hash?: string | null
          started_at?: string
          status?: string
          unchanged_count?: number
          updated_count?: number
        }
        Update: {
          connection_id?: number
          created_at?: string
          created_count?: number
          diff_summary?: Json
          error_code?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: never
          invalid_count?: number
          missing_count?: number
          mode?: string
          project_id?: number
          received_count?: number
          source_payload_hash?: string | null
          started_at?: string
          status?: string
          unchanged_count?: number
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sync_runs_connection_id_project_id_fkey"
            columns: ["connection_id", "project_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          email_last_sent_at: string | null
          email_sent_at: string | null
          expires_at: string
          id: number
          invited_by: string | null
          opened_at: string | null
          organization_id: number
          project_ids: number[]
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          email_last_sent_at?: string | null
          email_sent_at?: string | null
          expires_at?: string
          id?: never
          invited_by?: string | null
          opened_at?: string | null
          organization_id: number
          project_ids?: number[]
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          email_last_sent_at?: string | null
          email_sent_at?: string | null
          expires_at?: string
          id?: never
          invited_by?: string | null
          opened_at?: string | null
          organization_id?: number
          project_ids?: number[]
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_identity_claims: {
        Row: {
          canonical_contact_id: number
          created_at: string
          first_organization_id: number
          first_report_id: number | null
          id: number
          identity_type: string
          normalized_value: string
          project_id: number | null
          updated_at: string
        }
        Insert: {
          canonical_contact_id: number
          created_at?: string
          first_organization_id: number
          first_report_id?: number | null
          id?: never
          identity_type: string
          normalized_value: string
          project_id?: number | null
          updated_at?: string
        }
        Update: {
          canonical_contact_id?: number
          created_at?: string
          first_organization_id?: number
          first_report_id?: number | null
          id?: never
          identity_type?: string
          normalized_value?: string
          project_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_identity_claims_canonical_contact_id_fkey"
            columns: ["canonical_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_identity_claims_first_organization_id_fkey"
            columns: ["first_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_identity_claims_first_report_id_fkey"
            columns: ["first_report_id"]
            isOneToOne: false
            referencedRelation: "lead_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_identity_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_report_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: number
          lead_report_id: number
          mime_type: string
          organization_id: number
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: never
          lead_report_id: number
          mime_type: string
          organization_id: number
          size_bytes?: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: never
          lead_report_id?: number
          mime_type?: string
          organization_id?: number
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_report_attachments_lead_report_id_fkey"
            columns: ["lead_report_id"]
            isOneToOne: false
            referencedRelation: "lead_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_report_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reports: {
        Row: {
          acknowledgement_at: string | null
          agreement_id: number | null
          contact_id: number
          created_at: string
          id: number
          organization_id: number
          project_id: number | null
          protected_until: string | null
          protection_status: string
          public_code: string
          reported_by_membership_id: number | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          updated_at: string
          work_summary: string | null
        }
        Insert: {
          acknowledgement_at?: string | null
          agreement_id?: number | null
          contact_id: number
          created_at?: string
          id?: never
          organization_id: number
          project_id?: number | null
          protected_until?: string | null
          protection_status?: string
          public_code?: string
          reported_by_membership_id?: number | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          updated_at?: string
          work_summary?: string | null
        }
        Update: {
          acknowledgement_at?: string | null
          agreement_id?: number | null
          contact_id?: number
          created_at?: string
          id?: never
          organization_id?: number
          project_id?: number | null
          protected_until?: string | null
          protection_status?: string
          public_code?: string
          reported_by_membership_id?: number | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          updated_at?: string
          work_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_reports_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reports_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reports_reported_by_membership_id_fkey"
            columns: ["reported_by_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          area_sqm: number
          block: string | null
          created_at: string
          currency: string
          id: number
          is_public: boolean
          list_price: number
          lot_code: string
          notes: string | null
          organization_id: number
          polygon: Json
          project_id: number
          reservation_expires_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area_sqm: number
          block?: string | null
          created_at?: string
          currency?: string
          id?: never
          is_public?: boolean
          list_price: number
          lot_code: string
          notes?: string | null
          organization_id: number
          polygon: Json
          project_id: number
          reservation_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number
          block?: string | null
          created_at?: string
          currency?: string
          id?: never
          is_public?: boolean
          list_price?: number
          lot_code?: string
          notes?: string | null
          organization_id?: number
          polygon?: Json
          project_id?: number
          reservation_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_offer_projects: {
        Row: {
          created_at: string
          offer_id: number
          project_id: number
        }
        Insert: {
          created_at?: string
          offer_id: number
          project_id: number
        }
        Update: {
          created_at?: string
          offer_id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_offer_projects_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketing_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_offer_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_offers: {
        Row: {
          banner_path: string | null
          created_at: string
          created_by: string | null
          description: string
          discount_percent: number | null
          display_placement: string
          ends_at: string
          id: number
          offer_type: string
          organization_id: number
          priority: number
          promotion_text: string | null
          requires_opt_in: boolean
          starts_at: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          banner_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount_percent?: number | null
          display_placement?: string
          ends_at: string
          id?: never
          offer_type: string
          organization_id: number
          priority?: number
          promotion_text?: string | null
          requires_opt_in?: boolean
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          banner_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount_percent?: number | null
          display_placement?: string
          ends_at?: string
          id?: never
          offer_type?: string
          organization_id?: number
          priority?: number
          promotion_text?: string | null
          requires_opt_in?: boolean
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      master_broker_reporting_access: {
        Row: {
          created_at: string
          granted_by: string | null
          id: number
          master_broker_organization_id: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: never
          master_broker_organization_id: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: never
          master_broker_organization_id?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_broker_reporting_acces_master_broker_organization_i_fkey"
            columns: ["master_broker_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: number
          is_primary: boolean
          organization_id: number
          public_code: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_primary?: boolean
          organization_id: number
          public_code?: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          is_primary?: boolean
          organization_id?: number
          public_code?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          contact_id: number | null
          created_at: string
          created_by: string | null
          id: number
          opportunity_id: number | null
          organization_id: number
          updated_at: string
        }
        Insert: {
          body: string
          contact_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: never
          opportunity_id?: number | null
          organization_id: number
          updated_at?: string
        }
        Update: {
          body?: string
          contact_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: never
          opportunity_id?: number | null
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: number
          link: string | null
          membership_id: number
          organization_id: number
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: never
          link?: string | null
          membership_id: number
          organization_id: number
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: never
          link?: string | null
          membership_id?: number
          organization_id?: number
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          closed_reason: string | null
          contact_id: number
          created_at: string
          currency: string
          id: number
          next_follow_up_at: string | null
          objective: string | null
          organization_id: number
          owner_membership_id: number | null
          priority: string | null
          public_code: string
          stage: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          closed_reason?: string | null
          contact_id: number
          created_at?: string
          currency?: string
          id?: never
          next_follow_up_at?: string | null
          objective?: string | null
          organization_id: number
          owner_membership_id?: number | null
          priority?: string | null
          public_code?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          closed_reason?: string | null
          contact_id?: number
          created_at?: string
          currency?: string
          id?: never
          next_follow_up_at?: string | null
          objective?: string | null
          organization_id?: number
          owner_membership_id?: number | null
          priority?: string | null
          public_code?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_membership_id_fkey"
            columns: ["owner_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_projects: {
        Row: {
          opportunity_id: number
          project_id: number
        }
        Insert: {
          opportunity_id: number
          project_id: number
        }
        Update: {
          opportunity_id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_units: {
        Row: {
          opportunity_id: number
          unit_id: number
        }
        Insert: {
          opportunity_id: number
          unit_id: number
        }
        Update: {
          opportunity_id?: number
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_units_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_agreement_settings: {
        Row: {
          created_at: string
          default_valid_months: number
          organization_id: number
          reminder_days_before_expiry: number
          requires_project_specific: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_valid_months?: number
          organization_id: number
          reminder_days_before_expiry?: number
          requires_project_specific?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_valid_months?: number
          organization_id?: number
          reminder_days_before_expiry?: number
          requires_project_specific?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_agreement_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: string
          expires_at: string | null
          id: number
          issued_at: string | null
          mime_type: string | null
          notes: string | null
          organization_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          status: string
          storage_bucket: string
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type?: string
          expires_at?: string | null
          id?: never
          issued_at?: string | null
          mime_type?: string | null
          notes?: string | null
          organization_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          storage_bucket?: string
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: string
          expires_at?: string | null
          id?: never
          issued_at?: string | null
          mime_type?: string | null
          notes?: string | null
          organization_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          storage_bucket?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: number
          metadata: Json
          relationship_type: string
          source_organization_id: number
          starts_at: string | null
          status: string
          target_organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: never
          metadata?: Json
          relationship_type: string
          source_organization_id: number
          starts_at?: string | null
          status?: string
          target_organization_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: never
          metadata?: Json
          relationship_type?: string
          source_organization_id?: number
          starts_at?: string | null
          status?: string
          target_organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_relationships_source_organization_id_fkey"
            columns: ["source_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_relationships_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: number
          kind: string
          legal_address: string | null
          legal_name: string | null
          legal_representative_id: string | null
          legal_representative_name: string | null
          name: string
          public_code: string
          slug: string
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          kind: string
          legal_address?: string | null
          legal_name?: string | null
          legal_representative_id?: string | null
          legal_representative_name?: string | null
          name: string
          public_code?: string
          slug: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          kind?: string
          legal_address?: string | null
          legal_name?: string | null
          legal_representative_id?: string | null
          legal_representative_name?: string | null
          name?: string
          public_code?: string
          slug?: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_plan_steps: {
        Row: {
          fixed_amount: number | null
          id: number
          label: string
          milestone: string | null
          payment_plan_id: number
          percentage: number | null
          sort_order: number
        }
        Insert: {
          fixed_amount?: number | null
          id?: never
          label: string
          milestone?: string | null
          payment_plan_id: number
          percentage?: number | null
          sort_order: number
        }
        Update: {
          fixed_amount?: number | null
          id?: never
          label?: string
          milestone?: string | null
          payment_plan_id?: number
          percentage?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_steps_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          currency: string
          id: number
          is_active: boolean
          name: string
          organization_id: number
          project_id: number
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: never
          is_active?: boolean
          name: string
          organization_id: number
          project_id: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: never
          is_active?: boolean
          name?: string
          organization_id?: number
          project_id?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presence_sessions: {
        Row: {
          ended_at: string | null
          id: string
          last_seen_at: string
          organization_id: number | null
          project_id: number | null
          session_key: string
          started_at: string
          surface: string
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          organization_id?: number | null
          project_id?: number | null
          session_key: string
          started_at?: string
          surface: string
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          organization_id?: number | null
          project_id?: number | null
          session_key?: string
          started_at?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presence_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presence_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          presentation_id: number
          published_at: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          presentation_id: number
          published_at?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          presentation_id?: number
          published_at?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_versions_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          author_membership_id: number | null
          contact_id: number | null
          created_at: string
          id: number
          kind: string
          organization_id: number
          public_code: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_membership_id?: number | null
          contact_id?: number | null
          created_at?: string
          id?: never
          kind: string
          organization_id: number
          public_code?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_membership_id?: number | null
          contact_id?: number | null
          created_at?: string
          id?: never
          kind?: string
          organization_id?: number
          public_code?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          email: string | null
          facebook_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          locale: string
          must_change_password: boolean
          phone: string | null
          professional_title: string | null
          tiktok_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          locale?: string
          must_change_password?: boolean
          phone?: string | null
          professional_title?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          locale?: string
          must_change_password?: boolean
          phone?: string | null
          professional_title?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      project_access: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          grantee_membership_id: number | null
          grantee_organization_id: number | null
          grantee_team_id: number | null
          id: number
          organization_id: number
          project_id: number
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          grantee_membership_id?: number | null
          grantee_organization_id?: number | null
          grantee_team_id?: number | null
          id?: never
          organization_id: number
          project_id: number
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          grantee_membership_id?: number | null
          grantee_organization_id?: number | null
          grantee_team_id?: number | null
          id?: never
          organization_id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_access_grantee_membership_id_fkey"
            columns: ["grantee_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_grantee_organization_id_fkey"
            columns: ["grantee_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_grantee_team_id_fkey"
            columns: ["grantee_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_access_capabilities: {
        Row: {
          capability: string
          created_at: string
          created_by: string | null
          project_access_id: number
          project_id: number
        }
        Insert: {
          capability: string
          created_at?: string
          created_by?: string | null
          project_access_id: number
          project_id: number
        }
        Update: {
          capability?: string
          created_at?: string
          created_by?: string | null
          project_access_id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_access_capabilities_project_access_id_project_id_fkey"
            columns: ["project_access_id", "project_id"]
            isOneToOne: false
            referencedRelation: "project_access"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      project_amenities: {
        Row: {
          amenity_id: number
          project_id: number
        }
        Insert: {
          amenity_id: number
          project_id: number
        }
        Update: {
          amenity_id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_amenities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_commission_milestones: {
        Row: {
          commission_pct: number
          created_at: string
          description: string | null
          id: number
          milestone_order: number
          project_id: number
          trigger_type: string
          trigger_value: number | null
          updated_at: string
        }
        Insert: {
          commission_pct: number
          created_at?: string
          description?: string | null
          id?: never
          milestone_order?: number
          project_id: number
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string
        }
        Update: {
          commission_pct?: number
          created_at?: string
          description?: string | null
          id?: never
          milestone_order?: number
          project_id?: number
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_commission_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          category: string
          created_at: string
          id: number
          organization_id: number
          project_id: number
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: never
          organization_id: number
          project_id: number
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: never
          organization_id?: number
          project_id?: number
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_highlights: {
        Row: {
          content: string
          id: number
          project_id: number
          sort_order: number
        }
        Insert: {
          content: string
          id?: never
          project_id: number
          sort_order?: number
        }
        Update: {
          content?: string
          id?: never
          project_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_highlights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          alt_text: string
          created_at: string
          id: number
          kind: string
          organization_id: number
          project_id: number
          sort_order: number
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: never
          kind: string
          organization_id: number
          project_id: number
          sort_order?: number
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: never
          kind?: string
          organization_id?: number
          project_id?: number
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_responsibilities: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: number
          is_primary: boolean
          notes: string | null
          project_id: number
          responsibility: string
          responsible_membership_id: number | null
          responsible_organization_id: number | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: never
          is_primary?: boolean
          notes?: string | null
          project_id: number
          responsibility: string
          responsible_membership_id?: number | null
          responsible_organization_id?: number | null
          starts_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: never
          is_primary?: boolean
          notes?: string | null
          project_id?: number
          responsibility?: string
          responsible_membership_id?: number | null
          responsible_organization_id?: number | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_responsibilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_responsibilities_responsible_membership_id_fkey"
            columns: ["responsible_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_responsibilities_responsible_organization_id_fkey"
            columns: ["responsible_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_profile_id: number | null
          commission_rate: number | null
          created_at: string
          currency: string
          delivery_date: string | null
          description: string
          developer_organization_id: number | null
          id: number
          inventory_available_declared: number | null
          inventory_is_complete: boolean
          inventory_total_declared: number | null
          inventory_updated_at: string | null
          lifecycle_status: string
          location: string
          master_broker_exclusive: boolean
          name: string
          organization_id: number
          project_type: string
          publication_status: string
          published_at: string | null
          short_description: string
          slug: string
          starting_price: number | null
          updated_at: string
          zone: string
        }
        Insert: {
          brand_profile_id?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          delivery_date?: string | null
          description?: string
          developer_organization_id?: number | null
          id?: never
          inventory_available_declared?: number | null
          inventory_is_complete?: boolean
          inventory_total_declared?: number | null
          inventory_updated_at?: string | null
          lifecycle_status: string
          location: string
          master_broker_exclusive?: boolean
          name: string
          organization_id: number
          project_type?: string
          publication_status?: string
          published_at?: string | null
          short_description?: string
          slug: string
          starting_price?: number | null
          updated_at?: string
          zone: string
        }
        Update: {
          brand_profile_id?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          delivery_date?: string | null
          description?: string
          developer_organization_id?: number | null
          id?: never
          inventory_available_declared?: number | null
          inventory_is_complete?: boolean
          inventory_total_declared?: number | null
          inventory_updated_at?: string | null
          lifecycle_status?: string
          location?: string
          master_broker_exclusive?: boolean
          name?: string
          organization_id?: number
          project_type?: string
          publication_status?: string
          published_at?: string | null
          short_description?: string
          slug?: string
          starting_price?: number | null
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_developer_organization_id_fkey"
            columns: ["developer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_decisions: {
        Row: {
          client_name: string | null
          comment: string | null
          decided_at: string
          decision: string
          id: string
          metadata: Json
          organization_id: number
          presentation_id: number
          shared_link_id: number
        }
        Insert: {
          client_name?: string | null
          comment?: string | null
          decided_at?: string
          decision: string
          id?: string
          metadata?: Json
          organization_id: number
          presentation_id: number
          shared_link_id: number
        }
        Update: {
          client_name?: string | null
          comment?: string | null
          decided_at?: string
          decision?: string
          id?: string
          metadata?: Json
          organization_id?: number
          presentation_id?: number
          shared_link_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_decisions_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_decisions_shared_link_id_fkey"
            columns: ["shared_link_id"]
            isOneToOne: true
            referencedRelation: "shared_links"
            referencedColumns: ["id"]
          },
        ]
      }
      report_notification_recipients: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: number
          is_active: boolean
          label: string | null
          organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_notification_recipients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_notification_recipients: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: number
          is_active: boolean
          label: string | null
          organization_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: never
          is_active?: boolean
          label?: string | null
          organization_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_notification_recipients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_payment_submissions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          file_name: string | null
          id: number
          organization_id: number
          paid_at: string | null
          payment_stage: string
          reference: string | null
          reservation_id: number
          reservation_request_id: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          submitted_by_membership_id: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          file_name?: string | null
          id?: never
          organization_id: number
          paid_at?: string | null
          payment_stage?: string
          reference?: string | null
          reservation_id: number
          reservation_request_id: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          submitted_by_membership_id?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          file_name?: string | null
          id?: never
          organization_id?: number
          paid_at?: string | null
          payment_stage?: string
          reference?: string | null
          reservation_id?: number
          reservation_request_id?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          submitted_by_membership_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_payment_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_payment_submissions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_payment_submissions_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_payment_submissions_submitted_by_membership_id_fkey"
            columns: ["submitted_by_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_request_attachments: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          id: number
          mime_type: string
          organization_id: number
          reservation_request_id: number
          size_bytes: number
          storage_bucket: string
          storage_path: string
          uploaded_by_membership_id: number | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          id?: never
          mime_type: string
          organization_id: number
          reservation_request_id: number
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          uploaded_by_membership_id?: number | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          id?: never
          mime_type?: string
          organization_id?: number
          reservation_request_id?: number
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          uploaded_by_membership_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_request_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_request_attachments_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_request_attachments_uploaded_by_membership_id_fkey"
            columns: ["uploaded_by_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          lot_id: number | null
          notes: string | null
          opportunity_id: number | null
          organization_id: number
          requested_by_membership_id: number | null
          reservation_type: string
          status: string
          unit_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: never
          lot_id?: number | null
          notes?: string | null
          opportunity_id?: number | null
          organization_id: number
          requested_by_membership_id?: number | null
          reservation_type?: string
          status?: string
          unit_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: never
          lot_id?: number | null
          notes?: string | null
          opportunity_id?: number | null
          organization_id?: number
          requested_by_membership_id?: number | null
          reservation_type?: string
          status?: string
          unit_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_requests_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_requested_by_membership_id_fkey"
            columns: ["requested_by_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_workflow_settings: {
        Row: {
          allow_client_documents_before_reservation: boolean
          approval_authority: string
          approval_creates_hold: boolean
          created_at: string
          crm_notifications_enabled: boolean
          email_notifications_enabled: boolean
          hold_duration_hours: number
          id: number
          master_broker_organization_id: number
          project_id: number | null
          release_without_payment: boolean
          require_documents_for_confirmation: boolean
          require_payment_for_confirmation: boolean
          reservation_mode: string
          updated_at: string
          warning_hours: number
        }
        Insert: {
          allow_client_documents_before_reservation?: boolean
          approval_authority?: string
          approval_creates_hold?: boolean
          created_at?: string
          crm_notifications_enabled?: boolean
          email_notifications_enabled?: boolean
          hold_duration_hours?: number
          id?: never
          master_broker_organization_id: number
          project_id?: number | null
          release_without_payment?: boolean
          require_documents_for_confirmation?: boolean
          require_payment_for_confirmation?: boolean
          reservation_mode?: string
          updated_at?: string
          warning_hours?: number
        }
        Update: {
          allow_client_documents_before_reservation?: boolean
          approval_authority?: string
          approval_creates_hold?: boolean
          created_at?: string
          crm_notifications_enabled?: boolean
          email_notifications_enabled?: boolean
          hold_duration_hours?: number
          id?: never
          master_broker_organization_id?: number
          project_id?: number | null
          release_without_payment?: boolean
          require_documents_for_confirmation?: boolean
          require_payment_for_confirmation?: boolean
          reservation_mode?: string
          updated_at?: string
          warning_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_workflow_settings_master_broker_organization_i_fkey"
            columns: ["master_broker_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_workflow_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          lot_id: number | null
          organization_id: number
          reservation_request_id: number
          reservation_type: string
          reserved_at: string
          status: string
          unit_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: never
          lot_id?: number | null
          organization_id: number
          reservation_request_id: number
          reservation_type?: string
          reserved_at?: string
          status?: string
          unit_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: never
          lot_id?: number | null
          organization_id?: number
          reservation_request_id?: number
          reservation_type?: string
          reserved_at?: string
          status?: string
          unit_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: true
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          closed_at: string
          contact_id: number
          created_at: string
          currency: string
          id: number
          organization_id: number
          reservation_id: number | null
          sale_price: number
          unit_id: number
        }
        Insert: {
          closed_at: string
          contact_id: number
          created_at?: string
          currency: string
          id?: never
          organization_id: number
          reservation_id?: number | null
          sale_price: number
          unit_id: number
        }
        Update: {
          closed_at?: string
          contact_id?: number
          created_at?: string
          currency?: string
          id?: never
          organization_id?: number
          reservation_id?: number | null
          sale_price?: number
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          presentation_version_id: number
          revoked_at: string | null
          status: string
          token: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: never
          presentation_version_id: number
          revoked_at?: string | null
          status?: string
          token?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: never
          presentation_version_id?: number
          revoked_at?: string | null
          status?: string
          token?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_links_presentation_version_id_fkey"
            columns: ["presentation_version_id"]
            isOneToOne: false
            referencedRelation: "presentation_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_hash: string | null
          final_storage_path: string | null
          id: number
          organization_id: number
          public_code: string
          source_document_version_id: number | null
          source_storage_bucket: string
          source_storage_path: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          final_storage_path?: string | null
          id?: never
          organization_id: number
          public_code?: string
          source_document_version_id?: number | null
          source_storage_bucket?: string
          source_storage_path?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          final_storage_path?: string | null
          id?: never
          organization_id?: number
          public_code?: string
          source_document_version_id?: number | null
          source_storage_bucket?: string
          source_storage_path?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_source_document_version_id_fkey"
            columns: ["source_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_fields: {
        Row: {
          field_type: string
          height: number
          id: number
          label: string | null
          page_number: number
          signer_id: number
          value: string | null
          width: number
          x: number
          y: number
        }
        Insert: {
          field_type: string
          height: number
          id?: never
          label?: string | null
          page_number: number
          signer_id: number
          value?: string | null
          width: number
          x: number
          y: number
        }
        Update: {
          field_type?: string
          height?: number
          id?: never
          label?: string | null
          page_number?: number
          signer_id?: number
          value?: string | null
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "signature_fields_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "signature_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_signers: {
        Row: {
          email: string
          id: number
          id_number: string | null
          name: string
          phone: string | null
          sign_order: number
          signature_document_id: number
          signed_at: string | null
          signer_ip: unknown
          signer_role: string | null
          signing_token_hash: string
          status: string
        }
        Insert: {
          email: string
          id?: never
          id_number?: string | null
          name: string
          phone?: string | null
          sign_order: number
          signature_document_id: number
          signed_at?: string | null
          signer_ip?: unknown
          signer_role?: string | null
          signing_token_hash: string
          status?: string
        }
        Update: {
          email?: string
          id?: never
          id_number?: string | null
          name?: string
          phone?: string | null
          sign_order?: number
          signature_document_id?: number
          signed_at?: string | null
          signer_ip?: unknown
          signer_role?: string | null
          signing_token_hash?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_signers_signature_document_id_fkey"
            columns: ["signature_document_id"]
            isOneToOne: false
            referencedRelation: "signature_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          id: number
          is_internal: boolean
          ticket_id: number
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: never
          is_internal?: boolean
          ticket_id: number
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: never
          is_internal?: boolean
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to_user_id: string | null
          category: string
          created_at: string
          description: string
          id: number
          opened_by_user_id: string | null
          organization_id: number
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          category?: string
          created_at?: string
          description: string
          id?: never
          opened_by_user_id?: string | null
          organization_id: number
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: never
          opened_by_user_id?: string | null
          organization_id?: number
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: number
          name: string
          organization_id: number
        }
        Insert: {
          color?: string | null
          id?: never
          name: string
          organization_id: number
        }
        Update: {
          color?: string | null
          id?: never
          name?: string
          organization_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          membership_id: number
          team_id: number
        }
        Insert: {
          created_at?: string
          membership_id: number
          team_id: number
        }
        Update: {
          created_at?: string
          membership_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: number
          name: string
          organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          organization_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      typologies: {
        Row: {
          bathrooms: number
          bedrooms: number
          created_at: string
          floor_plan_path: string | null
          id: number
          indoor_sqm: number | null
          name: string
          organization_id: number
          project_id: number
          terrace_sqm: number | null
          total_sqm: number
          updated_at: string
        }
        Insert: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor_plan_path?: string | null
          id?: never
          indoor_sqm?: number | null
          name: string
          organization_id: number
          project_id: number
          terrace_sqm?: number | null
          total_sqm: number
          updated_at?: string
        }
        Update: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor_plan_path?: string | null
          id?: never
          indoor_sqm?: number | null
          name?: string
          organization_id?: number
          project_id?: number
          terrace_sqm?: number | null
          total_sqm?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "typologies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typologies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_price_history: {
        Row: {
          changed_by: string | null
          created_at: string
          currency: string
          effective_from: string
          effective_until: string | null
          id: number
          organization_id: number
          price: number
          unit_id: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          currency: string
          effective_from?: string
          effective_until?: string | null
          id?: never
          organization_id: number
          price: number
          unit_id: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          currency?: string
          effective_from?: string
          effective_until?: string | null
          id?: never
          organization_id?: number
          price?: number
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_price_history_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: number
          organization_id: number
          reason: string | null
          source: string
          to_status: string
          unit_id: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: never
          organization_id: number
          reason?: string | null
          source?: string
          to_status: string
          unit_id: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: never
          organization_id?: number
          reason?: string | null
          source?: string
          to_status?: string
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_status_history_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          currency: string
          floor_level: number | null
          id: number
          is_public: boolean
          list_price: number
          notes: string | null
          organization_id: number
          project_id: number
          reservation_expires_at: string | null
          status: string
          tower: string | null
          typology_id: number | null
          unit_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          floor_level?: number | null
          id?: never
          is_public?: boolean
          list_price: number
          notes?: string | null
          organization_id: number
          project_id: number
          reservation_expires_at?: string | null
          status?: string
          tower?: string | null
          typology_id?: number | null
          unit_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          floor_level?: number | null
          id?: never
          is_public?: boolean
          list_price?: number
          notes?: string | null
          organization_id?: number
          project_id?: number
          reservation_expires_at?: string | null
          status?: string
          tower?: string | null
          typology_id?: number | null
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_typology_id_fkey"
            columns: ["typology_id"]
            isOneToOne: false
            referencedRelation: "typologies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { display_name?: string; invitation_token: string }
        Returns: {
          membership_id: number
          organization_id: number
          role: string
        }[]
      }
      confirm_commission_claim_payment: {
        Args: {
          target_claim_id: number
          target_notes?: string
          target_reference?: string
          target_released_percentage: number
        }
        Returns: undefined
      }
      confirm_sale_from_reservation: {
        Args: { target_reservation_id: number }
        Returns: number
      }
      create_commission_claim: {
        Args: { target_organization_id: number; target_sale_id: number }
        Returns: number
      }
      get_reservation_workflow_settings: {
        Args: { target_project_id: number }
        Returns: {
          allow_client_documents_before_reservation: boolean
          approval_authority: string
          approval_creates_hold: boolean
          created_at: string
          crm_notifications_enabled: boolean
          email_notifications_enabled: boolean
          hold_duration_hours: number
          id: number
          master_broker_organization_id: number
          project_id: number | null
          release_without_payment: boolean
          require_documents_for_confirmation: boolean
          require_payment_for_confirmation: boolean
          reservation_mode: string
          updated_at: string
          warning_hours: number
        }
        SetofOptions: {
          from: "*"
          to: "reservation_workflow_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_commission_claim_paid: {
        Args: { target_claim_id: number; target_reference?: string }
        Returns: undefined
      }
      notify_org_admins: {
        Args: {
          notif_body?: string
          notif_link?: string
          notif_title: string
          notif_type: string
          target_organization_id: number
        }
        Returns: undefined
      }
      process_expired_reservation_holds: { Args: never; Returns: undefined }
      record_presence: {
        Args: {
          target_project_id?: number
          target_session_key: string
          target_surface: string
        }
        Returns: undefined
      }
      record_presence_service: {
        Args: {
          target_actor_user_id?: string
          target_project_id?: number
          target_session_key: string
          target_surface: string
        }
        Returns: undefined
      }
      replace_project_amenities: {
        Args: { amenity_items: Json; target_project_id: number }
        Returns: undefined
      }
      reserve_lot: {
        Args: {
          hold_days?: number
          reservation_notes?: string
          target_lot_id: number
          target_opportunity_id?: number
        }
        Returns: {
          reservation_id: number
          reservation_request_id: number
        }[]
      }
      review_commission_claim: {
        Args: {
          target_claim_id: number
          target_decision: string
          target_notes?: string
        }
        Returns: undefined
      }
      review_reservation_payment: {
        Args: {
          target_decision: string
          target_notes?: string
          target_submission_id: number
        }
        Returns: Json
      }
      review_reservation_request: {
        Args: {
          target_decision: string
          target_reason?: string
          target_request_id: number
        }
        Returns: Json
      }
      submit_broker_access_request: {
        Args: {
          agency?: string
          email: string
          full_name: string
          message?: string
          phone: string
          project_interest?: string
          role_type?: string
        }
        Returns: number
      }
      submit_commission_invoice: {
        Args: {
          target_bucket: string
          target_claim_id: number
          target_mime: string
          target_number: string
          target_path: string
          target_size: number
        }
        Returns: undefined
      }
      submit_commission_proforma: {
        Args: {
          target_claim_id: number
          target_number: string
          target_snapshot: Json
        }
        Returns: undefined
      }
      submit_landing_access_request: {
        Args: {
          agency?: string
          email: string
          full_name: string
          message?: string
          phone: string
          role_type?: string
        }
        Returns: number
      }
      submit_proposal_decision: {
        Args: {
          proposal_token: string
          target_client_name?: string
          target_comment?: string
          target_decision: string
        }
        Returns: {
          decided_at: string
          decision: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
