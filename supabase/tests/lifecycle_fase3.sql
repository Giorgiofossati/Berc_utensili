-- Test Scenarios per Fase 3

DO $$
DECLARE
    v_admin_id UUID;
    v_user_id UUID;
    v_utensile_id UUID;
    v_id_operazione UUID;
    v_id_spedizione UUID;
    v_id_posizione UUID;
    v_res JSONB;
BEGIN
    -- Setup
    SELECT id INTO v_admin_id FROM public.utenti WHERE nome = 'Admin' LIMIT 1;
    SELECT id INTO v_user_id FROM public.utenti WHERE nome != 'Admin' AND can_manage_riaffilature = false LIMIT 1;
    
    -- Inserisci un utensile per test
    INSERT INTO public."Utensili_B1" (id, "Codice", "Descrizione Originale", max_riaffilature, "Quantità") 
    VALUES (gen_random_uuid(), 'TEST-RIAF-01', 'Test Riaffilatura', 3, 0)
    RETURNING id INTO v_utensile_id;
    
    -- Inseriamo delle posizioni in cestello
    INSERT INTO public.posizioni_utensile (id_utensile, luogo, stato, quantita, n_riaffilature)
    VALUES 
    (v_utensile_id, 'cestello', 'usato', 4, 0),
    (v_utensile_id, 'cestello', 'usato', 2, 1);
    
    -- Test 11: Utente senza can_manage_riaffilature che spedisce => PERMESSO_NEGATO
    v_id_operazione := gen_random_uuid();
    BEGIN
        PERFORM public.spedisci_cestello(v_id_operazione, v_user_id);
        RAISE EXCEPTION 'Test 11 fallito: doveva lanciare PERMESSO_NEGATO';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM != 'PERMESSO_NEGATO' THEN
            RAISE EXCEPTION 'Test 11 fallito con errore diverso: %', SQLERRM;
        END IF;
    END;
    RAISE NOTICE 'Test 11: Passato (PERMESSO_NEGATO corretto)';

    -- Test 7: Spedisci cestello
    v_res := public.spedisci_cestello(v_id_operazione, v_admin_id);
    IF NOT (v_res->>'ok')::boolean OR (v_res->>'pezzi')::int != 6 THEN
        RAISE EXCEPTION 'Test 7 fallito: risposta spedisci_cestello inattesa %', v_res;
    END IF;
    
    v_id_spedizione := (v_res->>'id_spedizione')::uuid;
    
    IF EXISTS (SELECT 1 FROM public.posizioni_utensile WHERE luogo = 'cestello') THEN
        RAISE EXCEPTION 'Test 7 fallito: cestello non vuoto';
    END IF;
    
    IF (SELECT COUNT(*) FROM public.posizioni_utensile WHERE id_spedizione = v_id_spedizione AND luogo = 'fornitore') != 2 THEN
         RAISE EXCEPTION 'Test 7 fallito: posizioni non in fornitore';
    END IF;
    RAISE NOTICE 'Test 7: Passato (Spedito cestello)';

    -- Test 8: Rientro con 1 scartato su 4
    -- Prendiamo l'id_posizione di quello con quantita = 4
    SELECT id INTO v_id_posizione FROM public.posizioni_utensile WHERE id_spedizione = v_id_spedizione AND quantita = 4;
    
    v_id_operazione := gen_random_uuid();
    -- Simuliamo il rientro solo per i pezzi di quella spedizione. Ah, aspetta. rientra_spedizione richiede UNA RIGA PER OGNI POSIZIONE DELLA SPEDIZIONE.
    -- Abbiamo 2 posizioni. Creiamo le 2 righe.
    v_res := public.rientra_spedizione(
        v_id_operazione, 
        v_admin_id, 
        v_id_spedizione, 
        jsonb_build_array(
            jsonb_build_object(
                'id_posizione', v_id_posizione, 
                'scartati', 1, 
                'destinazione', jsonb_build_object('luogo', 'magazzino', 'id_commessa', null)
            ),
            jsonb_build_object(
                'id_posizione', (SELECT id FROM public.posizioni_utensile WHERE id_spedizione = v_id_spedizione AND id != v_id_posizione), 
                'scartati', 0, 
                'destinazione', jsonb_build_object('luogo', 'magazzino', 'id_commessa', null)
            )
        )
    );
    
    IF NOT (v_res->>'ok')::boolean OR (v_res->>'buoni')::int != 5 OR (v_res->>'scartati')::int != 1 THEN
        RAISE EXCEPTION 'Test 8 fallito: risposta inattesa %', v_res;
    END IF;
    
    -- Verifica: 3 riaffilati n+1
    IF NOT EXISTS (SELECT 1 FROM public.posizioni_utensile WHERE id = v_id_posizione AND luogo = 'magazzino' AND stato = 'riaffilato' AND n_riaffilature = 1 AND quantita = 3) THEN
        RAISE EXCEPTION 'Test 8 fallito: posizione rientrata non corretta';
    END IF;
    
    -- Verifica: scarto fornitore
    IF NOT EXISTS (SELECT 1 FROM public.movements_history WHERE id_operazione = v_id_operazione AND causale_scarto = 'scarto_fornitore' AND quantita = 1) THEN
        RAISE EXCEPTION 'Test 8 fallito: scarto non registrato nello storico';
    END IF;
    RAISE NOTICE 'Test 8: Passato (Rientro corretto)';

    -- Test 9: Annulla operazione sul rientro
    v_res := public.annulla_operazione(v_id_operazione, v_admin_id);
    IF NOT (v_res->>'ok')::boolean THEN
        RAISE EXCEPTION 'Test 9 fallito: annulla_operazione ha restituito %', v_res;
    END IF;
    
    IF (SELECT stato FROM public.spedizioni_riaffilatura WHERE id = v_id_spedizione) != 'in_viaggio' THEN
        RAISE EXCEPTION 'Test 9 fallito: spedizione non tornata in_viaggio';
    END IF;
    
    IF (SELECT quantita FROM public.posizioni_utensile WHERE id = v_id_posizione) != 4 OR (SELECT luogo FROM public.posizioni_utensile WHERE id = v_id_posizione) != 'fornitore' THEN
        RAISE EXCEPTION 'Test 9 fallito: posizioni non ripristinate correttamente';
    END IF;
    
    RAISE NOTICE 'Test 9: Passato (Annullamento rientro corretto)';
    
    -- Cleanup (opzionale, dato che in un test vero i dati verrebbero rollbacckati, ma usiamo DO quindi andrà a buon fine)
    DELETE FROM public."Utensili_B1" WHERE id = v_utensile_id;
    DELETE FROM public.spedizioni_riaffilatura WHERE id = v_id_spedizione;
    
    RAISE NOTICE 'Tutti i test Fase 3 sono passati.';
END $$;
