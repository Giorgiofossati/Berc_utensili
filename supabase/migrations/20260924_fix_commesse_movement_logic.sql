-- ==========================================================
-- FIX LOGICA MOVIMENTI SU COMMESSA (handle_bulk_movement & handle_multi_movement)
-- Risolve errore di scrittura quando si effettua uno scarico (prelievo)
-- associato a una commessa di produzione.
-- ==========================================================

-- 1. Aggiornamento funzione handle_bulk_movement
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
                RAISE EXCEPTION 'Giacenza insufficiente per ID % (Disponibili: %, Richiesti: %)', t_id, COALESCE(cur_qty, 0), p_change;
            END IF;
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) - p_change WHERE id = t_id;

        ELSIF p_op_type = 'carico' THEN
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) + p_change WHERE id = t_id;
            
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

-- 2. Aggiornamento funzione handle_multi_movement
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

        IF v_op_type NOT IN ('carico', 'scarico', 'spostamento') THEN
            RAISE EXCEPTION 'Tipo non valido: % (accettati: carico, scarico, spostamento)', v_op_type;
        END IF;

        SELECT "Quantità" INTO cur_qty FROM public."Utensili_B1" WHERE id = t_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Utensile ID % non trovato', t_id;
        END IF;

        IF v_op_type = 'scarico' THEN
            IF COALESCE(cur_qty, 0) < v_qty THEN
                RAISE EXCEPTION 'Giacenza globale insufficiente per ID % (Disponibili: %, Richiesti: %)', t_id, COALESCE(cur_qty, 0), v_qty;
            END IF;
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) - v_qty WHERE id = t_id;

        ELSIF v_op_type = 'carico' THEN
            UPDATE public."Utensili_B1" SET "Quantità" = COALESCE("Quantità", 0) + v_qty WHERE id = t_id;
            
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
