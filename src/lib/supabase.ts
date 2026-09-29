import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Establishment } from '../types';

interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      get_place_accessibility: {
        Args: { requested_place_id: string };
        Returns: { encontrado: boolean; verificado: boolean; local: Establishment | null };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let client: SupabaseClient<Database> | null = null;

export function getSupabase() {
  if (!url && !key) return null;
  if (!url || !key) throw new Error('Configuração do banco incompleta.');
  client ??= createClient<Database>(url, key);
  return client;
}
