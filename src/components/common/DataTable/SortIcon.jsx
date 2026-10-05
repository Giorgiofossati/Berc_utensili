import React, { memo } from 'react';

// Doppia punta stile Excel: a riposo entrambe tenui, la direzione attiva
// si accende in blu e scivola verso l'esterno, l'altra si spegne.
export const SortIcon = memo(({ column, size = 12, className = "" }) => {
  if (!column || !column.getCanSort()) return null;
  const sort = column.getIsSorted();

  const upClass = sort === 'asc'
    ? 'text-accent-blue opacity-100 -translate-y-px'
    : sort === 'desc'
    ? 'opacity-15 translate-y-px'
    : 'opacity-35 group-hover:opacity-80';
  const downClass = sort === 'desc'
    ? 'text-accent-blue opacity-100 translate-y-px'
    : sort === 'asc'
    ? 'opacity-15 -translate-y-px'
    : 'opacity-35 group-hover:opacity-80';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <path d="M8 2.5 12 7H4z" className={`transition-all duration-200 ease-out ${upClass}`} />
      <path d="M8 13.5 4 9h8z" className={`transition-all duration-200 ease-out ${downClass}`} />
    </svg>
  );
});

export default SortIcon;
