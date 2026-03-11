import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://avihnvlaidllmimxqouh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aWhudmxhaWRsbG1pbXhxb3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjc2NzIsImV4cCI6MjA4ODgwMzY3Mn0.EF_FIzhmhF2CsIbylU2ZIBoDPYY8F79W3svzz0kE1BY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// DIAGNOSTICA AVANZATA
async function runDiagnostic() {
    console.log("🚀 Avvio diagnostica Supabase...");

    // 1. Test tabella Utensili_B1
    const { data: cols, error: errCols } = await supabase
        .from('Utensili_B1')
        .select('*')
        .limit(1);

    if (errCols) {
        console.error('❌ Errore lettura Utensili_B1:', errCols.message);
        console.log('💡 Suggerimento: Controlla che la colonna "tipologia" esista o che RLS sia configurata.');
    } else if (cols && cols.length > 0) {
        console.log('✅ Tabella Utensili_B1 trovata! Colonne disponibili:', Object.keys(cols[0]));
    } else {
        console.log('⚠️ Tabella Utensili_B1 trovata ma è VUOTA. Inserisci almeno un rigo per vedere le colonne.');
    }
}

runDiagnostic();
