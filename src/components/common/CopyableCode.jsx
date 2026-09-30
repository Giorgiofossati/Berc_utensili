import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

const FEEDBACK_MS = 1500;
// Tolleranza al tremolio del mouse durante il click: oltre questa soglia è un movimento vero
const MOVE_THRESHOLD_PX = 4;

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback per contesti non sicuri (app servita via IP in LAN)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

// Pill con codice: click copia negli appunti senza aprire la riga.
// Il fumetto "Copiato" sparisce dopo 1,5s o appena il puntatore si sposta.
export const CopyableCode = memo(({ value, title, className = '' }) => {
  const [feedback, setFeedback] = useState(null); // { x, y } in coordinate viewport
  const btnRef = useRef(null);

  useEffect(() => {
    if (!feedback) return;
    const hide = () => setFeedback(null);
    const onMove = (e) => {
      if (Math.hypot(e.clientX - feedback.px, e.clientY - feedback.py) > MOVE_THRESHOLD_PX) hide();
    };
    const timer = setTimeout(hide, FEEDBACK_MS);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('keydown', hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('keydown', hide);
    };
  }, [feedback]);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const { clientX, clientY } = e;
    if (!(await copyText(value))) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Click da tastiera: clientX/Y valgono 0, uso il centro della pill
    setFeedback({
      x: rect.left + rect.width / 2,
      y: rect.top,
      px: clientX || rect.left + rect.width / 2,
      py: clientY || rect.top + rect.height / 2,
    });
  };

  const copied = Boolean(feedback);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleCopy}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
        title={title ? `${title} — clic per copiare` : 'Clic per copiare'}
        aria-label={`Copia codice ${value}`}
        className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-md border tracking-tight whitespace-nowrap inline-block shadow-2xs max-w-full truncate align-middle cursor-copy transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 ${
          copied
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
            : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:border-sky-700 dark:hover:bg-sky-950/50'
        } ${className}`}
      >
        {value}
      </button>
      {copied && createPortal(
        <div
          role="status"
          className="fixed z-[200] pointer-events-none -translate-x-1/2 -translate-y-full -mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold shadow-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-150"
          style={{ left: feedback.x, top: feedback.y }}
        >
          <Check size={12} strokeWidth={3} className="text-emerald-400 dark:text-emerald-600" />
          Copiato
        </div>,
        document.body
      )}
    </>
  );
});

export default CopyableCode;
