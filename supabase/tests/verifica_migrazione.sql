DO $$
DECLARE
    err_count INT;
BEGIN
    SELECT COUNT(*) INTO err_count
    FROM public."Utensili_B1" u
    LEFT JOIN (
        SELECT id_utensile, SUM(quantita) as somma_posizioni
        FROM public.posizioni_utensile
        WHERE luogo IN ('magazzino', 'cassetto')
        GROUP BY id_utensile
    ) p ON p.id_utensile = u.id
    WHERE COALESCE(u."Quantità", 0) != COALESCE(p.somma_posizioni, 0);

    IF err_count > 0 THEN
        RAISE EXCEPTION 'Verifica fallita: % utensili hanno quantita sfasate!', err_count;
    END IF;
END $$;
