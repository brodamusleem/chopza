/** Provisional contract, NOT generated. Replace with Supabase CLI output after schema creation.
 * No tables or migrations are created by this scaffold.
 */
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
      orders: {
        Row: {
          id: string
          customer_id: string
          rider_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          rider_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          rider_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
