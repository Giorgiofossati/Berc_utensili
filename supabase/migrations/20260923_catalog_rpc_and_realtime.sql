-- Migrazione: Funzione RPC Catalogo ad alte prestazioni e Abilitazione Supabase Realtime
-- Autore: Bercella Utensili Development Team
-- Data: 2026-09-23

BEGIN;

-- 1. Funzione RPC get_tools_catalog() per superare il limite di 1000 righe di PostgREST
-- Restituisce l'intero catalogo utensili ordinato, compresso server-side e proiettato sui soli campi necessari.
CREATE OR REPLACE FUNCTION public.get_tools_catalog()
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT coalesce(json_agg(t), '[]'::json)
  FROM (
    SELECT 
      id,
      "Codice",
      "Descrizione Originale",
      "Tipologia",
      "Forma",
      "Diametro",
      "Diametro Nominale",
      "Raggio",
      "Passo",
      "Tolleranza",
      "Lunghezza",
      "Angolo",
      "Rotazione",
      "Materiale",
      "Rivestimento",
      "Stato",
      "Ubicazione",
      "Serial Number",
      "Fornitore",
      "Quantità",
      "Lavorazione",
      "Sistema di misura",
      "Alias"
    FROM public."Utensili_B1"
    ORDER BY "Tipologia" ASC, "Diametro Nominale" ASC NULLS LAST, "Diametro" ASC NULLS LAST, "Descrizione Originale" ASC
  ) t;
$$;

-- Permessi di esecuzione
GRANT EXECUTE ON FUNCTION public.get_tools_catalog() TO anon, authenticated, service_role;

-- 2. Abilitazione pubblicazione Realtime per propagazione immediata dei microeventi cross-device
-- Consente a tutti i tablet connessi di ricevere aggiornamenti live su giacenze, log movimenti e commesse.
DO $$
BEGIN
  -- Aggiungi Utensili_B1 se non già presente nella publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'Utensili_B1'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Utensili_B1";
  END IF;

  -- Aggiungi movements_history se non già presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'movements_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.movements_history;
  END IF;

  -- Aggiungi commesse se non già presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'commesse'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commesse;
  END IF;
END $$;

COMMIT;
