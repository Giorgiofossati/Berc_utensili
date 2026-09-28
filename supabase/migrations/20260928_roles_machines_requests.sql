-- ==========================================================
-- MIGRAZIONE: RUOLI (MANAGER), MACCHINE CNC, RICHIESTE MOVIMENTO
-- Conforme a Supabase Postgres Best Practices
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
DROP POLICY IF EXISTS "Permetti lettura macchine" ON public.macchine_cnc;
CREATE POLICY "Permetti lettura macchine" ON public.macchine_cnc FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione macchine" ON public.macchine_cnc;
CREATE POLICY "Permetti gestione macchine" ON public.macchine_cnc FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_macchine_cnc_is_active ON public.macchine_cnc(is_active);


-- Inserimento alcune macchine campione se tabella vuota
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
    operatore_id UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
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
DROP POLICY IF EXISTS "Permetti lettura richieste" ON public.richieste_movimento;
CREATE POLICY "Permetti lettura richieste" ON public.richieste_movimento FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti inserimento richieste" ON public.richieste_movimento;
CREATE POLICY "Permetti inserimento richieste" ON public.richieste_movimento FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permetti aggiornamento richieste" ON public.richieste_movimento;
CREATE POLICY "Permetti aggiornamento richieste" ON public.richieste_movimento FOR UPDATE USING (true);

-- Indici per performance e JOIN (Best Practices)
CREATE INDEX IF NOT EXISTS idx_richieste_operatore_id ON public.richieste_movimento(operatore_id);
CREATE INDEX IF NOT EXISTS idx_richieste_commessa_id ON public.richieste_movimento(commessa_id);
CREATE INDEX IF NOT EXISTS idx_richieste_macchina_id ON public.richieste_movimento(macchina_id);
CREATE INDEX IF NOT EXISTS idx_richieste_gestito_da ON public.richieste_movimento(gestito_da);
CREATE INDEX IF NOT EXISTS idx_richieste_stato_in_attesa ON public.richieste_movimento(created_at DESC) WHERE stato = 'in_attesa';


-- 5. TABELLA VOCI DELLA RICHIESTA (DETTAGLIO UTENSILI RICHIESTI)
CREATE TABLE IF NOT EXISTS public.richieste_movimento_voci (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    richiesta_id UUID NOT NULL REFERENCES public.richieste_movimento(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public."Utensili_B1"(id) ON DELETE RESTRICT,
    quantita INTEGER NOT NULL CHECK (quantita > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.richieste_movimento_voci ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura voci richieste" ON public.richieste_movimento_voci;
CREATE POLICY "Permetti lettura voci richieste" ON public.richieste_movimento_voci FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione voci richieste" ON public.richieste_movimento_voci;
CREATE POLICY "Permetti gestione voci richieste" ON public.richieste_movimento_voci FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_richieste_voci_richiesta_id ON public.richieste_movimento_voci(richiesta_id);
CREATE INDEX IF NOT EXISTS idx_richieste_voci_tool_id ON public.richieste_movimento_voci(tool_id);


-- 6. AGGIORNAMENTO MOVEMENTS_HISTORY CON MACCHINA, OPERATORE DESTINATARIO E RICHIESTA_ID
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS macchina_id UUID REFERENCES public.macchine_cnc(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movements_history_macchina_id ON public.movements_history(macchina_id);

ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS operatore_destinatario TEXT NULL;

ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS richiesta_id UUID REFERENCES public.richieste_movimento(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movements_history_richiesta_id ON public.movements_history(richiesta_id);


-- 7. STORED PROCEDURE: EVASIONE ATOMICA RICHIESTA MOVIMENTO
CREATE OR REPLACE FUNCTION public.evadi_richiesta_movimento(
    p_richiesta_id UUID,
    p_admin_id UUID,
    p_admin_nome TEXT,
    p_note_risoluzione TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v RECORD;
    cur_stock INTEGER;
BEGIN
    -- 1. Trova e blocca la richiesta
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

    -- 2. Itera su ciascuna voce della richiesta
    FOR v IN 
        SELECT rmv.*, u."Quantità" as stock_attuale, u."Tipologia"
        FROM public.richieste_movimento_voci rmv
        JOIN public."Utensili_B1" u ON u.id = rmv.tool_id
        WHERE rmv.richiesta_id = p_richiesta_id
    LOOP
        -- Blocca la riga dell'utensile
        SELECT "Quantità" INTO cur_stock 
        FROM public."Utensili_B1" 
        WHERE id = v.tool_id 
        FOR UPDATE;

        IF r.tipo = 'prelievo' THEN
            IF COALESCE(cur_stock, 0) < v.quantita THEN
                RAISE EXCEPTION 'Giacenza insufficiente per %: disponibili % pz, richiesti % pz', 
                    v."Tipologia", COALESCE(cur_stock, 0), v.quantita;
            END IF;

            -- Scarico da Utensili_B1
            UPDATE public."Utensili_B1" 
            SET "Quantità" = COALESCE("Quantità", 0) - v.quantita 
            WHERE id = v.tool_id;

            -- Inserimento storico movimento
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

            -- Inserimento storico movimento
            INSERT INTO public.movements_history (
                tool_id, tipo_operazione, quantita, operatore, 
                operatore_destinatario, commessa_id, macchina_id, richiesta_id, created_at
            ) VALUES (
                v.tool_id, 'carico', v.quantita, COALESCE(p_admin_nome, 'Admin'), 
                r.operatore_nome, r.commessa_id, r.macchina_id, p_richiesta_id, now()
            );
        END IF;
    END LOOP;

    -- 3. Aggiorna lo stato della richiesta ad approvata / evasa
    UPDATE public.richieste_movimento
    SET stato = 'approvata',
        gestito_da = p_admin_id,
        note_risoluzione = p_note_risoluzione,
        evasa_il = now()
    WHERE id = p_richiesta_id;
END;
$$;


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


-- 9. PUBBLICAZIONE REALTIME (Se estensione abilitata)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.richieste_movimento;
        EXCEPTION WHEN duplicate_object THEN
            -- già presente nella pubblicazione
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.macchine_cnc;
        EXCEPTION WHEN duplicate_object THEN
            -- già presente nella pubblicazione
        END;
    END IF;
END $$;
