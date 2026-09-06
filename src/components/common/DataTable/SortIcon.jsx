import React, { memo } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

export const SortIcon = memo(({ column, size = 14, className = "" }) => {
  if (!column || !column.getCanSort()) return null;
  const sort = column.getIsSorted();

  if (!sort) {
    return (
      <ChevronsUpDown 
        size={size} 
        className={`opacity-30 group-hover:opacity-75 transition-opacity shrink-0 ${className}`} 
      />
    );
  }

  return sort === 'asc' ? (
    <ArrowUp 
      size={size} 
      className={`text-accent-blue shrink-0 animate-in fade-in zoom-in-75 duration-150 ${className}`} 
    />
  ) : (
    <ArrowDown 
      size={size} 
      className={`text-accent-blue shrink-0 animate-in fade-in zoom-in-75 duration-150 ${className}`} 
    />
  );
});

export default SortIcon;
