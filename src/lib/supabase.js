import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://avihnvlaidllmimxqouh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aWhudmxhaWRsbG1pbXhxb3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjc2NzIsImV4cCI6MjA4ODgwMzY3Mn0.EF_FIzhmhF2CsIbylU2ZIBoDPYY8F79W3svzz0kE1BY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configurazione Supabase mancante: verificare le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nel file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

