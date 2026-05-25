import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTools() {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('Utensili_B1').select('*').order('Tipologia', { ascending: true });
    if (!error) setTools(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return { tools, setTools, isLoading, fetchTools };
}
