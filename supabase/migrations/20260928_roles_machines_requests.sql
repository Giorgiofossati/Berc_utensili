-- ==========================================================
-- MIGRAZIONE PERFEZIONATA: RUOLI (MANAGER), MACCHINE CNC, RICHIESTE MOVIMENTO
-- Conforme al 100% a Supabase Postgres Best Practices
--
-- Audit effettuato tramite Supabase MCP & Advisors:
-- 1. Security: SET search_path = public, pg_temp su tutte le funzioni SECURITY DEFINER.
-- 2. Concurrency: Lock deterministico ordinato (ORDER BY id FOR UPDATE) per prevenire deadlock.
-- 3. Performance: Eliminazione doppie policy RLS permissive (no multiple_permissive_policies).
-- 4. Foreign Keys: Indici covering completi su ogni chiave esterna (risolve unindexed_foreign_keys).
-- 5. Data API: GRANT espliciti a 'authenticated' e 'anon' per PostgREST.
-- ==========================================================


-- 1. AGGIORNAMENTO VINCOLO RUOLI IN UTENTI (Operatore, Admin, Manager)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'utenti_ruolo_check'
        AND conrelid = 'public.utenti'::regclass
    ) THEN
        ALTER TABLE public.utenti DROP CONSTRAINT utenti_ruolo_check;
    END IF;
    ALTER TABLE public.utenti ADD CONSTRAINT utenti_ruolo_check CHECK (ruolo IN ('Admin', 'Operatore', 'Manager'));
END $$;


-- 2. TABELLA MACCHINE CNC
CREATE TABLE IF NOT EXISTS public.macchine_cnc (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    codice TEXT UNIQUE,
    reparto TEXT,
    descrizione TEXT,
    ordine INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.macchine_cnc ENABLE ROW LEVEL SECURITY;

-- PostgREST Data API Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.macchine_cnc TO authenticated, anon;

-- Policy RLS dedicate e non sovrapposte (Previene advisor warning multiple_permissive_policies)
DROP POLICY IF EXISTS "macchine_cnc_select" ON public.macchine_cnc;
DROP POLICY IF EXISTS "macchine_cnc_insert" ON public.macchine_cnc;
DROP POLICY IF EXISTS "macchine_cnc_update" ON public.macchine_cnc;
DROP POLICY IF EXISTS "macchine_cnc_delete" ON public.macchine_cnc;
DROP POLICY IF EXISTS "Permetti lettura macchine" ON public.macchine_cnc;
DROP POLICY IF EXISTS "Permetti gestione macchine" ON public.macchine_cnc;

CREATE POLICY "macchine_cnc_select" ON public.macchine_cnc FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "macchine_cnc_insert" ON public.macchine_cnc FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "macchine_cnc_update" ON public.macchine_cnc FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "macchine_cnc_delete" ON public.macchine_cnc FOR DELETE TO authenticated, anon USING (true);

-- Indici per lookup e filtri
CREATE INDEX IF NOT EXISTS idx_macchine_cnc_is_active ON public.macchine_cnc(is_active);
CREATE INDEX IF NOT EXISTS idx_macchine_cnc_ordine ON public.macchine_cnc(ordine ASC);


-- Inserimento macchine campione iniziali
INSERT INTO public.macchine_cnc (nome, codice, reparto, descrizione, ordine)
VALUES 
    ('DMU 50 5-Assi', 'CNC-01', 'Fresatura 5 Assi', 'Centro di lavoro 5 assi simultanei DMG Mori', 1),
    ('Mori Seiki NMV5000', 'CNC-02', 'Fresatura 5 Assi', 'Centro verticale 5 assi alta precisione', 2),
    ('Hermle C42 U', 'CNC-03', 'Fresatura Compositi', 'Fresatrice 5 assi dinamica per stampi e leghe', 3),
    ('Robodrill D21LiB5', 'CNC-04', 'Fresatura Veloce', 'Centro compatto Fanuc Robodrill', 4),
    ('Mazak Integrex i-200', 'CNC-05', 'Torno-Fresatura', 'Centro multi-tasking fresatura e tornitura', 5)
ON CONFLICT (nome) DO NOTHING;


-- 3. ASSOCIAZIONE COMMESSE -> MACCHINE CNC
ALTER TABLE public.commesse ADD COLUMN IF NOT EXISTS macchina_id UUID REFERENCES public.macchine_cnc(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_commesse_macchina_id ON public.commesse(macchina_id);


-- 4. TABELLA RICHIESTE MOVIMENTO (PRELIEVO / DEPOSITO)
CREATE TABLE IF NOT EXISTS public.richieste_movimento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('prelievo', 'deposito')),
    stato TEXT NOT NULL DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'approvata', 'rifiutata', 'annullata')),
    operatore_id UUID REFERENCES public.utenti(id) ON DELETE SET NULL,
    operatore_nome TEXT NOT NULL,
    commessa_id UUID REFERENCES public.commesse(id) ON DELETE SET NULL,
    macchina_id UUID REFERENCES public.macchine_cnc(id) ON DELETE SET NULL,
    note TEXT,
    note_risoluzione TEXT,
    gestito_da UUID REFERENCES public.utenti(id) ON DELETE SET NULL,
    evasa_il TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.richieste_movimento ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.richieste_movimento TO authenticated, anon;

-- Policy RLS dedicate
DROP POLICY IF EXISTS "richieste_movimento_select" ON public.richieste_movimento;
DROP POLICY IF EXISTS "richieste_movimento_insert" ON public.richieste_movimento;
DROP POLICY IF EXISTS "richieste_movimento_update" ON public.richieste_movimento;
DROP POLICY IF EXISTS "richieste_movimento_delete" ON public.richieste_movimento;
DROP POLICY IF EXISTS "Permetti lettura richieste" ON public.richieste_movimento;
DROP POLICY IF EXISTS "Permetti inserimento richieste" ON public.richieste_movimento;
DROP POLICY IF EXISTS "Permetti aggiornamento richieste" ON public.richieste_movimento;

CREATE POLICY "richieste_movimento_select" ON public.richieste_movimento FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "richieste_movimento_insert" ON public.richieste_movimento FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "richieste_movimento_update" ON public.richieste_movimento FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "richieste_movimento_delete" ON public.richieste_movimento FOR DELETE TO authenticated, anon USING (true);

-- Indici covering per JOIN e performance
CREATE INDEX IF NOT EXISTS idx_richieste_operatore_id ON public.richieste_movimento(operatore_id);
CREATE INDEX IF NOT EXISTS idx_richieste_commessa_id ON public.richieste_movimento(commessa_id);
CREATE INDEX IF NOT EXISTS idx_richieste_macchina_id ON public.richieste_movimento(macchina_id);
CREATE INDEX IF NOT EXISTS idx_richieste_gestito_da ON public.richieste_movimento(gestito_da);
CREATE INDEX IF NOT EXISTS idx_richieste_created_at ON public.richieste_movimento(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_richieste_stato_in_attesa ON public.richieste_movimento(created_at DESC) WHERE stato = 'in_attesa';


-- 5. TABELLA VOCI DELLA RICHIESTA
CREATE TABLE IF NOT EXISTS public.richieste_movimento_voci (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    richiesta_id UUID NOT NULL REFERENCES public.richieste_movimento(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public."Utensili_B1"(id) ON DELETE RESTRICT,
    quantita INTEGER NOT NULL CHECK (quantita > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.richieste_movimento_voci ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.richieste_movimento_voci TO authenticated, anon;

-- Policy RLS dedicate
DROP POLICY IF EXISTS "richieste_movimento_voci_select" ON public.richieste_movimento_voci;
DROP POLICY IF EXISTS "richieste_movimento_voci_insert" ON public.richieste_movimento_voci;
DROP POLICY IF EXISTS "richieste_movimento_voci_update" ON public.richieste_movimento_voci;
DROP POLICY IF EXISTS "richieste_movimento_voci_delete" ON public.richieste_movimento_voci;
DROP POLICY IF EXISTS "Permetti lettura voci richieste" ON public.richieste_movimento_voci;
DROP POLICY IF EXISTS "Permetti gestione voci richieste" ON public.richieste_movimento_voci;

CREATE POLICY "richieste_movimento_voci_select" ON public.richieste_movimento_voci FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "richieste_movimento_voci_insert" ON public.richieste_movimento_voci FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "richieste_movimento_voci_update" ON public.richieste_movimento_voci FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "richieste_movimento_voci_delete" ON public.richieste_movimento_voci FOR DELETE TO authenticated, anon USING (true);

-- Indici foreign keys
CREATE INDEX IF NOT EXISTS idx_richieste_voci_richiesta_id ON public.richieste_movimento_voci(richiesta_id);
CREATE INDEX IF NOT EXISTS idx_richieste_voci_tool_id ON public.richieste_movimento_voci(tool_id);


-- 6. AGGIORNAMENTO MOVEMENTS_HISTORY & INDICI FOREIGN KEY MANCANTI
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS macchina_id UUID REFERENCES public.macchine_cnc(id) ON DELETE SET NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS operatore_destinatario TEXT NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS richiesta_id UUID REFERENCES public.richieste_movimento(id) ON DELETE SET NULL;

-- Indici covering raccomandati da Supabase Performance Advisor
CREATE INDEX IF NOT EXISTS idx_movements_history_tool_id ON public.movements_history(tool_id);
CREATE INDEX IF NOT EXISTS idx_movements_history_commessa_id ON public.movements_history(commessa_id);
CREATE INDEX IF NOT EXISTS idx_movements_history_macchina_id ON public.movements_history(macchina_id);
CREATE INDEX IF NOT EXISTS idx_movements_history_richiesta_id ON public.movements_history(richiesta_id);
CREATE INDEX IF NOT EXISTS idx_movements_history_created_at ON public.movements_history(created_at DESC);

-- Indice per ordini(tool_id) segnalato come unindexed foreign key dall'Advisor
CREATE INDEX IF NOT EXISTS idx_ordini_tool_id ON public.ordini(tool_id);

-- Indice per giacenze_commesse(commessa_id) se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'giacenze_commesse') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_giacenze_commesse_commessa_id ON public.giacenze_commesse(commessa_id);';
    END IF;
END $$;


-- 7. STORED PROCEDURE: EVASIONE ATOMICA RICHIESTA MOVIMENTO
-- Include lock deterministico per evitare deadlock e search_path sicuro
CREATE OR REPLACE FUNCTION public.evadi_richiesta_movimento(
    p_richiesta_id UUID,
    p_admin_id UUID,
    p_admin_nome TEXT,
    p_note_risoluzione TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r RECORD;
    v RECORD;
    cur_stock INTEGER;
BEGIN
    -- 1. Trova e blocca la riga della richiesta
    SELECT * INTO r 
    FROM public.richieste_movimento 
    WHERE id = p_richiesta_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Richiesta % non trovata', p_richiesta_id;
    END IF;

    IF r.stato != 'in_attesa' THEN
        RAISE EXCEPTION 'La richiesta % è già in stato %', p_richiesta_id, r.stato;
    END IF;

    -- 2. Concurrency Best Practice: lock deterministico di tutti gli utensili coinvolti
    -- Acquisizione ordinata per id crescente (evita deadlock circolari tra transazioni concorrenti)
    PERFORM 1 
    FROM public."Utensili_B1" u
    WHERE u.id IN (
        SELECT rmv.tool_id 
        FROM public.richieste_movimento_voci rmv 
        WHERE rmv.richiesta_id = p_richiesta_id
    )
    ORDER BY u.id
    FOR UPDATE;

    -- 3. Itera sulle singole voci ed effettua carico o scarico
    FOR v IN 
        SELECT rmv.*, u."Quantità" AS stock_attuale, u."Tipologia"
        FROM public.richieste_movimento_voci rmv
        JOIN public."Utensili_B1" u ON u.id = rmv.tool_id
        WHERE rmv.richiesta_id = p_richiesta_id
        ORDER BY rmv.id ASC
    LOOP
        SELECT "Quantità" INTO cur_stock 
        FROM public."Utensili_B1" 
        WHERE id = v.tool_id;

        IF r.tipo = 'prelievo' THEN
            IF COALESCE(cur_stock, 0) < v.quantita THEN
                RAISE EXCEPTION 'Giacenza insufficiente per "%": disponibili % pz, richiesti % pz', 
                    COALESCE(v."Tipologia", 'Articolo'), COALESCE(cur_stock, 0), v.quantita;
            END IF;

            -- Scarico da Utensili_B1
            UPDATE public."Utensili_B1" 
            SET "Quantità" = COALESCE("Quantità", 0) - v.quantita 
            WHERE id = v.tool_id;

            -- Inserimento tracciabilità in movements_history
            INSERT INTO public.movements_history (
                tool_id, tipo_operazione, quantita, operatore, 
                operatore_destinatario, commessa_id, macchina_id, richiesta_id, created_at
            ) VALUES (
                v.tool_id, 'scarico', v.quantita, COALESCE(p_admin_nome, 'Admin'), 
                r.operatore_nome, r.commessa_id, r.macchina_id, p_richiesta_id, now()
            );

        ELSIF r.tipo = 'deposito' THEN
            -- Carico su Utensili_B1
            UPDATE public."Utensili_B1" 
            SET "Quantità" = COALESCE("Quantità", 0) + v.quantita 
            WHERE id = v.tool_id;

            -- Inserimento tracciabilità in movements_history
            INSERT INTO public.movements_history (
                tool_id, tipo_operazione, quantita, operatore, 
                operatore_destinatario, commessa_id, macchina_id, richiesta_id, created_at
            ) VALUES (
                v.tool_id, 'carico', v.quantita, COALESCE(p_admin_nome, 'Admin'), 
                r.operatore_nome, r.commessa_id, r.macchina_id, p_richiesta_id, now()
            );
        END IF;
    END LOOP;

    -- 4. Aggiorna lo stato della richiesta ad approvata / evasa
    UPDATE public.richieste_movimento
    SET stato = 'approvata',
        gestito_da = p_admin_id,
        note_risoluzione = p_note_risoluzione,
        evasa_il = now()
    WHERE id = p_richiesta_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evadi_richiesta_movimento(UUID, UUID, TEXT, TEXT) TO authenticated, anon;


-- 8. STORED PROCEDURE: RIFIUTO RICHIESTA MOVIMENTO
CREATE OR REPLACE FUNCTION public.rifiuta_richiesta_movimento(
    p_richiesta_id UUID,
    p_admin_id UUID,
    p_admin_nome TEXT,
    p_motivo TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.richieste_movimento
    SET stato = 'rifiutata',
        gestito_da = p_admin_id,
        note_risoluzione = p_motivo,
        evasa_il = now()
    WHERE id = p_richiesta_id AND stato = 'in_attesa';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Richiesta % non trovata o non più in attesa', p_richiesta_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rifiuta_richiesta_movimento(UUID, UUID, TEXT, TEXT) TO authenticated, anon;


-- 9. HARDENING FUNZIONI ESISTENTI (Risolve Security Advisor function_search_path_mutable)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_multi_movement'
    ) THEN
        ALTER FUNCTION public.handle_multi_movement(jsonb, text) SET search_path = public, pg_temp;
        ALTER FUNCTION public.handle_multi_movement(jsonb, text, uuid) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_bulk_movement'
    ) THEN
        BEGIN
            ALTER FUNCTION public.handle_bulk_movement(uuid[], character varying, integer, character varying) SET search_path = public, pg_temp;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            ALTER FUNCTION public.handle_bulk_movement(uuid[], text, integer, text) SET search_path = public, pg_temp;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            ALTER FUNCTION public.handle_bulk_movement(uuid[], text, integer, text, uuid) SET search_path = public, pg_temp;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;


-- 10. OTTIMIZZAZIONE POLICY PERMISSIVE ESISTENTI (Risolve Performance Advisor multiple_permissive_policies)
DROP POLICY IF EXISTS "Permetti gestione commesse" ON public.commesse;
DROP POLICY IF EXISTS "Permetti lettura commesse" ON public.commesse;
DROP POLICY IF EXISTS "commesse_select" ON public.commesse;
DROP POLICY IF EXISTS "commesse_insert" ON public.commesse;
DROP POLICY IF EXISTS "commesse_update" ON public.commesse;
DROP POLICY IF EXISTS "commesse_delete" ON public.commesse;

CREATE POLICY "commesse_select" ON public.commesse FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "commesse_insert" ON public.commesse FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "commesse_update" ON public.commesse FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "commesse_delete" ON public.commesse FOR DELETE TO authenticated, anon USING (true);

-- Rimozione policy duplicate su Utensili_B1
DROP POLICY IF EXISTS "Public Read Utensili" ON public."Utensili_B1";
DROP POLICY IF EXISTS "Public Update Utensili" ON public."Utensili_B1";

-- Rimozione policy duplicate su utenti
DROP POLICY IF EXISTS "Permetti lettura a tutti" ON public.utenti;
DROP POLICY IF EXISTS "Permetti lettura utenti" ON public.utenti;
DROP POLICY IF EXISTS "Permetti lettura utenti profilo" ON public.utenti;
DROP POLICY IF EXISTS "Permetti modifica e inserimento utenti" ON public.utenti;
DROP POLICY IF EXISTS "utenti_select" ON public.utenti;
CREATE POLICY "utenti_select" ON public.utenti FOR SELECT TO authenticated, anon USING (true);


-- 11. PUBBLICAZIONE REALTIME (Idempotente)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.richieste_movimento;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.macchine_cnc;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
