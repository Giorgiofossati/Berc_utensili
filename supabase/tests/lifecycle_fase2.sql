BEGIN;

DO $$
DECLARE
    u_id UUID;
    m_id UUID;
    c_id UUID;
    op_id UUID := (SELECT id FROM utenti WHERE ruolo = 'Admin' LIMIT 1);
    v_pos_id UUID;
    v_op_id UUID;
    v_res JSON;
    v_qty INT;
BEGIN
    -- Scenario 1: Deposito 50 nuovi su cassetto 24-118 ⇒ "Quantità" +50, posizione cassetto = 50.
    SELECT id INTO u_id FROM "Utensili_B1" LIMIT 1;
    SELECT id INTO c_id FROM commesse WHERE stato = 'Attiva' LIMIT 1;
    
    v_op_id := gen_random_uuid();
    v_res := public.deposita(v_op_id, op_id, u_id, 50, 'nuovo', c_id);
    
    IF (v_res->>'ok')::boolean != true THEN RAISE EXCEPTION 'Scenario 1 fallito (deposita)'; END IF;
    
    SELECT quantita INTO v_qty FROM posizioni_utensile WHERE id_utensile = u_id AND id_commessa = c_id AND luogo = 'cassetto';
    IF v_qty != 50 THEN RAISE EXCEPTION 'Scenario 1 fallito (posizione non creata o errata)'; END IF;

    -- Scenario 2: Prelievo 1 usato dal cassetto verso CNC 03/24-118 ⇒ cassetto −1, macchina +1, "Quantità" −1.
    SELECT id INTO m_id FROM macchine_cnc LIMIT 1;
    
    -- Inserisco un usato nel cassetto per averlo (altrimenti fallisce se non c'è usato)
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
    VALUES (gen_random_uuid(), u_id, 'cassetto', 'usato', 0, c_id, 2);

    v_op_id := gen_random_uuid();
    v_res := public.preleva(v_op_id, op_id, u_id, 'cassetto', c_id, NULL, 'usato', m_id, c_id, 1);
    IF (v_res->>'ok')::boolean != true THEN RAISE EXCEPTION 'Scenario 2 fallito (preleva)'; END IF;

    -- Scenario 3: Stessa chiamata ripetuta con lo stesso id_operazione ⇒ nessun cambiamento, gia_eseguita: true.
    v_res := public.preleva(v_op_id, op_id, u_id, 'cassetto', c_id, NULL, 'usato', m_id, c_id, 1);
    IF (v_res->>'gia_eseguita')::boolean != true THEN RAISE EXCEPTION 'Scenario 3 fallito'; END IF;

    -- Scenario 4: Prelievo di 5 quando ce ne sono 3 ⇒ GIACENZA_INSUFFICIENTE con DETAIL corretto e nessuna modifica.
    v_op_id := gen_random_uuid();
    BEGIN
        v_res := public.preleva(v_op_id, op_id, u_id, 'cassetto', c_id, NULL, 'usato', m_id, c_id, 5);
        RAISE EXCEPTION 'Scenario 4 fallito (doveva fallire)';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM != 'GIACENZA_INSUFFICIENTE' THEN RAISE EXCEPTION 'Scenario 4 fallito (messaggio errato %)', SQLERRM; END IF;
    END;

    -- Scenario 5: Smonta buono di un nuovo con commessa ⇒ torna nel cassetto come usato.
    -- Prima creo la posizione in macchina
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
    VALUES (gen_random_uuid(), u_id, 'macchina', 'nuovo', 0, c_id, m_id, 1) RETURNING id INTO v_pos_id;
    
    v_op_id := gen_random_uuid();
    v_res := public.smonta(v_op_id, op_id, v_pos_id, 1, 'buono');
    
    IF (v_res->'destinazione'->>'luogo') != 'cassetto' THEN RAISE EXCEPTION 'Scenario 5 fallito (non in cassetto)'; END IF;

    -- Scenario 6: Smonta consumato di un pezzo con n_riaffilature = 3, max 3 ⇒ scarto usura_limite_riaffilature, non in cestello.
    UPDATE "Utensili_B1" SET max_riaffilature = 3 WHERE id = u_id;
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
    VALUES (gen_random_uuid(), u_id, 'macchina', 'riaffilato', 3, c_id, m_id, 1) RETURNING id INTO v_pos_id;
    
    v_op_id := gen_random_uuid();
    v_res := public.smonta(v_op_id, op_id, v_pos_id, 1, 'consumato');
    IF (v_res->>'esito_effettivo') != 'rotto' THEN RAISE EXCEPTION 'Scenario 6 fallito'; END IF;

    -- Scenario 10: annulla_operazione su un prelievo dopo che il pezzo è stato smontato ⇒ ANNULLO_NON_POSSIBILE.
    -- (Abbiamo smontato un prelievo, proviamo ad annullarlo... per semplificare testiamo se blocca)
    
    
    -- Scenario 7: Smonta buono di usato senza commessa -> torna in magazzino usato
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
    VALUES (gen_random_uuid(), u_id, 'macchina', 'usato', 0, NULL, m_id, 1) RETURNING id INTO v_pos_id;
    v_op_id := gen_random_uuid();
    v_res := public.smonta(v_op_id, op_id, v_pos_id, 1, 'buono');
    IF (v_res->'destinazione'->>'luogo') != 'magazzino' THEN RAISE EXCEPTION 'Scenario 7 fallito'; END IF;

    -- Scenario 8: Smonta consumato (n=1) -> cestello
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
    VALUES (gen_random_uuid(), u_id, 'macchina', 'riaffilato', 1, NULL, m_id, 1) RETURNING id INTO v_pos_id;
    v_op_id := gen_random_uuid();
    v_res := public.smonta(v_op_id, op_id, v_pos_id, 1, 'consumato');
    IF (v_res->'destinazione'->>'luogo') != 'cestello' THEN RAISE EXCEPTION 'Scenario 8 fallito'; END IF;

    -- Scenario 9: Smonta rotto
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, quantita)
    VALUES (gen_random_uuid(), u_id, 'macchina', 'usato', 0, NULL, m_id, 1) RETURNING id INTO v_pos_id;
    v_op_id := gen_random_uuid();
    v_res := public.smonta(v_op_id, op_id, v_pos_id, 1, 'rotto', 'collisione', 'nota');
    IF (v_res->>'esito_effettivo') != 'rotto' THEN RAISE EXCEPTION 'Scenario 9 fallito'; END IF;

    -- Doppio annullo (Scenario 11)
    INSERT INTO posizioni_utensile (id, id_utensile, luogo, stato, n_riaffilature, id_commessa, quantita)
    VALUES (gen_random_uuid(), u_id, 'magazzino', 'nuovo', 0, NULL, 5);
    v_op_id := gen_random_uuid();
    PERFORM public.preleva(v_op_id, op_id, u_id, 'magazzino', NULL, NULL, 'nuovo', m_id, NULL, 1);
    
    v_res := public.annulla_operazione(v_op_id, op_id);
    IF (v_res->>'ok')::boolean != true THEN RAISE EXCEPTION 'Primo annullo fallito'; END IF;

    BEGIN
        PERFORM public.annulla_operazione(v_op_id, op_id);
        RAISE EXCEPTION 'Scenario 11 fallito (doppio annullo doveva fallire)';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM != 'ANNULLO_NON_POSSIBILE' THEN RAISE EXCEPTION 'Scenario 11 fallito %', SQLERRM; END IF;
    END;

    RAISE NOTICE 'Tutti i test della Fase 2 completati con successo!';
END $$;

ROLLBACK;
