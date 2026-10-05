
-- Helpers
CREATE OR REPLACE FUNCTION check_permesso(p_id_operatore UUID, p_permesso TEXT)
RETURNS TEXT AS $$
DECLARE
    v_has_permesso BOOLEAN;
    v_nome_operatore TEXT;
BEGIN
    EXECUTE format('SELECT %I, nome || '' '' || cognome FROM utenti WHERE id = $1', p_permesso)
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 3.1 get_opzioni_prelievo
CREATE OR REPLACE FUNCTION public.get_opzioni_prelievo(p_id_utensile UUID, p_id_operatore UUID)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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

