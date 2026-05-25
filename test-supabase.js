import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://avihnvlaidllmimxqouh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aWhudmxhaWRsbG1pbXhxb3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjc2NzIsImV4cCI6MjA4ODgwMzY3Mn0.EF_FIzhmhF2CsIbylU2ZIBoDPYY8F79W3svzz0kE1BY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Trying without quotes:");
  const res1 = await supabase.from('Utensili_B1').select('Tipologia, Forma, Diametro').limit(1);
  console.log("res1 err:", res1.error ? res1.error.message : res1.data);

  console.log("Trying with quotes:");
  const res2 = await supabase.from('Utensili_B1').select('"Tipologia", "Forma", "Diametro"').limit(1);
  console.log("res2 err:", res2.error ? res2.error.message : res2.data);
}
run();
