-- ==========================================================
-- MIGRAZIONE CONSOLIDATA: CICLO DI VITA UTENSILI & LAVORAZIONI CNC
-- Data: 2026-10-01
-- Comprende:
--   1. Schema tabelle & colonne estese (commesse, posizioni_utensile, Utensili_B1, utenti, movements_history)
--   2. Migrazione iniziale stock -> posizioni_utensile e trigger allineamento Quantita
--   3. RPC Base di Movimentazione & Avanzamento Lavorazioni (preleva, deposita, smonta, registra_avanzamento_lavorazione, eredita_utensile_bordo, chiudi_lavorazione)
--   4. RPC Riaffilature (cestello, spedizione fornitore, rientro guidato)
--   5. Realtime & Compatibilita legacy
-- ==========================================================


-- >>> FASE 1: SCHEMA E MIGRAZIONE <<<
-- Fase 1: Schema e Migrazione Dati per il Ciclo di Vita Utensili

-- 2.1 macchine_cnc
CREATE TABLE IF NOT EXISTS public.macchine_cnc (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    reparto TEXT,
    ordine INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.macchine_cnc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura macchine" ON public.macchine_cnc;
DROP POLICY IF EXISTS "Permetti gestione macchine" ON public.macchine_cnc;
DROP POLICY IF EXISTS "Permetti accesso macchine" ON public.macchine_cnc;
CREATE POLICY "Permetti accesso macchine" ON public.macchine_cnc FOR ALL USING (true) WITH CHECK (true);


-- 2.2 Utensili_B1 (colonne aggiunte)
ALTER TABLE public."Utensili_B1" ADD COLUMN IF NOT EXISTS prezzo_acquisto NUMERIC(10,2) NULL;
ALTER TABLE public."Utensili_B1" ADD COLUMN IF NOT EXISTS costo_riaffilatura NUMERIC(10,2) NULL;
ALTER TABLE public."Utensili_B1" ADD COLUMN IF NOT EXISTS max_riaffilature INTEGER NOT NULL DEFAULT 3;

-- 2.3 utenti (colonne aggiunte)
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS can_view_dashboard BOOLEAN DEFAULT false;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS can_manage_catalog BOOLEAN DEFAULT false;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS can_manage_riaffilature BOOLEAN DEFAULT false;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS can_pick_tools BOOLEAN DEFAULT true;

-- 2.4 commesse (estensione Lavorazioni CNC)
ALTER TABLE public.commesse ADD COLUMN IF NOT EXISTS nome_lavorazione TEXT NULL;
ALTER TABLE public.commesse ADD COLUMN IF NOT EXISTS traccia_ciclo_vita BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.commesse ADD COLUMN IF NOT EXISTS target_pezzi_lotto INTEGER NULL;
ALTER TABLE public.commesse ADD COLUMN IF NOT EXISTS pezzi_completati INTEGER NOT NULL DEFAULT 0;

-- 2.5 ordini (colonna aggiunta)
ALTER TABLE public.ordini ADD COLUMN IF NOT EXISTS commessa_id UUID REFERENCES public.commesse(id);
CREATE INDEX IF NOT EXISTS idx_ordini_commessa_id ON public.ordini(commessa_id);

-- 2.6 spedizioni_riaffilatura
CREATE TABLE IF NOT EXISTS public.spedizioni_riaffilatura (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ddt TEXT NULL,
    fornitore TEXT NULL,
    stato TEXT NOT NULL CHECK (stato IN ('in_viaggio', 'rientrata')) DEFAULT 'in_viaggio',
    data_invio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_rientro TIMESTAMP WITH TIME ZONE NULL,
    operatore_invio TEXT NULL,
    operatore_rientro TEXT NULL
);
ALTER TABLE public.spedizioni_riaffilatura ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura spedizioni" ON public.spedizioni_riaffilatura;
DROP POLICY IF EXISTS "Permetti gestione spedizioni" ON public.spedizioni_riaffilatura;
DROP POLICY IF EXISTS "Permetti accesso spedizioni" ON public.spedizioni_riaffilatura;
CREATE POLICY "Permetti accesso spedizioni" ON public.spedizioni_riaffilatura FOR ALL USING (true) WITH CHECK (true);

-- 2.7 posizioni_utensile
CREATE TABLE IF NOT EXISTS public.posizioni_utensile (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_utensile UUID NOT NULL REFERENCES public."Utensili_B1"(id) ON DELETE CASCADE,
    luogo TEXT NOT NULL CHECK (luogo IN ('magazzino', 'cassetto', 'macchina', 'cestello', 'fornitore')),
    stato TEXT NOT NULL CHECK (stato IN ('nuovo', 'usato', 'riaffilato')),
    n_riaffilature INTEGER NOT NULL DEFAULT 0 CHECK (n_riaffilature >= 0),
    id_commessa UUID REFERENCES public.commesse(id),
    id_macchina UUID REFERENCES public.macchine_cnc(id),
    id_spedizione UUID REFERENCES public.spedizioni_riaffilatura(id),
    quantita INTEGER NOT NULL CHECK (quantita > 0),
    pezzi_lavorati INTEGER NOT NULL DEFAULT 0,
    target_pezzi_fresa INTEGER NULL,
    entrata_il TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    aggiornato_il TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_luogo_macchina CHECK (
        (luogo = 'macchina' AND id_macchina IS NOT NULL) OR 
        (luogo != 'macchina' AND id_macchina IS NULL)
    ),
    CONSTRAINT chk_luogo_cassetto CHECK (
        (luogo = 'cassetto' AND id_commessa IS NOT NULL) OR 
        (luogo != 'cassetto')
    ),
    CONSTRAINT chk_luogo_magazzino CHECK (
        (luogo = 'magazzino' AND id_commessa IS NULL AND id_macchina IS NULL) OR 
        (luogo != 'magazzino')
    ),
    CONSTRAINT chk_luogo_fornitore CHECK (
        (luogo = 'fornitore' AND id_spedizione IS NOT NULL) OR 
        (luogo != 'fornitore' AND id_spedizione IS NULL)
    ),
    CONSTRAINT chk_stato_nuovo CHECK (
        (stato = 'nuovo' AND n_riaffilature = 0) OR 
        (stato != 'nuovo')
    )
);

ALTER TABLE public.posizioni_utensile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permetti lettura posizioni" ON public.posizioni_utensile;
DROP POLICY IF EXISTS "Permetti gestione posizioni" ON public.posizioni_utensile;
DROP POLICY IF EXISTS "Permetti accesso posizioni" ON public.posizioni_utensile;
CREATE POLICY "Permetti accesso posizioni" ON public.posizioni_utensile FOR ALL USING (true) WITH CHECK (true);

DROP INDEX IF EXISTS idx_posizioni_utensile_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_posizioni_utensile_unique 
ON public.posizioni_utensile (
    id_utensile, 
    luogo, 
    stato, 
    n_riaffilature, 
    id_commessa, 
    id_macchina, 
    id_spedizione
) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS idx_posizioni_luogo ON public.posizioni_utensile(luogo);
CREATE INDEX IF NOT EXISTS idx_posizioni_macchina ON public.posizioni_utensile(id_macchina);
CREATE INDEX IF NOT EXISTS idx_posizioni_commessa ON public.posizioni_utensile(id_commessa);
CREATE INDEX IF NOT EXISTS idx_posizioni_spedizione ON public.posizioni_utensile(id_spedizione);
CREATE INDEX IF NOT EXISTS idx_posizioni_utensile ON public.posizioni_utensile(id_utensile);


-- 2.8 movements_history
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS id_operazione UUID NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS id_macchina UUID NULL REFERENCES public.macchine_cnc(id);
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS luogo_da TEXT NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS luogo_a TEXT NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS stato TEXT NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS n_riaffilature INTEGER NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS id_spedizione UUID NULL REFERENCES public.spedizioni_riaffilatura(id);
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS causale_scarto TEXT NULL CHECK (causale_scarto IN ('usura', 'collisione', 'rottura_lavorazione', 'parametri_programma', 'altro', 'usura_limite_riaffilature', 'scarto_fornitore'));
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS nota TEXT NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(10,2) NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS pezzi_lavorati INTEGER NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS snapshot_da JSONB NULL;
ALTER TABLE public.movements_history ADD COLUMN IF NOT EXISTS snapshot_a JSONB NULL;
DROP INDEX IF EXISTS public.idx_movements_history_id_operazione_parziale;
CREATE INDEX IF NOT EXISTS idx_movements_history_id_operazione 
ON public.movements_history (id_operazione) 
WHERE id_operazione IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_history_id_macchina ON public.movements_history(id_macchina);
CREATE INDEX IF NOT EXISTS idx_movements_history_id_spedizione ON public.movements_history(id_spedizione);


-- §8 migrazione (PRIMA DI CREARE IL TRIGGER)
DO $$
DECLARE
    u RECORD;
    g RECORD;
    magazzino_qty INTEGER;
    err_record RECORD;
    err_list TEXT := '';
BEGIN
    -- 4. Utenti Admin e Manager ⇒ permessi
    UPDATE public.utenti
    SET can_view_dashboard = true,
        can_manage_catalog = true,
        can_manage_riaffilature = true,
        can_pick_tools = true
    WHERE ruolo = 'Admin';

    UPDATE public.utenti
    SET can_view_dashboard = true,
        can_manage_riaffilature = true,
        can_pick_tools = true
    WHERE ruolo = 'Manager';

    -- Pulizia policy permissive duplicate su giacenze_commesse per prevenire warning advisor Supabase
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'giacenze_commesse'
    ) THEN
        DROP POLICY IF EXISTS "Permetti gestione giacenze" ON public.giacenze_commesse;
        DROP POLICY IF EXISTS "Permetti lettura giacenze" ON public.giacenze_commesse;
    END IF;

    -- Popolamento iniziale posizioni_utensile (idempotente: eseguito solo se posizioni_utensile è vuota)
    IF NOT EXISTS (SELECT 1 FROM public.posizioni_utensile LIMIT 1) THEN
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'giacenze_commesse'
        ) THEN
            FOR u IN SELECT id, "Quantità" FROM public."Utensili_B1" LOOP
                magazzino_qty := COALESCE(u."Quantità", 0);
                
                FOR g IN SELECT commessa_id, quantita FROM public.giacenze_commesse WHERE tool_id = u.id AND quantita > 0 LOOP
                    INSERT INTO public.posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
                    VALUES (gen_random_uuid(), u.id, 'cassetto', 'nuovo', 0, g.commessa_id, g.quantita);
                    
                    magazzino_qty := magazzino_qty - g.quantita;
                END LOOP;
                
                IF magazzino_qty > 0 THEN
                    INSERT INTO public.posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
                    VALUES (gen_random_uuid(), u.id, 'magazzino', 'nuovo', 0, NULL, magazzino_qty);
                ELSIF magazzino_qty < 0 THEN
                    err_list := err_list || 'ID: ' || u.id || ' ha qty < 0 dopo assegnazione; ';
                END IF;
            END LOOP;
            
            IF err_list != '' THEN
                RAISE EXCEPTION 'Migrazione fallita: utensili con giacenze commesse > quantita: %', err_list;
            END IF;
            
            -- §8.3 Verifica finale: Se una riga non torna, la migration fallisce e stampa gli id
            err_list := '';
            FOR err_record IN (
                SELECT u.id, COALESCE(u."Quantità", 0) as orig_qty, COALESCE(p.somma_posizioni, 0) as calc_qty
                FROM public."Utensili_B1" u
                LEFT JOIN (
                    SELECT id_utensile, SUM(quantita) as somma_posizioni
                    FROM public.posizioni_utensile
                    WHERE luogo IN ('magazzino', 'cassetto')
                    GROUP BY id_utensile
                ) p ON p.id_utensile = u.id
                WHERE COALESCE(u."Quantità", 0) != COALESCE(p.somma_posizioni, 0)
            ) LOOP
                err_list := err_list || err_record.id || ' (Orig: ' || err_record.orig_qty || ', Calcolato: ' || err_record.calc_qty || '); ';
            END LOOP;

            IF err_list != '' THEN
                RAISE EXCEPTION 'Verifica fallita! Utensili sfasati: %', err_list;
            END IF;
            
            ALTER TABLE public.giacenze_commesse RENAME TO giacenze_commesse_legacy;
        ELSE
            -- Se giacenze_commesse è già stata rinominata o assente, popola direttamente da Utensili_B1
            INSERT INTO public.posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
            SELECT gen_random_uuid(), id, 'magazzino', 'nuovo', 0, NULL, "Quantità"
            FROM public."Utensili_B1"
            WHERE "Quantità" > 0;
        END IF;
    END IF;
END $$;


-- §7.1 trigger
CREATE OR REPLACE FUNCTION public.update_utensili_quantita_from_posizioni()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public."Utensili_B1"
        SET "Quantità" = (
            SELECT COALESCE(SUM(quantita), 0)
            FROM public.posizioni_utensile
            WHERE id_utensile = OLD.id_utensile
              AND luogo IN ('magazzino', 'cassetto')
        )
        WHERE id = OLD.id_utensile;
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public."Utensili_B1"
        SET "Quantità" = (
            SELECT COALESCE(SUM(quantita), 0)
            FROM public.posizioni_utensile
            WHERE id_utensile = NEW.id_utensile
              AND luogo IN ('magazzino', 'cassetto')
        )
        WHERE id = NEW.id_utensile;
        
        IF (TG_OP = 'UPDATE' AND NEW.id_utensile != OLD.id_utensile) THEN
            UPDATE public."Utensili_B1"
            SET "Quantità" = (
                SELECT COALESCE(SUM(quantita), 0)
                FROM public.posizioni_utensile
                WHERE id_utensile = OLD.id_utensile
                  AND luogo IN ('magazzino', 'cassetto')
            )
            WHERE id = OLD.id_utensile;
        END IF;

        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_update_utensili_quantita ON public.posizioni_utensile;
CREATE TRIGGER trg_update_utensili_quantita
AFTER INSERT OR UPDATE OR DELETE ON public.posizioni_utensile
FOR EACH ROW EXECUTE FUNCTION public.update_utensili_quantita_from_posizioni();


-- >>> FASE 2: RPC BASE E LAVORAZIONI <<<

-- Helpers
CREATE OR REPLACE FUNCTION public.check_permesso(p_id_operatore UUID, p_permesso TEXT)
RETURNS TEXT
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_permesso BOOLEAN;
    v_nome_operatore TEXT;
BEGIN
    EXECUTE format('SELECT %I, nome || '' '' || cognome FROM public.utenti WHERE id = $1', p_permesso)
    INTO v_has_permesso, v_nome_operatore
    USING p_id_operatore;

    IF NOT COALESCE(v_has_permesso, false) THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0001', 
            MESSAGE = 'PERMESSO_NEGATO', 
            DETAIL = jsonb_build_object('permesso', p_permesso)::text;
    END IF;
    
    RETURN COALESCE(v_nome_operatore, 'Operatore Sconosciuto');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_permesso(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_permesso(UUID, TEXT) TO authenticated, anon;


-- 3.1 get_opzioni_prelievo
CREATE OR REPLACE FUNCTION public.get_opzioni_prelievo(p_id_utensile UUID, p_id_operatore UUID)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_utensile json;
    v_macchine json;
    v_commesse_per_macchina jsonb := '{}'::jsonb;
    v_disponibilita json;
    v_altrove json;
    v_mac RECORD;
    v_op_nome TEXT;
BEGIN
    SELECT (nome || ' ' || cognome) INTO v_op_nome FROM public.utenti WHERE id = p_id_operatore;

    SELECT json_build_object(
        'id', u.id,
        'codice', u."Codice",
        'descrizione', u."Descrizione Originale",
        'ubicazione', u."Ubicazione",
        'max_riaffilature', u.max_riaffilature
    ) INTO v_utensile
    FROM "Utensili_B1" u WHERE u.id = p_id_utensile;

    SELECT COALESCE(json_agg(m), '[]'::json) INTO v_macchine
    FROM (
        SELECT m.id, m.nome, m.reparto, 
               (SELECT MAX(mh.created_at) FROM movements_history mh WHERE mh.id_macchina = m.id AND (v_op_nome IS NULL OR mh.operatore = v_op_nome)) as ultimo_uso_operatore
        FROM macchine_cnc m
        WHERE m.is_active = true
        ORDER BY 
            (SELECT MAX(mh.created_at) FROM movements_history mh WHERE mh.id_macchina = m.id AND (v_op_nome IS NULL OR mh.operatore = v_op_nome)) DESC NULLS LAST,
            m.ordine
    ) m;

    FOR v_mac IN SELECT id FROM macchine_cnc WHERE is_active = true LOOP
        v_commesse_per_macchina := jsonb_set(
            v_commesse_per_macchina,
            ARRAY[v_mac.id::text],
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', c.id,
                    'codice', c.codice,
                    'descrizione', c.descrizione,
                    'ubicazione_cassetto', c.ubicazione,
                    'ultimo_uso', c.ultimo_uso,
                    'fresca', (c.ultimo_uso > now() - interval '72 hours')
                ))
                FROM (
                    SELECT c2.id, c2.codice, c2.descrizione, c2.ubicazione, MAX(mh.created_at) as ultimo_uso
                    FROM commesse c2
                    JOIN movements_history mh ON mh.commessa_id = c2.id
                    WHERE mh.id_macchina = v_mac.id AND c2.stato = 'Attiva'
                    GROUP BY c2.id, c2.codice, c2.descrizione, c2.ubicazione
                    ORDER BY MAX(mh.created_at) DESC
                    LIMIT 5
                ) c
            ), '[]'::jsonb)
        );
    END LOOP;

    SELECT COALESCE(json_agg(d), '[]'::json) INTO v_disponibilita
    FROM (
        SELECT 
            p.luogo,
            p.id_commessa,
            c.codice as codice_commessa,
            CASE WHEN p.luogo = 'cassetto' THEN c.ubicazione ELSE u."Ubicazione" END as ubicazione,
            p.stato,
            p.n_riaffilature,
            p.quantita
        FROM posizioni_utensile p
        LEFT JOIN commesse c ON c.id = p.id_commessa
        JOIN "Utensili_B1" u ON u.id = p.id_utensile
        WHERE p.id_utensile = p_id_utensile AND p.luogo IN ('magazzino', 'cassetto')
        ORDER BY p.n_riaffilature ASC
    ) d;

    SELECT COALESCE(json_agg(a), '[]'::json) INTO v_altrove
    FROM (
        SELECT 
            p.id as id_posizione,
            p.id_macchina,
            m.nome as nome_macchina,
            c.codice as codice_commessa,
            p.stato,
            p.quantita,
            p.entrata_il
        FROM posizioni_utensile p
        JOIN macchine_cnc m ON m.id = p.id_macchina
        LEFT JOIN commesse c ON c.id = p.id_commessa
        WHERE p.id_utensile = p_id_utensile AND p.luogo = 'macchina'
        AND p.entrata_il < now() - interval '7 days'
    ) a;

    RETURN json_build_object(
        'utensile', v_utensile,
        'macchine', v_macchine,
        'commesse_per_macchina', v_commesse_per_macchina::json,
        'disponibilita', v_disponibilita,
        'altrove_in_macchina', v_altrove
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_opzioni_prelievo TO anon, authenticated;

-- 3.2 get_in_produzione
CREATE OR REPLACE FUNCTION public.get_in_produzione()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_righe json;
BEGIN
    SELECT COALESCE(json_agg(r), '[]'::json) INTO v_righe
    FROM (
        SELECT 
            p.id as id_posizione,
            p.id_utensile,
            u."Codice",
            u."Descrizione Originale",
            p.luogo,
            p.id_macchina,
            m.nome as nome_macchina,
            p.id_commessa,
            c.codice as codice_commessa,
            c.descrizione as descrizione_commessa,
            c.nome_lavorazione,
            c.traccia_ciclo_vita,
            c.target_pezzi_lotto,
            c.pezzi_completati,
            c.ubicazione as ubicazione_cassetto,
            p.stato,
            p.n_riaffilature,
            u.max_riaffilature,
            p.quantita,
            p.pezzi_lavorati,
            p.target_pezzi_fresa,
            p.entrata_il
        FROM posizioni_utensile p
        JOIN "Utensili_B1" u ON u.id = p.id_utensile
        LEFT JOIN macchine_cnc m ON m.id = p.id_macchina
        LEFT JOIN commesse c ON c.id = p.id_commessa
        WHERE p.luogo IN ('macchina', 'cassetto')
    ) r;
    
    RETURN json_build_object('righe', v_righe);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_in_produzione TO anon, authenticated;


-- 3.4 get_opzioni_deposito
CREATE OR REPLACE FUNCTION public.get_opzioni_deposito(p_id_utensile UUID)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_utensile json;
    v_ordine_aperto json;
    v_commesse_attive json;
BEGIN
    SELECT json_build_object(
        'id', u.id,
        'codice', u."Codice",
        'descrizione', u."Descrizione Originale",
        'ubicazione', u."Ubicazione"
    ) INTO v_utensile
    FROM "Utensili_B1" u WHERE u.id = p_id_utensile;

    SELECT json_build_object(
        'id', o.id,
        'quantita_richiesta', o.quantita_richiesta,
        'id_commessa', o.commessa_id,
        'codice_commessa', c.codice
    ) INTO v_ordine_aperto
    FROM ordini o
    LEFT JOIN commesse c ON c.id = o.commessa_id
    WHERE o.tool_id = p_id_utensile AND o.stato = 'In Attesa'
    ORDER BY o.data_ordine ASC LIMIT 1;

    SELECT COALESCE(json_agg(ca), '[]'::json) INTO v_commesse_attive
    FROM (
        SELECT c.id, c.codice, c.descrizione, c.ubicazione as ubicazione_cassetto,
               (SELECT COALESCE(SUM(quantita), 0) FROM posizioni_utensile p WHERE p.id_commessa = c.id AND p.id_utensile = p_id_utensile AND p.luogo = 'cassetto') as pezzi_nel_cassetto
        FROM commesse c
        LEFT JOIN movements_history mh ON mh.commessa_id = c.id
        WHERE c.stato = 'Attiva'
        GROUP BY c.id, c.codice, c.descrizione, c.ubicazione
        ORDER BY 
            (c.id = (v_ordine_aperto->>'id_commessa')::uuid) DESC, 
            MAX(mh.created_at) DESC NULLS LAST
        LIMIT 6
    ) ca;
    
    RETURN json_build_object(
        'utensile', v_utensile,
        'ordine_aperto', v_ordine_aperto,
        'commesse_attive', v_commesse_attive
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_opzioni_deposito TO anon, authenticated;


-- 4.1 preleva
CREATE OR REPLACE FUNCTION public.preleva(
    p_id_operazione UUID,
    p_id_operatore UUID,
    p_id_utensile UUID,
    p_da_luogo TEXT,
    p_da_id_commessa UUID,
    p_da_id_posizione UUID,
    p_stato TEXT,
    p_id_macchina UUID,
    p_id_commessa UUID,
    p_quantita INT
) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_rimanenti INT := p_quantita;
    v_pos_record RECORD;
    v_presi INT;
    v_snapshot_da JSONB;
    v_snapshot_a JSONB;
    v_tipo_operazione TEXT := 'prelievo';
    v_costo_unitario NUMERIC(10,2);
BEGIN
    IF EXISTS (SELECT 1 FROM movements_history WHERE id_operazione = p_id_operazione) THEN
        RETURN json_build_object('ok', true, 'id_operazione', p_id_operazione, 'gia_eseguita', true);
    END IF;
    
    v_nome_operatore := check_permesso(p_id_operatore, 'can_pick_tools');
    
    IF p_quantita <= 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"p_quantita"}';
    END IF;
    
    IF p_id_commessa IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM commesse WHERE id = p_id_commessa AND stato = 'Chiusa') THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', (SELECT codice FROM commesse WHERE id = p_id_commessa))::text;
        END IF;
    END IF;

    SELECT (CASE WHEN p_stato = 'nuovo' THEN prezzo_acquisto ELSE NULL END) INTO v_costo_unitario
    FROM "Utensili_B1" WHERE id = p_id_utensile;

    IF p_da_id_posizione IS NOT NULL THEN
        SELECT * INTO v_pos_record FROM posizioni_utensile WHERE id = p_da_id_posizione FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'POSIZIONE_NON_TROVATA', DETAIL = '{}';
        END IF;
        IF v_pos_record.quantita < p_quantita THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GIACENZA_INSUFFICIENTE', DETAIL = json_build_object('disponibili', v_pos_record.quantita, 'richiesti', p_quantita)::text;
        END IF;
        
        IF v_pos_record.luogo = 'macchina' THEN v_tipo_operazione := 'spostamento_produzione'; END IF;
        
        v_snapshot_da := jsonb_build_object('id', v_pos_record.id, 'luogo', v_pos_record.luogo, 'id_commessa', v_pos_record.id_commessa, 'id_macchina', v_pos_record.id_macchina, 'stato', v_pos_record.stato, 'n_riaffilature', v_pos_record.n_riaffilature);
        
        IF v_pos_record.quantita = p_quantita THEN
            DELETE FROM posizioni_utensile WHERE id = p_da_id_posizione;
        ELSE
            UPDATE posizioni_utensile SET quantita = quantita - p_quantita WHERE id = p_da_id_posizione;
        END IF;
        
        INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
        VALUES (gen_random_uuid(), p_id_utensile, 'macchina', v_pos_record.stato, v_pos_record.n_riaffilature, p_id_commessa, p_id_macchina, p_quantita)
        ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
        DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
        RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
        
        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, costo_unitario, snapshot_da, snapshot_a)
        VALUES (p_id_operazione, p_id_utensile, v_nome_operatore, v_tipo_operazione, p_quantita, p_id_macchina, p_id_commessa, v_pos_record.luogo, 'macchina', v_pos_record.stato, v_pos_record.n_riaffilature, v_costo_unitario, v_snapshot_da, v_snapshot_a);
        
    ELSE
        -- Logica "prendi le più usate"
        FOR v_pos_record IN 
            SELECT * FROM posizioni_utensile 
            WHERE id_utensile = p_id_utensile AND luogo = p_da_luogo 
              AND (id_commessa = p_da_id_commessa OR (id_commessa IS NULL AND p_da_id_commessa IS NULL))
              AND stato = p_stato
            ORDER BY n_riaffilature ASC
            FOR UPDATE
        LOOP
            IF v_rimanenti <= 0 THEN EXIT; END IF;
            
            v_presi := LEAST(v_rimanenti, v_pos_record.quantita);
            v_rimanenti := v_rimanenti - v_presi;
            
            v_snapshot_da := jsonb_build_object('id', v_pos_record.id, 'luogo', v_pos_record.luogo, 'id_commessa', v_pos_record.id_commessa, 'id_macchina', v_pos_record.id_macchina, 'stato', v_pos_record.stato, 'n_riaffilature', v_pos_record.n_riaffilature);
            
            IF v_pos_record.quantita = v_presi THEN
                DELETE FROM posizioni_utensile WHERE id = v_pos_record.id;
            ELSE
                UPDATE posizioni_utensile SET quantita = quantita - v_presi WHERE id = v_pos_record.id;
            END IF;
            
            INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
            VALUES (gen_random_uuid(), p_id_utensile, 'macchina', v_pos_record.stato, v_pos_record.n_riaffilature, p_id_commessa, p_id_macchina, v_presi)
            ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
            DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
            RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
            
            INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, costo_unitario, snapshot_da, snapshot_a)
            VALUES (p_id_operazione, p_id_utensile, v_nome_operatore, v_tipo_operazione, v_presi, p_id_macchina, p_id_commessa, v_pos_record.luogo, 'macchina', v_pos_record.stato, v_pos_record.n_riaffilature, v_costo_unitario, v_snapshot_da, v_snapshot_a);
        END LOOP;
        
        IF v_rimanenti > 0 THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GIACENZA_INSUFFICIENTE', DETAIL = json_build_object('disponibili', p_quantita - v_rimanenti, 'richiesti', p_quantita)::text;
        END IF;
    END IF;

    RETURN json_build_object('ok', true, 'id_operazione', p_id_operazione, 'gia_eseguita', false, 'quantita', p_quantita);
END;
$$;
GRANT EXECUTE ON FUNCTION public.preleva TO anon, authenticated;

-- 4.2 deposita
CREATE OR REPLACE FUNCTION public.deposita(
    p_id_operazione UUID,
    p_id_operatore UUID,
    p_id_utensile UUID,
    p_quantita INT,
    p_stato TEXT DEFAULT 'nuovo',
    p_id_commessa UUID DEFAULT NULL,
    p_id_ordine UUID DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_luogo TEXT := CASE WHEN p_id_commessa IS NOT NULL THEN 'cassetto' ELSE 'magazzino' END;
    v_snapshot_a JSONB;
    v_costo_unitario NUMERIC(10,2);
BEGIN
    IF EXISTS (SELECT 1 FROM movements_history WHERE id_operazione = p_id_operazione) THEN
        RETURN json_build_object('ok', true, 'id_operazione', p_id_operazione, 'gia_eseguita', true);
    END IF;
    
    SELECT nome || ' ' || cognome INTO v_nome_operatore FROM utenti WHERE id = p_id_operatore;
    IF v_nome_operatore IS NULL THEN v_nome_operatore := 'Operatore Sconosciuto'; END IF;
    
    SELECT (CASE WHEN p_stato = 'nuovo' THEN prezzo_acquisto ELSE costo_riaffilatura END) INTO v_costo_unitario
    FROM "Utensili_B1" WHERE id = p_id_utensile;

    IF p_id_commessa IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM commesse WHERE id = p_id_commessa AND stato = 'Chiusa') THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', (SELECT codice FROM commesse WHERE id = p_id_commessa))::text;
        END IF;
    END IF;

    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
    VALUES (gen_random_uuid(), p_id_utensile, v_luogo, p_stato, 0, p_id_commessa, p_quantita)
    ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
    DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
    RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
    
    INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, costo_unitario, snapshot_a)
    VALUES (p_id_operazione, p_id_utensile, v_nome_operatore, 'deposito', p_quantita, p_id_commessa, NULL, v_luogo, p_stato, 0, v_costo_unitario, v_snapshot_a);
    
    IF p_id_ordine IS NOT NULL THEN
        UPDATE ordini SET stato = 'Completato' WHERE id = p_id_ordine AND p_quantita >= quantita_richiesta;
    END IF;

    RETURN json_build_object('ok', true, 'id_operazione', p_id_operazione, 'gia_eseguita', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.deposita TO anon, authenticated;

-- 4.3 smonta
CREATE OR REPLACE FUNCTION public.smonta(
    p_id_operazione UUID,
    p_id_operatore UUID,
    p_id_posizione UUID,
    p_quantita INT,
    p_esito TEXT,
    p_causale TEXT DEFAULT NULL,
    p_nota TEXT DEFAULT NULL,
    p_dest_id_macchina UUID DEFAULT NULL,
    p_dest_id_commessa UUID DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_pos RECORD;
    v_snapshot_da JSONB;
    v_snapshot_a JSONB;
    v_luogo_dest TEXT;
    v_stato_dest TEXT;
    v_esito_effettivo TEXT := p_esito;
    v_causale_effettiva TEXT := p_causale;
    v_max_riaffilature INT;
    v_destinazione JSON;
    v_costo_unitario NUMERIC(10,2);
    v_is_commessa_attiva BOOLEAN := false;
BEGIN
    IF EXISTS (SELECT 1 FROM movements_history WHERE id_operazione = p_id_operazione) THEN
        RETURN json_build_object('ok', true, 'id_operazione', p_id_operazione, 'gia_eseguita', true);
    END IF;
    
    v_nome_operatore := check_permesso(p_id_operatore, 'can_pick_tools');
    
    SELECT p.*, u.max_riaffilature, (CASE WHEN p.stato = 'nuovo' THEN u.prezzo_acquisto ELSE u.costo_riaffilatura END) as cu
    INTO v_pos 
    FROM posizioni_utensile p JOIN "Utensili_B1" u ON u.id = p.id_utensile 
    WHERE p.id = p_id_posizione FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'POSIZIONE_NON_TROVATA', DETAIL = '{}'; END IF;
    IF v_pos.luogo != 'macchina' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"luogo"}'; END IF;
    IF v_pos.quantita < p_quantita THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GIACENZA_INSUFFICIENTE', DETAIL = json_build_object('disponibili', v_pos.quantita, 'richiesti', p_quantita)::text; END IF;
    
    IF p_esito = 'rotto' AND (p_causale IS NULL OR p_causale NOT IN ('usura', 'collisione')) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"p_causale"}';
    END IF;

    v_costo_unitario := v_pos.cu;
    v_snapshot_da := jsonb_build_object('id', v_pos.id, 'luogo', v_pos.luogo, 'id_commessa', v_pos.id_commessa, 'id_macchina', v_pos.id_macchina, 'stato', v_pos.stato, 'n_riaffilature', v_pos.n_riaffilature);
    
    IF p_esito = 'consumato' AND v_pos.n_riaffilature >= v_pos.max_riaffilature THEN
        v_esito_effettivo := 'rotto';
        v_causale_effettiva := 'usura_limite_riaffilature';
    END IF;

    IF v_pos.quantita = p_quantita THEN
        DELETE FROM posizioni_utensile WHERE id = p_id_posizione;
    ELSE
        UPDATE posizioni_utensile SET quantita = quantita - p_quantita WHERE id = p_id_posizione;
    END IF;
    
    IF v_esito_effettivo = 'rotto' THEN
        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, causale_scarto, nota, costo_unitario, snapshot_da, snapshot_a, pezzi_lavorati)
        VALUES (p_id_operazione, v_pos.id_utensile, v_nome_operatore, 'smontaggio_scarto', p_quantita, v_pos.id_macchina, v_pos.id_commessa, v_pos.luogo, NULL, v_pos.stato, v_pos.n_riaffilature, v_causale_effettiva, p_nota, v_costo_unitario, v_snapshot_da, NULL, v_pos.pezzi_lavorati);
        
        v_destinazione := NULL;
    ELSIF v_esito_effettivo = 'consumato' THEN
        v_luogo_dest := 'cestello';
        v_stato_dest := v_pos.stato;
        
        INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
        VALUES (gen_random_uuid(), v_pos.id_utensile, v_luogo_dest, v_stato_dest, v_pos.n_riaffilature, v_pos.id_commessa, p_quantita)
        ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
        DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
        RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
        
        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, nota, costo_unitario, snapshot_da, snapshot_a, pezzi_lavorati)
        VALUES (p_id_operazione, v_pos.id_utensile, v_nome_operatore, 'smontaggio_cestello', p_quantita, v_pos.id_macchina, v_pos.id_commessa, v_pos.luogo, v_luogo_dest, v_pos.stato, v_pos.n_riaffilature, p_nota, v_costo_unitario, v_snapshot_da, v_snapshot_a, v_pos.pezzi_lavorati);
        
        v_destinazione := json_build_object('luogo', 'cestello');
    ELSIF v_esito_effettivo = 'sposta' THEN
        v_luogo_dest := 'macchina';
        v_stato_dest := v_pos.stato;
        
        IF p_dest_id_commessa IS NOT NULL THEN
            IF EXISTS (SELECT 1 FROM commesse WHERE id = p_dest_id_commessa AND stato = 'Chiusa') THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', (SELECT codice FROM commesse WHERE id = p_dest_id_commessa))::text;
            END IF;
        END IF;

        INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
        VALUES (gen_random_uuid(), v_pos.id_utensile, v_luogo_dest, v_stato_dest, v_pos.n_riaffilature, p_dest_id_commessa, p_dest_id_macchina, p_quantita)
        ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
        DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
        RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
        
        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, nota, costo_unitario, snapshot_da, snapshot_a, pezzi_lavorati)
        VALUES (p_id_operazione, v_pos.id_utensile, v_nome_operatore, 'spostamento_produzione', p_quantita, p_dest_id_macchina, p_dest_id_commessa, v_pos.luogo, v_luogo_dest, v_pos.stato, v_pos.n_riaffilature, p_nota, v_costo_unitario, v_snapshot_da, v_snapshot_a, v_pos.pezzi_lavorati);
        
        v_destinazione := json_build_object(
            'luogo', 'macchina',
            'id_macchina', p_dest_id_macchina,
            'nome_macchina', (SELECT nome FROM macchine_cnc WHERE id = p_dest_id_macchina),
            'codice_commessa', (SELECT codice FROM commesse WHERE id = p_dest_id_commessa)
        );
    ELSIF v_esito_effettivo = 'buono' THEN
        IF v_pos.id_commessa IS NOT NULL THEN
            SELECT stato = 'Attiva' INTO v_is_commessa_attiva FROM commesse WHERE id = v_pos.id_commessa;
        END IF;
        
        IF v_is_commessa_attiva THEN
            v_luogo_dest := 'cassetto';
        ELSE
            v_luogo_dest := 'magazzino';
        END IF;
        
        v_stato_dest := 'usato';
        
        INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
        VALUES (gen_random_uuid(), v_pos.id_utensile, v_luogo_dest, v_stato_dest, v_pos.n_riaffilature, (CASE WHEN v_luogo_dest = 'cassetto' THEN v_pos.id_commessa ELSE NULL END), p_quantita)
        ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
        DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita
        RETURNING jsonb_build_object('id', id, 'luogo', luogo, 'id_commessa', id_commessa, 'id_macchina', id_macchina, 'stato', stato, 'n_riaffilature', n_riaffilature) INTO v_snapshot_a;
        
        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, nota, costo_unitario, snapshot_da, snapshot_a, pezzi_lavorati)
        VALUES (p_id_operazione, v_pos.id_utensile, v_nome_operatore, 'smontaggio_rientro', p_quantita, NULL, (CASE WHEN v_luogo_dest = 'cassetto' THEN v_pos.id_commessa ELSE NULL END), v_pos.luogo, v_luogo_dest, v_pos.stato, v_pos.n_riaffilature, p_nota, v_costo_unitario, v_snapshot_da, v_snapshot_a, v_pos.pezzi_lavorati);
        
        v_destinazione := json_build_object(
            'luogo', v_luogo_dest,
            'codice_commessa', (SELECT codice FROM commesse WHERE id = v_pos.id_commessa),
            'ubicazione', (CASE WHEN v_luogo_dest = 'cassetto' THEN (SELECT ubicazione FROM commesse WHERE id = v_pos.id_commessa) ELSE (SELECT "Ubicazione" FROM "Utensili_B1" WHERE id = v_pos.id_utensile) END)
        );
    END IF;

    RETURN json_build_object(
        'ok', true, 
        'id_operazione', p_id_operazione, 
        'gia_eseguita', false,
        'esito_effettivo', v_esito_effettivo,
        'causale_effettiva', v_causale_effettiva,
        'destinazione', v_destinazione
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.smonta TO anon, authenticated;

-- 4.7 annulla_operazione
CREATE OR REPLACE FUNCTION public.annulla_operazione(
    p_id_operazione_originale UUID,
    p_id_operatore UUID
) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_mh RECORD;
    v_nuovo_id_operazione UUID := gen_random_uuid();
    v_pos_a RECORD;
    v_is_rientro BOOLEAN := false;
BEGIN
    SELECT nome || ' ' || cognome INTO v_nome_operatore FROM utenti WHERE id = p_id_operatore;
    IF v_nome_operatore IS NULL THEN v_nome_operatore := 'Operatore Sconosciuto'; END IF;
    
    -- Check se l'operazione è già stata annullata
    IF EXISTS (
        SELECT 1 FROM movements_history 
        WHERE tipo_operazione = 'annullo' 
          AND nota = 'Annullo ' || p_id_operazione_originale::text
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ANNULLO_NON_POSSIBILE', DETAIL = '{"motivo":"gia_annullata"}';
    END IF;

    -- Check se l'operazione è recente (< 10 min) o se è un rientro
    IF NOT EXISTS (
        SELECT 1 FROM movements_history 
        WHERE id_operazione = p_id_operazione_originale 
        AND (created_at > now() - interval '10 minutes' OR tipo_operazione = 'rientro_riaffilatura')
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ANNULLO_NON_POSSIBILE', DETAIL = '{"motivo":"tempo_scaduto"}';
    END IF;

    FOR v_mh IN 
        SELECT * FROM movements_history 
        WHERE id_operazione = p_id_operazione_originale 
        ORDER BY created_at DESC
    LOOP
        IF v_mh.tipo_operazione = 'rientro_riaffilatura' THEN v_is_rientro := true; END IF;
        
        -- Se c'è uno snapshot_a (i pezzi sono andati da qualche parte), controlliamo che ci siano ancora
        IF v_mh.snapshot_a IS NOT NULL THEN
            SELECT * INTO v_pos_a FROM posizioni_utensile WHERE id = (v_mh.snapshot_a->>'id')::uuid FOR UPDATE;
            IF NOT FOUND OR v_pos_a.quantita < v_mh.quantita THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ANNULLO_NON_POSSIBILE', DETAIL = '{"motivo":"pezzi_spostati"}';
            END IF;
            
            -- Togliamo i pezzi dalla destinazione
            IF v_pos_a.quantita = v_mh.quantita THEN
                DELETE FROM posizioni_utensile WHERE id = v_pos_a.id;
            ELSE
                UPDATE posizioni_utensile SET quantita = quantita - v_mh.quantita WHERE id = v_pos_a.id;
            END IF;
        END IF;

        -- Rimettiamo i pezzi nell'origine
        IF v_mh.snapshot_da IS NOT NULL THEN
            INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione, quantita)
            VALUES (
                (v_mh.snapshot_da->>'id')::uuid, 
                v_mh.tool_id, 
                v_mh.snapshot_da->>'luogo', 
                v_mh.snapshot_da->>'stato', 
                (v_mh.snapshot_da->>'n_riaffilature')::int, 
                (v_mh.snapshot_da->>'id_commessa')::uuid, 
                (v_mh.snapshot_da->>'id_macchina')::uuid, 
                (v_mh.snapshot_da->>'id_spedizione')::uuid, 
                v_mh.quantita
            )
            ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
            DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita;
        END IF;

        INSERT INTO movements_history (id_operazione, tool_id, operatore, tipo_operazione, quantita, id_macchina, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, costo_unitario, nota)
        VALUES (v_nuovo_id_operazione, v_mh.tool_id, v_nome_operatore, 'annullo', v_mh.quantita, v_mh.id_macchina, v_mh.commessa_id, v_mh.luogo_a, v_mh.luogo_da, v_mh.stato, v_mh.n_riaffilature, v_mh.costo_unitario, 'Annullo ' || p_id_operazione_originale);
        
        IF v_is_rientro AND v_mh.id_spedizione IS NOT NULL THEN
            UPDATE spedizioni_riaffilatura SET stato = 'in_viaggio', data_rientro = NULL WHERE id = v_mh.id_spedizione;
        END IF;
    END LOOP;

    RETURN json_build_object('ok', true, 'id_operazione', v_nuovo_id_operazione);
END;
$$;
GRANT EXECUTE ON FUNCTION public.annulla_operazione TO anon, authenticated;


-- ==========================================================
-- RPC ESTENSIONE: CICLO DI VITA LAVORAZIONI CNC
-- ==========================================================

-- 4.8 registra_avanzamento_lavorazione
CREATE OR REPLACE FUNCTION public.registra_avanzamento_lavorazione(
    p_id_commessa UUID,
    p_pezzi_aggiunti INT,
    p_id_operatore UUID
)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_commessa RECORD;
    v_aggiornati INT := 0;
    v_nuovo_totale INT := 0;
BEGIN
    IF p_pezzi_aggiunti <= 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"p_pezzi_aggiunti"}';
    END IF;

    SELECT (nome || ' ' || cognome) INTO v_nome_operatore FROM utenti WHERE id = p_id_operatore;
    IF v_nome_operatore IS NULL THEN v_nome_operatore := 'Operatore Sconosciuto'; END IF;

    SELECT * INTO v_commessa FROM commesse WHERE id = p_id_commessa FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = '{}';
    END IF;
    IF v_commessa.stato = 'Chiusa' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', v_commessa.codice)::text;
    END IF;

    UPDATE commesse 
    SET pezzi_completati = COALESCE(pezzi_completati, 0) + p_pezzi_aggiunti
    WHERE id = p_id_commessa
    RETURNING pezzi_completati INTO v_nuovo_totale;

    -- Incrementa pezzi_lavorati per tutti gli utensili attualmente montati su quella lavorazione e macchina
    UPDATE posizioni_utensile
    SET pezzi_lavorati = COALESCE(pezzi_lavorati, 0) + p_pezzi_aggiunti,
        aggiornato_il = now()
    WHERE luogo = 'macchina' AND id_commessa = p_id_commessa;
    GET DIAGNOSTICS v_aggiornati = ROW_COUNT;

    -- Registra nello storico
    INSERT INTO movements_history (
        id_operazione, tool_id, operatore, tipo_operazione, quantita, commessa_id, id_macchina, nota, pezzi_lavorati, created_at
    ) VALUES (
        gen_random_uuid(), NULL, v_nome_operatore, 'avanzamento_produzione', p_pezzi_aggiunti, p_id_commessa, v_commessa.macchina_id,
        format('Avanzamento lavorazione %s: +%s pz', COALESCE(v_commessa.nome_lavorazione, v_commessa.codice), p_pezzi_aggiunti),
        p_pezzi_aggiunti, now()
    );

    RETURN json_build_object(
        'ok', true,
        'id_commessa', p_id_commessa,
        'pezzi_aggiunti', p_pezzi_aggiunti,
        'pezzi_completati', v_nuovo_totale,
        'utensili_aggiornati', v_aggiornati
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.registra_avanzamento_lavorazione(UUID, INT, UUID) TO anon, authenticated;


-- 4.9 eredita_utensile_bordo
CREATE OR REPLACE FUNCTION public.eredita_utensile_bordo(
    p_id_posizione UUID,
    p_nuova_commessa_id UUID,
    p_id_operatore UUID
)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_pos RECORD;
    v_commessa RECORD;
    v_pos_esistente RECORD;
BEGIN
    v_nome_operatore := check_permesso(p_id_operatore, 'can_pick_tools');

    SELECT * INTO v_pos FROM posizioni_utensile WHERE id = p_id_posizione FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'POSIZIONE_NON_TROVATA', DETAIL = '{}';
    END IF;
    IF v_pos.luogo != 'macchina' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"luogo"}';
    END IF;

    SELECT * INTO v_commessa FROM commesse WHERE id = p_nuova_commessa_id;
    IF NOT FOUND OR v_commessa.stato = 'Chiusa' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', v_commessa.codice)::text;
    END IF;

    -- Se già assegnata a questa commessa, è no-op
    IF v_pos.id_commessa IS NOT DISTINCT FROM p_nuova_commessa_id THEN
        RETURN json_build_object('ok', true, 'id_posizione', p_id_posizione, 'id_commessa', p_nuova_commessa_id, 'gia_assegnato', true);
    END IF;

    -- Verifica se esiste già una posizione identica su quella macchina per la nuova commessa
    SELECT * INTO v_pos_esistente FROM posizioni_utensile 
    WHERE id_utensile = v_pos.id_utensile 
      AND luogo = 'macchina' 
      AND stato = v_pos.stato 
      AND n_riaffilature = v_pos.n_riaffilature 
      AND id_commessa = p_nuova_commessa_id 
      AND id_macchina = v_pos.id_macchina 
      AND id != v_pos.id
    FOR UPDATE;

    IF FOUND THEN
        UPDATE posizioni_utensile
        SET quantita = quantita + v_pos.quantita,
            pezzi_lavorati = GREATEST(pezzi_lavorati, v_pos.pezzi_lavorati),
            aggiornato_il = now()
        WHERE id = v_pos_esistente.id;

        DELETE FROM posizioni_utensile WHERE id = p_id_posizione;
    ELSE
        UPDATE posizioni_utensile
        SET id_commessa = p_nuova_commessa_id,
            aggiornato_il = now()
        WHERE id = p_id_posizione;
    END IF;

    INSERT INTO movements_history (
        id_operazione, tool_id, operatore, tipo_operazione, quantita, commessa_id, id_macchina, luogo_da, luogo_a, stato, n_riaffilature, nota, pezzi_lavorati, created_at
    ) VALUES (
        gen_random_uuid(), v_pos.id_utensile, v_nome_operatore, 'eredita_bordo_macchina', v_pos.quantita, p_nuova_commessa_id, v_pos.id_macchina, 'macchina', 'macchina', v_pos.stato, v_pos.n_riaffilature,
        format('Utensile ereditato su lavorazione %s', COALESCE(v_commessa.nome_lavorazione, v_commessa.codice)),
        v_pos.pezzi_lavorati, now()
    );

    RETURN json_build_object('ok', true, 'id_posizione', p_id_posizione, 'id_commessa', p_nuova_commessa_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.eredita_utensile_bordo(UUID, UUID, UUID) TO anon, authenticated;


-- 4.10 chiudi_lavorazione
CREATE OR REPLACE FUNCTION public.chiudi_lavorazione(
    p_id_commessa UUID,
    p_svuota_cassetto BOOLEAN DEFAULT false,
    p_id_operatore UUID DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nome_operatore TEXT;
    v_commessa RECORD;
    v_pos_rec RECORD;
    v_svuotati INT := 0;
    v_lasciati_bordo INT := 0;
BEGIN
    SELECT (nome || ' ' || cognome) INTO v_nome_operatore FROM utenti WHERE id = p_id_operatore;
    IF v_nome_operatore IS NULL THEN v_nome_operatore := 'Operatore Sconosciuto'; END IF;

    SELECT * INTO v_commessa FROM commesse WHERE id = p_id_commessa FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = '{}';
    END IF;

    -- Imposta stato = 'Chiusa'
    UPDATE commesse SET stato = 'Chiusa' WHERE id = p_id_commessa;

    -- 1. Utensili macchina: passano a id_commessa = NULL (Generico a bordo)
    FOR v_pos_rec IN 
        SELECT * FROM posizioni_utensile 
        WHERE luogo = 'macchina' AND id_commessa = p_id_commessa 
        FOR UPDATE
    LOOP
        v_lasciati_bordo := v_lasciati_bordo + v_pos_rec.quantita;

        IF EXISTS (
            SELECT 1 FROM posizioni_utensile 
            WHERE id_utensile = v_pos_rec.id_utensile 
              AND luogo = 'macchina' 
              AND stato = v_pos_rec.stato 
              AND n_riaffilature = v_pos_rec.n_riaffilature 
              AND id_commessa IS NULL 
              AND id_macchina = v_pos_rec.id_macchina 
              AND id != v_pos_rec.id
        ) THEN
            UPDATE posizioni_utensile
            SET quantita = quantita + v_pos_rec.quantita,
                pezzi_lavorati = GREATEST(pezzi_lavorati, v_pos_rec.pezzi_lavorati),
                aggiornato_il = now()
            WHERE id_utensile = v_pos_rec.id_utensile 
              AND luogo = 'macchina' 
              AND stato = v_pos_rec.stato 
              AND n_riaffilature = v_pos_rec.n_riaffilature 
              AND id_commessa IS NULL 
              AND id_macchina = v_pos_rec.id_macchina 
              AND id != v_pos_rec.id;

            DELETE FROM posizioni_utensile WHERE id = v_pos_rec.id;
        ELSE
            UPDATE posizioni_utensile
            SET id_commessa = NULL,
                aggiornato_il = now()
            WHERE id = v_pos_rec.id;
        END IF;
    END LOOP;

    -- 2. Utensili cassetto: se p_svuota_cassetto = true, tornano a magazzino
    IF COALESCE(p_svuota_cassetto, false) THEN
        FOR v_pos_rec IN 
            SELECT * FROM posizioni_utensile 
            WHERE luogo = 'cassetto' AND id_commessa = p_id_commessa 
            FOR UPDATE
        LOOP
            v_svuotati := v_svuotati + v_pos_rec.quantita;

            -- Upsert in magazzino
            INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
            VALUES (gen_random_uuid(), v_pos_rec.id_utensile, 'magazzino', v_pos_rec.stato, v_pos_rec.n_riaffilature, NULL, v_pos_rec.quantita)
            ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
            DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita, aggiornato_il = now();

            DELETE FROM posizioni_utensile WHERE id = v_pos_rec.id;

            INSERT INTO movements_history (
                id_operazione, tool_id, operatore, tipo_operazione, quantita, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, nota, created_at
            ) VALUES (
                gen_random_uuid(), v_pos_rec.id_utensile, v_nome_operatore, 'rientro_cassetto_chiusura', v_pos_rec.quantita, p_id_commessa, 'cassetto', 'magazzino', v_pos_rec.stato, v_pos_rec.n_riaffilature,
                format('Chiusura lavorazione %s: svuotamento cassetto a magazzino', COALESCE(v_commessa.nome_lavorazione, v_commessa.codice)),
                now()
            );
        END LOOP;
    END IF;

    RETURN json_build_object(
        'ok', true,
        'id_commessa', p_id_commessa,
        'stato', 'Chiusa',
        'utensili_lasciati_bordo', v_lasciati_bordo,
        'utensili_svuotati_cassetto', v_svuotati
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.chiudi_lavorazione(UUID, BOOLEAN, UUID) TO anon, authenticated;



-- >>> FASE 3: RIAFFILATURE <<<
-- Fase 3: Riaffilature (cestello, spedizione, rientro guidato)

-- 1. get_riaffilature
CREATE OR REPLACE FUNCTION public.get_riaffilature(p_giorni_storico INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    res_cestello JSONB;
    res_spedizioni JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id_posizione', pu.id,
            'id_utensile', u.id,
            'descrizione', u."Descrizione Originale",
            'nome_macchina_origine', (
                SELECT mc.nome 
                FROM public.movements_history mh
                JOIN public.macchine_cnc mc ON mc.id = mh.id_macchina
                WHERE mh.tool_id = pu.id_utensile
                  AND mh.luogo_da = 'macchina'
                  AND mh.luogo_a = 'cestello'
                  AND mh.snapshot_a->>'id' = pu.id::text
                ORDER BY mh.created_at DESC LIMIT 1
            ),
            'codice_commessa', (SELECT codice FROM public.commesse c WHERE c.id = pu.id_commessa),
            'n_riaffilature', pu.n_riaffilature,
            'max_riaffilature', u.max_riaffilature,
            'quantita', pu.quantita,
            'entrata_il', pu.entrata_il
        )
    ), '[]'::jsonb)
    INTO res_cestello
    FROM public.posizioni_utensile pu
    JOIN public."Utensili_B1" u ON u.id = pu.id_utensile
    WHERE pu.luogo = 'cestello';

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', sr.id,
            'ddt', sr.ddt,
            'fornitore', sr.fornitore,
            'stato', sr.stato,
            'data_invio', sr.data_invio,
            'data_rientro', sr.data_rientro,
            'id_operazione_rientro', (
                SELECT mh_r.id_operazione 
                FROM public.movements_history mh_r 
                WHERE mh_r.id_spedizione = sr.id 
                  AND mh_r.tipo_operazione IN ('rientro_riaffilatura', 'scarto_fornitore')
                  AND NOT EXISTS (
                      SELECT 1 FROM public.movements_history mh_ann 
                      WHERE mh_ann.tipo_operazione = 'annullo' 
                        AND mh_ann.nota = 'Annullo ' || mh_r.id_operazione::text
                  )
                LIMIT 1
            ),
            'pezzi', (
                SELECT COALESCE(SUM(quantita), 0)
                FROM public.movements_history mh
                WHERE mh.id_spedizione = sr.id AND mh.tipo_operazione = 'spedizione_riaffilatura'
            ),
            'righe', CASE WHEN sr.stato = 'in_viaggio' THEN
                (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'id_posizione', pu.id,
                            'id_utensile', u.id,
                            'descrizione', u."Descrizione Originale",
                            'ubicazione_abituale', u."Ubicazione",
                            'id_commessa', c.id,
                            'codice_commessa', c.codice,
                            'ubicazione_cassetto', c.ubicazione,
                            'commessa_attiva', COALESCE(c.stato = 'Attiva', false),
                            'n_riaffilature', pu.n_riaffilature,
                            'max_riaffilature', u.max_riaffilature,
                            'quantita', pu.quantita
                        )
                    ), '[]'::jsonb)
                    FROM public.posizioni_utensile pu
                    JOIN public."Utensili_B1" u ON u.id = pu.id_utensile
                    LEFT JOIN public.commesse c ON c.id = pu.id_commessa
                    WHERE pu.id_spedizione = sr.id
                )
            ELSE
                (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'id_posizione', (mh.snapshot_a->>'id')::uuid,
                            'id_utensile', u.id,
                            'descrizione', u."Descrizione Originale",
                            'ubicazione_abituale', u."Ubicazione",
                            'id_commessa', c.id,
                            'codice_commessa', c.codice,
                            'ubicazione_cassetto', c.ubicazione,
                            'commessa_attiva', COALESCE(c.stato = 'Attiva', false),
                            'n_riaffilature', (mh.snapshot_a->>'n_riaffilature')::int,
                            'max_riaffilature', u.max_riaffilature,
                            'quantita', mh.quantita,
                            'scartati', (
                                SELECT COALESCE(SUM(mh_scarto.quantita), 0)
                                FROM public.movements_history mh_scarto
                                WHERE mh_scarto.id_spedizione = sr.id 
                                  AND mh_scarto.tipo_operazione = 'scarto_fornitore'
                                  AND mh_scarto.snapshot_da->>'id' = mh.snapshot_a->>'id'
                            )
                        )
                    ), '[]'::jsonb)
                    FROM public.movements_history mh
                    JOIN public."Utensili_B1" u ON u.id = mh.tool_id
                    LEFT JOIN public.commesse c ON c.id = (mh.snapshot_a->>'id_commessa')::uuid
                    WHERE mh.id_spedizione = sr.id AND mh.tipo_operazione = 'spedizione_riaffilatura'
                )
            END
        ) ORDER BY sr.data_invio DESC
    ), '[]'::jsonb)
    INTO res_spedizioni
    FROM public.spedizioni_riaffilatura sr
    WHERE sr.stato = 'in_viaggio'
       OR (sr.stato = 'rientrata' AND sr.data_rientro >= now() - (p_giorni_storico || ' days')::INTERVAL);

    RETURN jsonb_build_object(
        'cestello', res_cestello,
        'spedizioni', res_spedizioni
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_riaffilature(INT) TO anon, authenticated;

-- 2. spedisci_cestello
CREATE OR REPLACE FUNCTION public.spedisci_cestello(
    p_id_operazione UUID,
    p_id_operatore UUID,
    p_ddt TEXT DEFAULT NULL,
    p_fornitore TEXT DEFAULT NULL,
    p_id_posizioni UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_perm BOOLEAN;
    v_already_executed BOOLEAN;
    v_id_spedizione UUID;
    v_pezzi INT := 0;
    v_pos public.posizioni_utensile%ROWTYPE;
BEGIN
    SELECT can_manage_riaffilature INTO v_has_perm FROM public.utenti WHERE id = p_id_operatore;
    IF NOT COALESCE(v_has_perm, false) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PERMESSO_NEGATO', DETAIL = '{"permesso":"can_manage_riaffilature"}';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.movements_history WHERE id_operazione = p_id_operazione
    ) INTO v_already_executed;
    
    IF v_already_executed THEN
        SELECT id_spedizione INTO v_id_spedizione 
        FROM public.movements_history 
        WHERE id_operazione = p_id_operazione LIMIT 1;
        
        SELECT COALESCE(SUM(quantita), 0) INTO v_pezzi 
        FROM public.movements_history 
        WHERE id_operazione = p_id_operazione AND tipo_operazione = 'spedizione_riaffilatura';
        
        RETURN jsonb_build_object(
            'ok', true,
            'id_operazione', p_id_operazione,
            'gia_eseguita', true,
            'id_spedizione', v_id_spedizione,
            'pezzi', v_pezzi
        );
    END IF;

    IF p_id_posizioni IS NULL OR array_length(p_id_posizioni, 1) = 0 THEN
        IF NOT EXISTS (SELECT 1 FROM public.posizioni_utensile WHERE luogo = 'cestello' FOR UPDATE) THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"cestello"}';
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM public.posizioni_utensile WHERE id = ANY(p_id_posizioni) AND luogo = 'cestello' FOR UPDATE) THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"cestello"}';
        END IF;
    END IF;

    INSERT INTO public.spedizioni_riaffilatura (ddt, fornitore, stato, operatore_invio)
    VALUES (p_ddt, p_fornitore, 'in_viaggio', (SELECT nome || ' ' || cognome FROM public.utenti WHERE id = p_id_operatore))
    RETURNING id INTO v_id_spedizione;

    FOR v_pos IN 
        SELECT * FROM public.posizioni_utensile 
        WHERE luogo = 'cestello' 
          AND (p_id_posizioni IS NULL OR id = ANY(p_id_posizioni))
        FOR UPDATE
    LOOP
        v_pezzi := v_pezzi + v_pos.quantita;

        UPDATE public.posizioni_utensile
        SET luogo = 'fornitore',
            id_spedizione = v_id_spedizione,
            aggiornato_il = now()
        WHERE id = v_pos.id;

        INSERT INTO public.movements_history (
            id_operazione, tool_id, tipo_operazione, quantita, operatore,
            luogo_da, luogo_a, stato, n_riaffilature, id_spedizione,
            snapshot_da, snapshot_a, created_at
        ) VALUES (
            p_id_operazione, v_pos.id_utensile, 'spedizione_riaffilatura', v_pos.quantita, (SELECT nome || ' ' || cognome FROM public.utenti WHERE id = p_id_operatore),
            'cestello', 'fornitore', v_pos.stato, v_pos.n_riaffilature, v_id_spedizione,
            to_jsonb(v_pos), 
            jsonb_build_object(
                'id', v_pos.id, 'id_utensile', v_pos.id_utensile, 'luogo', 'fornitore', 
                'stato', v_pos.stato, 'n_riaffilature', v_pos.n_riaffilature, 
                'id_spedizione', v_id_spedizione, 'quantita', v_pos.quantita, 'id_commessa', v_pos.id_commessa
            ),
            now()
        );
    END LOOP;

    IF v_pezzi = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"cestello"}';
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'id_operazione', p_id_operazione,
        'gia_eseguita', false,
        'id_spedizione', v_id_spedizione,
        'pezzi', v_pezzi
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.spedisci_cestello(UUID, UUID, TEXT, TEXT, UUID[]) TO anon, authenticated;

-- 3. aggiorna_ddt
CREATE OR REPLACE FUNCTION public.aggiorna_ddt(
    p_id_spedizione UUID,
    p_ddt TEXT,
    p_fornitore TEXT DEFAULT NULL,
    p_id_operatore UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_perm BOOLEAN;
BEGIN
    IF p_id_operatore IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='DATI_NON_VALIDI', DETAIL='{"campo":"id_operatore"}'; END IF;
    
    SELECT can_manage_riaffilature INTO v_has_perm FROM public.utenti WHERE id = p_id_operatore;
    IF NOT COALESCE(v_has_perm, false) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PERMESSO_NEGATO', DETAIL = '{"permesso":"can_manage_riaffilature"}';
    END IF;

    UPDATE public.spedizioni_riaffilatura
    SET ddt = p_ddt,
        fornitore = COALESCE(p_fornitore, fornitore)
    WHERE id = p_id_spedizione;

    RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.aggiorna_ddt(UUID, TEXT, TEXT, UUID) TO anon, authenticated;

-- 4. rientra_spedizione
CREATE OR REPLACE FUNCTION public.rientra_spedizione(
    p_id_operazione UUID,
    p_id_operatore UUID,
    p_id_spedizione UUID,
    p_righe JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_perm BOOLEAN;
    v_already_executed BOOLEAN;
    v_sped_stato TEXT;
    v_count_spedizione INT;
    v_count_righe INT;
    v_riga JSONB;
    v_pos public.posizioni_utensile%ROWTYPE;
    v_pos_new public.posizioni_utensile%ROWTYPE;
    v_buoni INT := 0;
    v_scartati INT := 0;
    v_scarto_qty INT;
    v_buoni_qty INT;
    v_dest_luogo TEXT;
    v_dest_commessa UUID;
    v_costo_riaffilatura NUMERIC(10,2);
    v_nome_operatore TEXT;
    v_id_utensile UUID;
    v_max_riaffilature INT;
    v_snapshot_da JSONB;
    v_snapshot_a JSONB;
BEGIN
    SELECT can_manage_riaffilature, (nome || ' ' || cognome) INTO v_has_perm, v_nome_operatore FROM public.utenti WHERE id = p_id_operatore;
    IF NOT COALESCE(v_has_perm, false) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PERMESSO_NEGATO', DETAIL = '{"permesso":"can_manage_riaffilature"}';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.movements_history WHERE id_operazione = p_id_operazione
    ) INTO v_already_executed;
    
    IF v_already_executed THEN
        SELECT COALESCE(SUM(quantita), 0) INTO v_buoni
        FROM public.movements_history 
        WHERE id_operazione = p_id_operazione AND tipo_operazione = 'rientro_riaffilatura';
        
        SELECT COALESCE(SUM(quantita), 0) INTO v_scartati
        FROM public.movements_history 
        WHERE id_operazione = p_id_operazione AND tipo_operazione = 'scarto_fornitore';
        
        RETURN jsonb_build_object(
            'ok', true,
            'id_operazione', p_id_operazione,
            'gia_eseguita', true,
            'buoni', v_buoni,
            'scartati', v_scartati
        );
    END IF;

    SELECT stato INTO v_sped_stato FROM public.spedizioni_riaffilatura WHERE id = p_id_spedizione FOR UPDATE;
    IF v_sped_stato IS NULL OR v_sped_stato != 'in_viaggio' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"spedizione_non_valida"}';
    END IF;

    SELECT COUNT(*) INTO v_count_spedizione FROM public.posizioni_utensile WHERE id_spedizione = p_id_spedizione;
    SELECT COUNT(DISTINCT (elem->>'id_posizione')::uuid) INTO v_count_righe FROM jsonb_array_elements(p_righe) elem;
    IF v_count_spedizione != v_count_righe OR jsonb_array_length(p_righe) != v_count_spedizione THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"righe_mancanti"}';
    END IF;

    UPDATE public.spedizioni_riaffilatura
    SET stato = 'rientrata',
        data_rientro = now(),
        operatore_rientro = v_nome_operatore
    WHERE id = p_id_spedizione;

    FOR v_riga IN SELECT * FROM jsonb_array_elements(p_righe)
    LOOP
        SELECT * INTO v_pos FROM public.posizioni_utensile WHERE id = (v_riga->>'id_posizione')::uuid AND id_spedizione = p_id_spedizione FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"posizione_non_valida"}';
        END IF;

        v_snapshot_da := to_jsonb(v_pos);
        v_scarto_qty := (v_riga->>'scartati')::int;
        IF v_scarto_qty IS NULL OR v_scarto_qty < 0 OR v_scarto_qty > v_pos.quantita THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"scartati"}';
        END IF;
        
        v_buoni_qty := v_pos.quantita - v_scarto_qty;
        SELECT costo_riaffilatura INTO v_costo_riaffilatura FROM public."Utensili_B1" WHERE id = v_pos.id_utensile;

        IF v_scarto_qty > 0 THEN
            v_scartati := v_scartati + v_scarto_qty;
            INSERT INTO public.movements_history (
                id_operazione, tool_id, tipo_operazione, quantita, operatore,
                luogo_da, causale_scarto, id_spedizione, snapshot_da, created_at
            ) VALUES (
                p_id_operazione, v_pos.id_utensile, 'scarto_fornitore', v_scarto_qty, v_nome_operatore,
                'fornitore', 'scarto_fornitore', p_id_spedizione, v_snapshot_da, now()
            );
        END IF;

        IF v_buoni_qty > 0 THEN
            v_buoni := v_buoni + v_buoni_qty;
            v_dest_luogo := v_riga->'destinazione'->>'luogo';
            v_dest_commessa := (v_riga->'destinazione'->>'id_commessa')::uuid;

            IF v_dest_luogo NOT IN ('magazzino', 'cassetto') THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"destinazione"}';
            END IF;
            
            IF v_dest_luogo = 'cassetto' THEN
                IF v_dest_commessa IS NULL THEN
                    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DATI_NON_VALIDI', DETAIL = '{"campo":"destinazione"}';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM public.commesse WHERE id = v_dest_commessa AND stato = 'Attiva') THEN
                    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'COMMESSA_CHIUSA', DETAIL = json_build_object('codice', (SELECT codice FROM public.commesse WHERE id = v_dest_commessa))::text;
                END IF;
            END IF;

            DELETE FROM public.posizioni_utensile WHERE id = v_pos.id;
            
            INSERT INTO public.posizioni_utensile (
                id, id_utensile, luogo, stato, n_riaffilature, 
                id_commessa, id_macchina, id_spedizione, quantita
            ) VALUES (
                v_pos.id, v_pos.id_utensile, v_dest_luogo, 'riaffilato', v_pos.n_riaffilature + 1,
                v_dest_commessa, NULL, NULL, v_buoni_qty
            )
            ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
            DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita, aggiornato_il = now()
            RETURNING * INTO v_pos_new;
            
            v_snapshot_a := to_jsonb(v_pos_new);
            
            INSERT INTO public.movements_history (
                id_operazione, tool_id, tipo_operazione, quantita, operatore,
                luogo_da, luogo_a, stato, n_riaffilature, id_spedizione,
                costo_unitario, snapshot_da, snapshot_a, created_at
            ) VALUES (
                p_id_operazione, v_pos.id_utensile, 'rientro_riaffilatura', v_buoni_qty, v_nome_operatore,
                'fornitore', v_dest_luogo, 'riaffilato', v_pos_new.n_riaffilature, p_id_spedizione,
                v_costo_riaffilatura, v_snapshot_da, v_snapshot_a, now()
            );
        ELSE
            DELETE FROM public.posizioni_utensile WHERE id = v_pos.id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'ok', true,
        'id_operazione', p_id_operazione,
        'gia_eseguita', false,
        'buoni', v_buoni,
        'scartati', v_scartati
    );
END;
$$;


-- >>> FASE 4: REALTIME, DASHBOARD E LEGACY <<<
-- Fase 4: Dashboard, Realtime, Legacy Compatibility

-- §6. Configurazione Realtime
DO $$
DECLARE
    t_name text;
    schema_name text;
    table_n text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    FOR t_name IN SELECT unnest(ARRAY['posizioni_utensile', 'spedizioni_riaffilatura', 'macchine_cnc']) LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t_name);
        END IF;
    END LOOP;
END $$;

-- §3.5 get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_da timestamptz,
    p_a timestamptz,
    p_id_operatore uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_permission boolean;
    v_risparmio_euro numeric := 0;
    v_risparmio_pezzi int := 0;
    v_spesa_euro numeric := 0;
    v_spesa_nuovi_euro numeric := 0;
    v_spesa_riaffilature_euro numeric := 0;
    v_scarti_pezzi int := 0;
    v_scarti_reparto int := 0;
    v_scarti_fornitore int := 0;
    v_scarti_evitabili_pezzi int := 0;
    v_scarti_evitabili_euro numeric := 0;
    v_scarti_evitabili_percentuale numeric := 0;
    v_utensili_senza_prezzo int := 0;
    
    v_per_macchina json;
    v_per_causale json;
    v_per_commessa json;
BEGIN
    -- Check permissions
    SELECT can_view_dashboard INTO v_has_permission
    FROM public.utenti
    WHERE id = p_id_operatore;

    IF NOT COALESCE(v_has_permission, false) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PERMESSO_NEGATO', DETAIL = '{"permesso":"can_view_dashboard"}';
    END IF;

    -- risparmio: Σ pezzi rientrati sani × (prezzo_acquisto − costo_riaffilatura), solo dove entrambi noti.
    SELECT 
        COALESCE(SUM(mh.quantita * (u.prezzo_acquisto - mh.costo_unitario)), 0),
        COALESCE(SUM(mh.quantita), 0)
    INTO v_risparmio_euro, v_risparmio_pezzi
    FROM public.movements_history mh
    JOIN public."Utensili_B1" u ON mh.tool_id = u.id
    WHERE mh.tipo_operazione = 'rientro_riaffilatura'
      AND mh.created_at >= p_da AND mh.created_at <= p_a
      AND u.prezzo_acquisto IS NOT NULL
      AND mh.costo_unitario IS NOT NULL; 

    -- spesa = Σ prelievi di pezzi nuovo verso macchina × costo_unitario + Σ rientri × costo_riaffilatura
    SELECT 
        COALESCE(SUM(mh.quantita * mh.costo_unitario), 0)
    INTO v_spesa_nuovi_euro
    FROM public.movements_history mh
    WHERE mh.tipo_operazione = 'prelievo'
      AND mh.stato = 'nuovo'
      AND mh.luogo_a = 'macchina'
      AND mh.created_at >= p_da AND mh.created_at <= p_a;

    SELECT 
        COALESCE(SUM(mh.quantita * mh.costo_unitario), 0)
    INTO v_spesa_riaffilature_euro
    FROM public.movements_history mh
    WHERE mh.tipo_operazione = 'rientro_riaffilatura'
      AND mh.created_at >= p_da AND mh.created_at <= p_a;

    v_spesa_euro := v_spesa_nuovi_euro + v_spesa_riaffilature_euro;

    -- scarti
    SELECT 
        COALESCE(SUM(quantita), 0),
        COALESCE(SUM(CASE WHEN causale_scarto = 'scarto_fornitore' THEN quantita ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN causale_scarto != 'scarto_fornitore' THEN quantita ELSE 0 END), 0)
    INTO v_scarti_pezzi, v_scarti_fornitore, v_scarti_reparto
    FROM public.movements_history
    WHERE tipo_operazione IN ('smontaggio_scarto','scarto_fornitore') 
      AND created_at >= p_da AND created_at <= p_a;

    SELECT 
        COALESCE(SUM(quantita), 0),
        COALESCE(SUM(quantita * costo_unitario), 0)
    INTO v_scarti_evitabili_pezzi, v_scarti_evitabili_euro
    FROM public.movements_history
    WHERE tipo_operazione IN ('smontaggio_scarto','scarto_fornitore')
      AND causale_scarto IN ('collisione', 'parametri_programma')
      AND created_at >= p_da AND created_at <= p_a;

    IF v_scarti_pezzi > 0 THEN
        v_scarti_evitabili_percentuale := ROUND((v_scarti_evitabili_pezzi::numeric / v_scarti_pezzi::numeric) * 100, 1);
    ELSE
        v_scarti_evitabili_percentuale := 0;
    END IF;

    -- per_macchina
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_per_macchina
    FROM (
        SELECT mh.id_macchina, m.nome, COALESCE(SUM(mh.quantita * mh.costo_unitario), 0) as euro
        FROM public.movements_history mh
        JOIN public.macchine_cnc m ON mh.id_macchina = m.id
        WHERE mh.tipo_operazione = 'prelievo'
          AND mh.stato = 'nuovo'
          AND mh.luogo_a = 'macchina'
          AND mh.created_at >= p_da AND mh.created_at <= p_a
        GROUP BY mh.id_macchina, m.nome
        ORDER BY euro DESC
    ) t;

    -- per_commessa
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_per_commessa
    FROM (
        SELECT 
            mh.commessa_id as id_commessa, 
            c.codice, 
            COALESCE(c.descrizione, 'Generico macchina') as descrizione,
            COALESCE(SUM(mh.quantita * mh.costo_unitario), 0) as euro
        FROM public.movements_history mh
        LEFT JOIN public.commesse c ON mh.commessa_id = c.id
        WHERE mh.tipo_operazione = 'prelievo'
          AND mh.stato = 'nuovo'
          AND mh.luogo_a = 'macchina'
          AND mh.created_at >= p_da AND mh.created_at <= p_a
        GROUP BY mh.commessa_id, c.codice, c.descrizione
        ORDER BY euro DESC
    ) t;

    -- per_causale
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_per_causale
    FROM (
        SELECT 
            c as causale,
            c IN ('collisione', 'parametri_programma') as evitabile,
            COALESCE(SUM(mh.quantita), 0) as pezzi,
            COALESCE(SUM(mh.quantita * mh.costo_unitario), 0) as euro
        FROM unnest(ARRAY['usura', 'collisione', 'rottura_lavorazione', 'parametri_programma', 'altro', 'usura_limite_riaffilature', 'scarto_fornitore']::text[]) as c
        LEFT JOIN public.movements_history mh 
          ON mh.causale_scarto = c 
         AND mh.tipo_operazione IN ('smontaggio_scarto','scarto_fornitore') 
         AND mh.created_at >= p_da 
         AND mh.created_at <= p_a
        GROUP BY c
        ORDER BY pezzi DESC
    ) t;

    SELECT COUNT(*) INTO v_utensili_senza_prezzo
    FROM public."Utensili_B1"
    WHERE prezzo_acquisto IS NULL;

    RETURN json_build_object(
        'risparmio_riaffilature', json_build_object('euro', v_risparmio_euro, 'pezzi', v_risparmio_pezzi),
        'spesa', json_build_object('euro', v_spesa_euro, 'nuovi_euro', v_spesa_nuovi_euro, 'riaffilature_euro', v_spesa_riaffilature_euro),
        'scarti', json_build_object('pezzi', v_scarti_pezzi, 'reparto', v_scarti_reparto, 'fornitore', v_scarti_fornitore),
        'scarti_evitabili', json_build_object('percentuale', v_scarti_evitabili_percentuale, 'euro', v_scarti_evitabili_euro),
        'per_macchina', v_per_macchina,
        'per_causale', v_per_causale,
        'per_commessa', v_per_commessa,
        'utensili_senza_prezzo', v_utensili_senza_prezzo
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(timestamptz, timestamptz, uuid) TO anon, authenticated;

-- §7.2 Compatibilità funzioni legacy
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
SET search_path = public, pg_temp
AS $$
DECLARE
    t_id UUID;
    v_items JSONB;
BEGIN
    IF p_tool_ids IS NULL OR array_length(p_tool_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Nessun utensile specificato';
    END IF;

    -- Build JSON array and call handle_multi_movement
    SELECT jsonb_agg(
        jsonb_build_object(
            'tool_id', tool_id,
            'quantity', p_change,
            'op_type', p_op_type
        )
    )
    INTO v_items
    FROM unnest(p_tool_ids) AS tool_id;

    PERFORM public.handle_multi_movement(v_items, p_operator, p_commessa_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.handle_bulk_movement(UUID[], TEXT, INTEGER, TEXT, UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_multi_movement(
    p_items JSONB,
    p_operator TEXT,
    p_commessa_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    t_id UUID;
    v_qty INTEGER;
    v_op_type TEXT;
    v_comm_id UUID;
    v_pos_id UUID;
    v_rimanenti INTEGER;
    v_stato TEXT;
    v_luogo TEXT;
    v_n_riaf INTEGER;
    pos_rec RECORD;
    v_id_operatore UUID; -- We don't have id_operatore for legacy, we pass a generated one or null
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Nessun articolo specificato';
    END IF;

    -- Prevenzione Deadlock (§lock-deadlock-prevention): acquisizione lock deterministica su Utensili_B1
    PERFORM 1 FROM public."Utensili_B1" u
    WHERE u.id IN (
        SELECT (x->>'tool_id')::UUID 
        FROM jsonb_array_elements(p_items) x
    )
    ORDER BY u.id FOR UPDATE;

    -- Try to find an operator UUID from the name, or just let it be NULL
    SELECT id INTO v_id_operatore FROM public.utenti WHERE nome || ' ' || cognome = p_operator LIMIT 1;
    IF v_id_operatore IS NULL THEN
        SELECT id INTO v_id_operatore FROM public.utenti WHERE nome = p_operator LIMIT 1;
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

        IF v_op_type = 'carico' THEN
            -- come deposita in magazzino (o cassetto se commessa_id), stato nuovo.
            -- Actually contract says: carico ⇒ come deposita in magazzino, stato nuovo. 
            -- But if it has commessa_id, it says: "deposita(..., p_id_commessa null => magazzino, valorizzato => cassetto)". Legacy might pass commessa_id for carico? Usually not. Let's respect p_id_commessa for luogo.
            v_luogo := CASE WHEN v_comm_id IS NOT NULL THEN 'cassetto' ELSE 'magazzino' END;
            
            INSERT INTO public.posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
            VALUES (gen_random_uuid(), t_id, v_luogo, 'nuovo', 0, v_comm_id, v_qty)
            ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
            DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita, aggiornato_il = now();

            INSERT INTO public.movements_history (tool_id, tipo_operazione, quantita, operatore, commessa_id, luogo_a, stato, created_at)
            VALUES (t_id, 'carico', v_qty, p_operator, v_comm_id, v_luogo, 'nuovo', now());

        ELSIF v_op_type = 'scarico' THEN
            v_rimanenti := v_qty;
            -- priorità usato -> riaffilato -> nuovo. 
            -- se p_commessa_id è valorizzato, prima dal cassetto di quella commessa, poi dal magazzino
            FOR pos_rec IN 
                SELECT * FROM public.posizioni_utensile 
                WHERE id_utensile = t_id 
                  AND (
                      (v_comm_id IS NOT NULL AND luogo = 'cassetto' AND id_commessa = v_comm_id)
                      OR (luogo = 'magazzino' AND id_commessa IS NULL)
                  )
                ORDER BY 
                  (luogo = 'cassetto') DESC, -- first cassetto if requested
                  CASE stato WHEN 'usato' THEN 1 WHEN 'riaffilato' THEN 2 WHEN 'nuovo' THEN 3 ELSE 4 END ASC,
                  n_riaffilature ASC
                FOR UPDATE
            LOOP
                IF v_rimanenti = 0 THEN EXIT; END IF;

                DECLARE
                    v_da_togliere INTEGER := LEAST(v_rimanenti, pos_rec.quantita);
                BEGIN
                    IF pos_rec.quantita = v_da_togliere THEN
                        DELETE FROM public.posizioni_utensile WHERE id = pos_rec.id;
                    ELSE
                        UPDATE public.posizioni_utensile SET quantita = quantita - v_da_togliere, aggiornato_il = now() WHERE id = pos_rec.id;
                    END IF;

                    INSERT INTO public.movements_history (tool_id, tipo_operazione, quantita, operatore, commessa_id, luogo_da, stato, n_riaffilature, created_at)
                    VALUES (t_id, 'scarico', v_da_togliere, p_operator, pos_rec.id_commessa, pos_rec.luogo, pos_rec.stato, pos_rec.n_riaffilature, now());

                    v_rimanenti := v_rimanenti - v_da_togliere;
                END;
            END LOOP;

            IF v_rimanenti > 0 THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GIACENZA_INSUFFICIENTE', DETAIL = format('{"disponibili":%s,"richiesti":%s}', v_qty - v_rimanenti, v_qty)::json;
            END IF;

        ELSIF v_op_type = 'spostamento' THEN
            -- spostamento ⇒ da magazzino a cassetto della commessa
            IF v_comm_id IS NULL THEN
                RAISE EXCEPTION 'Spostamento richiede commessa_id';
            END IF;

            v_rimanenti := v_qty;
            FOR pos_rec IN 
                SELECT * FROM public.posizioni_utensile 
                WHERE id_utensile = t_id 
                  AND luogo = 'magazzino' 
                  AND id_commessa IS NULL
                ORDER BY 
                  CASE stato WHEN 'usato' THEN 1 WHEN 'riaffilato' THEN 2 WHEN 'nuovo' THEN 3 ELSE 4 END ASC,
                  n_riaffilature ASC
                FOR UPDATE
            LOOP
                IF v_rimanenti = 0 THEN EXIT; END IF;

                DECLARE
                    v_da_togliere INTEGER := LEAST(v_rimanenti, pos_rec.quantita);
                BEGIN
                    IF pos_rec.quantita = v_da_togliere THEN
                        DELETE FROM public.posizioni_utensile WHERE id = pos_rec.id;
                    ELSE
                        UPDATE public.posizioni_utensile SET quantita = quantita - v_da_togliere, aggiornato_il = now() WHERE id = pos_rec.id;
                    END IF;

                    INSERT INTO public.posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
                    VALUES (gen_random_uuid(), t_id, 'cassetto', pos_rec.stato, pos_rec.n_riaffilature, v_comm_id, v_da_togliere)
                    ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)
                    DO UPDATE SET quantita = posizioni_utensile.quantita + EXCLUDED.quantita, aggiornato_il = now();

                    INSERT INTO public.movements_history (tool_id, tipo_operazione, quantita, operatore, commessa_id, luogo_da, luogo_a, stato, n_riaffilature, created_at)
                    VALUES (t_id, 'spostamento', v_da_togliere, p_operator, v_comm_id, 'magazzino', 'cassetto', pos_rec.stato, pos_rec.n_riaffilature, now());

                    v_rimanenti := v_rimanenti - v_da_togliere;
                END;
            END LOOP;

            IF v_rimanenti > 0 THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GIACENZA_INSUFFICIENTE', DETAIL = format('{"disponibili":%s,"richiesti":%s}', v_qty - v_rimanenti, v_qty)::json;
            END IF;

        END IF;

    END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.handle_multi_movement(JSONB, TEXT, UUID) TO anon, authenticated;

