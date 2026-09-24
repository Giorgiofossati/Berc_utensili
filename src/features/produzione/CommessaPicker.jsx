import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/choice-chip';
import { listCommesseAttive } from '@/lib/lifecycleApi';
import { cn } from '@/lib/utils';

// Chip delle commesse proposte + un'opzione "nessuna commessa" + ricerca su tutte le commesse attive.
// value: id commessa, oppure noneOption.id, oppure undefined (non ancora scelta).
// onChange(id, commessa) riceve anche l'oggetto commessa (null per noneOption).
export function CommessaPicker({ label, items = [], value, onChange, noneOption, nonePosition = 'end', className }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [all, setAll] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [extra, setExtra] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!searchOpen || all) return;
    let alive = true;
    listCommesseAttive()
      .then(list => { if (alive) setAll(list); })
      .catch(err => { if (alive) setLoadError(err.message); });
    return () => { alive = false; };
  }, [searchOpen, all]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const risultati = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all
      .filter(c => !items.some(i => i.id === c.id))
      .filter(c => !q || c.codice.toLowerCase().includes(q) || (c.descrizione || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [all, query, items]);

  // Una commessa trovata con la ricerca resta visibile come chip accanto alle proposte.
  const visibili = extra && !items.some(i => i.id === extra.id) ? [...items, extra] : items;

  const pickFromSearch = (c) => {
    setExtra({ id: c.id, codice: c.codice, descrizione: c.descrizione });
    onChange(c.id, c);
    setSearchOpen(false);
    setQuery('');
  };

  const noneChip = noneOption && (
    <ChoiceChip selected={value === noneOption.id} onClick={() => onChange(noneOption.id, null)}>
      {noneOption.label}
    </ChoiceChip>
  );

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <ChoiceChipGroup label={label}>
        {noneOption && nonePosition === 'start' && noneChip}
        {visibili.map(c => (
          <ChoiceChip key={c.id} selected={value === c.id} onClick={() => onChange(c.id, c)}>
            <span className="font-mono font-semibold">{c.codice}</span>
            {c.descrizione && <span className="font-medium text-muted-foreground">{c.descrizione}</span>}
            {c.meta && <span className={cn('text-xs font-semibold', c.metaTone === 'fresh' ? 'text-accent-emerald' : 'text-muted-foreground')}>{c.meta}</span>}
          </ChoiceChip>
        ))}
        {noneOption && nonePosition === 'end' && noneChip}
        {!searchOpen && (
          <ChoiceChip variant="action" onClick={() => setSearchOpen(true)}>
            <Search size={16} />
            Cerca…
          </ChoiceChip>
        )}
      </ChoiceChipGroup>

      {searchOpen && (
        <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-card,16px)] border border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.stopPropagation(); setSearchOpen(false); }
                if (e.key === 'Enter' && risultati[0]) { e.preventDefault(); pickFromSearch(risultati[0]); }
              }}
              placeholder="Codice o descrizione, es. 24-118"
              aria-label="Cerca commessa"
              className="flex-1 min-w-0 h-11 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setQuery(''); }}
              aria-label="Chiudi ricerca"
              className="w-11 h-11 rounded-[var(--radius-control,12px)] flex items-center justify-center text-muted-foreground hover:bg-accent-blue/[0.06] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          {loadError && <p className="app-body text-accent-rose">{loadError}</p>}
          {!all && !loadError && <p className="app-body text-muted-foreground">Carico le commesse…</p>}
          {all && risultati.length === 0 && (
            <p className="app-body text-muted-foreground">
              {query ? `Nessuna commessa attiva per «${query}».` : 'Nessun’altra commessa attiva.'}
            </p>
          )}
          {risultati.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {risultati.map(c => (
                <ChoiceChip key={c.id} onClick={() => pickFromSearch(c)}>
                  <span className="font-mono font-semibold">{c.codice}</span>
                  {c.descrizione && <span className="font-medium text-muted-foreground">{c.descrizione}</span>}
                </ChoiceChip>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
