-- ==========================================================
-- SCRIPT SQL SCHEMA COMPLETO - GESTIONALE UTENSILI BERCELLA
-- Esegui questo script nel SQL Editor del progetto Supabase
-- ==========================================================

-- 1. TABELLA ORDINI
CREATE TABLE IF NOT EXISTS public.ordini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public."Utensili_B1"(id) ON DELETE CASCADE,
    quantita_richiesta INTEGER NOT NULL CHECK (quantita_richiesta > 0),
    note TEXT,
    stato TEXT DEFAULT 'In Attesa' CHECK (stato IN ('In Attesa', 'Completato', 'Annullato')),
    utente TEXT,
    data_ordine TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita RLS (Row Level Security) per la tabella ordini
ALTER TABLE public.ordini ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permetti lettura ordini" ON public.ordini;
CREATE POLICY "Permetti lettura ordini" 
ON public.ordini FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permetti inserimento ordini" ON public.ordini;
CREATE POLICY "Permetti inserimento ordini" 
ON public.ordini FOR INSERT 
WITH CHECK (quantita_richiesta > 0);

DROP POLICY IF EXISTS "Permetti aggiornamento ordini" ON public.ordini;
CREATE POLICY "Permetti aggiornamento ordini" 
ON public.ordini FOR UPDATE 
USING (true);

-- ==========================================================
-- 2. GESTIONE UTENTI & TUTORIAL ONBOARDING
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.utenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    codice_id TEXT UNIQUE NOT NULL,
    ruolo TEXT NOT NULL DEFAULT 'Operatore' CHECK (ruolo IN ('Operatore', 'Admin')),
    password TEXT,
    has_completed_tutorial BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.utenti 
ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT FALSE;

ALTER TABLE public.utenti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permetti lettura utenti profilo" ON public.utenti;
CREATE POLICY "Permetti lettura utenti profilo" 
ON public.utenti FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permetti modifica e inserimento utenti" ON public.utenti;
CREATE POLICY "Permetti modifica e inserimento utenti" 
ON public.utenti FOR ALL 
USING (true);

-- ==========================================================
-- 3. STORED PROCEDURE TRANSAZIONALE: handle_bulk_movement
-- Garantisce atomicità, previene giacenze negative e sanitizza p_change
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_bulk_movement(
    p_tool_ids UUID[],
    p_op_type TEXT,
    p_change INTEGER,
    p_operator TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    t_id UUID;
    cur_qty INTEGER;
BEGIN
    -- Validazione parametri di sicurezza
    IF p_change IS NULL OR p_change <= 0 THEN
        RAISE EXCEPTION 'La quantità di variazione deve essere strettamente maggiore di zero (ricevuto: %)', p_change;
    END IF;

    IF p_op_type NOT IN ('carico', 'scarico') THEN
        RAISE EXCEPTION 'Tipo di operazione non valido: % (accettati solo: carico, scarico)', p_op_type;
    END IF;

    IF p_tool_ids IS NULL OR array_length(p_tool_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Nessun utensile specificato per il movimento';
    END IF;

    -- Esegui il movimento su ogni utensile
    FOREACH t_id IN ARRAY p_tool_ids LOOP
        -- Blocca la riga per prevenire race condition concorrenti (FOR UPDATE)
        SELECT "Quantità" INTO cur_qty 
        FROM public."Utensili_B1" 
        WHERE id = t_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Utensile con ID % non trovato a magazzino', t_id;
        END IF;

        IF p_op_type = 'scarico' THEN
            IF COALESCE(cur_qty, 0) < p_change THEN
                RAISE EXCEPTION 'Giacenza insufficiente per utensile ID % (Disponibili: %, Richiesti: %)', t_id, COALESCE(cur_qty, 0), p_change;
            END IF;

            UPDATE public."Utensili_B1"
            SET "Quantità" = COALESCE("Quantità", 0) - p_change
            WHERE id = t_id;
        ELSIF p_op_type = 'carico' THEN
            UPDATE public."Utensili_B1"
            SET "Quantità" = COALESCE("Quantità", 0) + p_change
            WHERE id = t_id;
        END IF;

        -- Registra log in movements_history
        INSERT INTO public.movements_history (
            tool_id,
            op_type,
            quantity,
            operator,
            created_at
        ) VALUES (
            t_id,
            p_op_type,
            p_change,
            COALESCE(p_operator, 'Sconosciuto'),
            now()
        );
    END LOOP;
END;
$$;

