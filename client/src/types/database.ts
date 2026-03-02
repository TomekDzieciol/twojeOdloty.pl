export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileRole = 'user' | 'partner' | 'admin'
export type AdStatus = 'draft' | 'active' | 'rejected' | 'archived'
export type AdGender = 'M' | 'F' | 'other' | 'any'
export type ImageOwnerType = 'profile' | 'partner' | 'ad'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: ProfileRole
          display_name: string | null
          city: string | null
          phone: string | null
          date_of_birth: string | null
          avatar_url: string | null
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      partners: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          city: string | null
          address: string | null
          phone: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['partners']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['partners']['Insert']>
      }
      ads: {
        Row: {
          id: string
          partner_id: string
          title: string
          body: string | null
          location_city: string | null
          gender: AdGender | null
          status: AdStatus
          moderated_at: string | null
          moderated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ads']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ads']['Insert']>
      }
      images: {
        Row: {
          id: string
          owner_type: ImageOwnerType
          owner_id: string
          url: string
          sort_order: number
          is_profile: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['images']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['images']['Insert']>
      }
      messages: {
        Row: {
          id: string
          ad_id: string
          sender_id: string
          recipient_id: string
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Partner = Database['public']['Tables']['partners']['Row']
export type Ad = Database['public']['Tables']['ads']['Row']
export type Image = Database['public']['Tables']['images']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
