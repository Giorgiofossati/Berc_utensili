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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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

