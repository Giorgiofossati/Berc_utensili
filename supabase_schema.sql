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

-- ==========================================================
-- 2.5 TABELLE COMMESSE E GIACENZE DISLOCATE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.commesse (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codice TEXT UNIQUE NOT NULL,
    descrizione TEXT,
    ubicazione TEXT,
    stato TEXT DEFAULT 'Attiva' CHECK (stato IN ('Attiva', 'Chiusa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.commesse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura commesse" ON public.commesse;
CREATE POLICY "Permetti lettura commesse" ON public.commesse FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione commesse" ON public.commesse;
CREATE POLICY "Permetti gestione commesse" ON public.commesse FOR ALL USING (true);

-- Update movements_history to support commesse (must run if movements_history exists)
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS commessa_id UUID REFERENCES public.commesse(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movements_history_commessa_id ON public.movements_history(commessa_id);

CREATE TABLE IF NOT EXISTS public.giacenze_commesse (
    tool_id UUID REFERENCES public."Utensili_B1"(id) ON DELETE CASCADE,
    commessa_id UUID REFERENCES public.commesse(id) ON DELETE CASCADE,
    quantita INTEGER NOT NULL CHECK (quantita >= 0),
    PRIMARY KEY (tool_id, commessa_id)
);

ALTER TABLE public.giacenze_commesse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura giacenze" ON public.giacenze_commesse;
CREATE POLICY "Permetti lettura giacenze" ON public.giacenze_commesse FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione giacenze" ON public.giacenze_commesse;
CREATE POLICY "Permetti gestione giacenze" ON public.giacenze_commesse FOR ALL USING (true);

-- ==========================================================
-- 3. STORED PROCEDURE TRANSAZIONALE: handle_bulk_movement
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_bulk_movement(
    p_tool_ids UUID[],
    p_op_type TEXT,
    p_change INTEGER,
    p_operator TEXT,
    p_commessa_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    t_id UUID;
    cur_qty INTEGER;
BEGIN
    IF p_change IS NULL OR p_change <= 0 THEN
        RAISE EXCEPTION 'La quantita di variazione deve essere maggiore di zero (ricevuto: %)', p_change;
    END IF;

    IF p_op_type NOT IN ('carico', 'scarico', 'spostamento') THEN
        RAISE EXCEPTION 'Tipo non valido: % (accettati: carico, scarico, spostamento)', p_op_type;
    END IF;

    IF p_tool_ids IS NULL OR array_length(p_tool_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Nessun utensile specificato';
    END IF;

    FOREACH t_id IN ARRAY p_tool_ids LOOP
        SELECT "Quantità" INTO cur_qty FROM public."Utensili_B1" WHERE id = t_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Utensile ID % non trovato', t_id;
        END IF;

        IF p_op_type = 'scarico' THEN
            IF COALESCE(cur_qty, 0) < p_change THEN
                RAISE EXCEPTION 'Giacenza insufficiente per ID %', t_id;
            END IF;
            IF p_commessa_id IS NOT NULL THEN
                DECLARE
                    c_qty INTEGER;
                BEGIN
                    SELECT quantita INTO c_qty FROM public.giacenze_commesse WHERE tool_id = t_id AND commessa_id = p_commessa_id FOR UPDATE;
                    IF NOT FOUND OR c_qty < p_change THEN
                         RAISE EXCEPTION 'Giacenza insufficiente sulla commessa per ID %', t_id;
                    END IF;
                    UPDATE public.giacenze_commesse SET quantita = quantita - p_change WHERE tool_id = t_id AND commessa_id = p_commessa_id;
                END;
            END IF;
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) - p_change WHERE id = t_id;

        ELSIF p_op_type = 'carico' THEN
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) + p_change WHERE id = t_id;
            IF p_commessa_id IS NOT NULL THEN
                INSERT INTO public.giacenze_commesse (tool_id, commessa_id, quantita) VALUES (t_id, p_commessa_id, p_change)
                ON CONFLICT (tool_id, commessa_id) DO UPDATE SET quantita = giacenze_commesse.quantita + EXCLUDED.quantita;
            END IF;
            
        ELSIF p_op_type = 'spostamento' THEN
            IF p_commessa_id IS NULL THEN
                RAISE EXCEPTION 'Spostamento richiede commessa_id';
            END IF;
            DECLARE
                alloc_qty INTEGER;
            BEGIN
                SELECT COALESCE(SUM(quantita), 0) INTO alloc_qty FROM public.giacenze_commesse WHERE tool_id = t_id;
                IF (COALESCE(cur_qty, 0) - alloc_qty) < p_change THEN
                    RAISE EXCEPTION 'Giacenza libera insufficiente per spostamento. (Disp: %)', (COALESCE(cur_qty, 0) - alloc_qty);
                END IF;
            END;
            INSERT INTO public.giacenze_commesse (tool_id, commessa_id, quantita) VALUES (t_id, p_commessa_id, p_change)
            ON CONFLICT (tool_id, commessa_id) DO UPDATE SET quantita = giacenze_commesse.quantita + EXCLUDED.quantita;
        END IF;

        INSERT INTO public.movements_history (tool_id, tipo_operazione, quantita, operatore, commessa_id, created_at)
        VALUES (t_id, p_op_type, p_change, COALESCE(p_operator, 'Sconosciuto'), p_commessa_id, now());
    END LOOP;
END;
$$;

-- ==========================================================
-- 4. STORED PROCEDURE EVOLUTA: handle_multi_movement
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_multi_movement(
    p_items JSONB,
    p_operator TEXT,
    p_commessa_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    t_id UUID;
    cur_qty INTEGER;
    v_qty INTEGER;
    v_op_type TEXT;
    v_comm_id UUID;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Nessun articolo specificato';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        t_id := (item->>'tool_id')::UUID;
        v_qty := (item->>'quantity')::INTEGER;
        v_op_type := item->>'op_type';
        
        IF item->>'commessa_id' IS NOT NULL THEN
            v_comm_id := (item->>'commessa_id')::UUID;
        ELSE
            v_comm_id := p_commessa_id;
        END IF;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantita non valida';
        END IF;

        SELECT "Quantità" INTO cur_qty FROM public."Utensili_B1" WHERE id = t_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Utensile ID % non trovato', t_id;
        END IF;

        IF v_op_type = 'scarico' THEN
            IF COALESCE(cur_qty, 0) < v_qty THEN
                RAISE EXCEPTION 'Giacenza globale insufficiente per ID %', t_id;
            END IF;
            IF v_comm_id IS NOT NULL THEN
                DECLARE
                    c_qty INTEGER;
                BEGIN
                    SELECT quantita INTO c_qty FROM public.giacenze_commesse WHERE tool_id = t_id AND commessa_id = v_comm_id FOR UPDATE;
                    IF NOT FOUND OR c_qty < v_qty THEN
                         RAISE EXCEPTION 'Giacenza insufficiente sulla commessa per ID %', t_id;
                    END IF;
                    UPDATE public.giacenze_commesse SET quantita = quantita - v_qty WHERE tool_id = t_id AND commessa_id = v_comm_id;
                END;
            END IF;
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) - v_qty WHERE id = t_id;

        ELSIF v_op_type = 'carico' THEN
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) + v_qty WHERE id = t_id;
            IF v_comm_id IS NOT NULL THEN
                INSERT INTO public.giacenze_commesse (tool_id, commessa_id, quantita) VALUES (t_id, v_comm_id, v_qty)
                ON CONFLICT (tool_id, commessa_id) DO UPDATE SET quantita = giacenze_commesse.quantita + EXCLUDED.quantita;
            END IF;
            
        ELSIF v_op_type = 'spostamento' THEN
            IF v_comm_id IS NULL THEN
                RAISE EXCEPTION 'Spostamento richiede commessa_id';
            END IF;
            DECLARE
                alloc_qty INTEGER;
            BEGIN
                SELECT COALESCE(SUM(quantita), 0) INTO alloc_qty FROM public.giacenze_commesse WHERE tool_id = t_id;
                IF (COALESCE(cur_qty, 0) - alloc_qty) < v_qty THEN
                    RAISE EXCEPTION 'Giacenza libera insufficiente';
                END IF;
            END;
            INSERT INTO public.giacenze_commesse (tool_id, commessa_id, quantita) VALUES (t_id, v_comm_id, v_qty)
            ON CONFLICT (tool_id, commessa_id) DO UPDATE SET quantita = giacenze_commesse.quantita + EXCLUDED.quantita;
        END IF;

        INSERT INTO public.movements_history (tool_id, tipo_operazione, quantita, operatore, commessa_id, created_at)
        VALUES (t_id, v_op_type, v_qty, COALESCE(p_operator, 'Sconosciuto'), v_comm_id, now());
    END LOOP;
END;
$$;
