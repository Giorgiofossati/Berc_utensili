-- Script SQL per la creazione della tabella 'ordini' in Supabase
-- Esegui questo script nel SQL Editor del tuo progetto Supabase

CREATE TABLE IF NOT EXISTS public.ordini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES public."Utensili_B1"(id) ON DELETE CASCADE,
    quantita_richiesta INTEGER NOT NULL CHECK (quantita_richiesta > 0),
    note TEXT,
    stato TEXT DEFAULT 'In Attesa' CHECK (stato IN ('In Attesa', 'Completato', 'Annullato')),
    utente test,
    data_ordine TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita RLS (Row Level Security) per la tabella
ALTER TABLE public.ordini ENABLE ROW LEVEL SECURITY;

-- Crea una policy per permettere a tutti di leggere e inserire (se non usi Auth per ora, altrimenti restringila)
CREATE POLICY "Permetti a tutti di leggere gli ordini" 
ON public.ordini FOR SELECT 
USING (true);

CREATE POLICY "Permetti a tutti di inserire ordini" 
ON public.ordini FOR INSERT 
WITH CHECK (true);

-- (Opzionale) Policy per update se serve
CREATE POLICY "Permetti a tutti di aggiornare ordini" 
ON public.ordini FOR UPDATE 
USING (true);
