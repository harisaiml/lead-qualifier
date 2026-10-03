// Supabase client for browser/client components
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database
export interface LeadScore {
  id?: string;
  created_at?: string;
  company_name: string;
  website_url?: string;
  lead_info?: string;
  industry?: string;
  contact_info?: string;
  overall_score: number;
  business_quality: number;
  buying_intent: number;
  website_quality: number;
  contact_completeness: number;
  conversion_potential: number;
  summary: string;
  suggestions: string[];
  outreach_template?: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}
