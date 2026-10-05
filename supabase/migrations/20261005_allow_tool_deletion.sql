-- ==========================================================
-- MIGRAZIONE: ABILITAZIONE ELIMINAZIONE UTENSILI (Utensili_B1)
-- ==========================================================
-- Conforme a Supabase Postgres Best Practices:
-- 1. Permetti eliminazione utensili per ruoli authenticated e anon
-- 2. Correzione vincolo foreign key su richieste_movimento_voci (ON DELETE CASCADE)

-- 1. Permessi PostgREST Data API per DELETE su Utensili_B1
GRANT DELETE ON TABLE public."Utensili_B1" TO authenticated, anon;

-- 2. Policy RLS dedicata per DELETE
DROP POLICY IF EXISTS "Utensili_B1_delete" ON public."Utensili_B1";
DROP POLICY IF EXISTS "Permetti eliminazione utensili a tutti" ON public."Utensili_B1";

CREATE POLICY "Utensili_B1_delete" 
ON public."Utensili_B1" FOR DELETE 
TO authenticated, anon 
USING (true);

-- 3. Aggiorna FK richieste_movimento_voci_tool_id_fkey a ON DELETE CASCADE
-- per evitare vincoli RESTRICT che bloccano l'eliminazione della riga utensile
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'richieste_movimento_voci_tool_id_fkey'
        AND conrelid = 'public.richieste_movimento_voci'::regclass
    ) THEN
        ALTER TABLE public.richieste_movimento_voci 
        DROP CONSTRAINT richieste_movimento_voci_tool_id_fkey;
        
        ALTER TABLE public.richieste_movimento_voci 
        ADD CONSTRAINT richieste_movimento_voci_tool_id_fkey 
        FOREIGN KEY (tool_id) REFERENCES public."Utensili_B1"(id) ON DELETE CASCADE;
    END IF;
END $$;
