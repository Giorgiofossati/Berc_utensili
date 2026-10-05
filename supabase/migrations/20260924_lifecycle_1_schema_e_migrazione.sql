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
CREATE POLICY "Permetti lettura macchine" ON public.macchine_cnc FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione macchine" ON public.macchine_cnc;
CREATE POLICY "Permetti gestione macchine" ON public.macchine_cnc FOR ALL USING (true);


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
CREATE POLICY "Permetti lettura spedizioni" ON public.spedizioni_riaffilatura FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione spedizioni" ON public.spedizioni_riaffilatura;
CREATE POLICY "Permetti gestione spedizioni" ON public.spedizioni_riaffilatura FOR ALL USING (true);

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
CREATE POLICY "Permetti lettura posizioni" ON public.posizioni_utensile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permetti gestione posizioni" ON public.posizioni_utensile;
CREATE POLICY "Permetti gestione posizioni" ON public.posizioni_utensile FOR ALL USING (true);

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
