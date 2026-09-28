BEGIN;

DO $$
DECLARE
    u_id uuid;
    t_id uuid;
    c_id uuid;
    m_id uuid;
    start_qty int;
BEGIN
    -- Reset
    DELETE FROM public.posizioni_utensile;
    DELETE FROM public.movements_history WHERE tipo_operazione IN ('carico', 'scarico', 'spostamento', 'prelievo', 'deposito');
    
    -- Setup
    SELECT id INTO u_id FROM public.utenti WHERE can_view_dashboard = true LIMIT 1;
    IF u_id IS NULL THEN
        RAISE EXCEPTION 'No user';
    END IF;

    SELECT id, "Quantità" INTO t_id, start_qty FROM public."Utensili_B1" LIMIT 1;
    SELECT id INTO c_id FROM public.commesse LIMIT 1;
    
    -- Deposita in magazzino 10
    PERFORM public.deposita(gen_random_uuid(), u_id, t_id, 10);
    
    -- handle_bulk_movement scarico 3
    PERFORM public.handle_bulk_movement(ARRAY[t_id], 'scarico', 3, 'Test User', NULL);
    
    -- Verify quantities
    DECLARE
        curr_qty int;
        pos_qty int;
    BEGIN
        SELECT "Quantità" INTO curr_qty FROM public."Utensili_B1" WHERE id = t_id;
        SELECT SUM(quantita) INTO pos_qty FROM public.posizioni_utensile WHERE id_utensile = t_id AND luogo = 'magazzino';
        
        IF curr_qty != start_qty + 10 - 3 THEN
            RAISE EXCEPTION 'Quantità wrong. Expected % got %', start_qty + 10 - 3, curr_qty;
        END IF;
        
        IF pos_qty != 7 THEN
            RAISE EXCEPTION 'Posizioni wrong. Expected 7 got %', pos_qty;
        END IF;
    END;

    RAISE NOTICE 'Test passed!';
END $$;
ROLLBACK;
