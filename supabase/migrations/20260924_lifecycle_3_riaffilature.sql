-- Fase 3: Riaffilature (cestello, spedizione, rientro guidato)

-- 1. get_riaffilature
CREATE OR REPLACE FUNCTION public.get_riaffilature(p_giorni_storico INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
