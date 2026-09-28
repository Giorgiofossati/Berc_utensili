import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flexRender } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import SortIcon from './SortIcon';

export const VirtualizedTable = memo(({
  table,
  density = 'comfortable',
  selectionMode = 'none',
  estimateRowSize,
  overscan = 6,
  onRowClick,
  getRowClassName,
  renderRowTrailing,
  headerTrailing,
  emptyIcon,
  emptyTitle = "Nessun dato trovato",
  emptyDescription,
  emptyAction,
  className = "",
  bottomSpacerClassName = "h-20 md:h-10",
  parentRef: externalParentRef,
}) => {
  const EmptyIcon = emptyIcon || AlertTriangle;
  const defaultParentRef = useRef(null);
  const parentRef = externalParentRef || defaultParentRef;

  const { rows } = table.getRowModel();
  const calculatedRowSize = estimateRowSize || (density === 'compact' ? 44 : 56);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => calculatedRowSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      data-density={density}
      data-selection-mode={selectionMode}
      className={`overflow-y-auto custom-scrollbar overflow-x-hidden flex-1 min-h-0 relative w-full flex flex-col ${className}`}
    >
      {/* Sticky Header */}
      {rows.length > 0 && (
        <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs flex w-full shrink-0 shadow-xs">
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              className="flex flex-1 w-full text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] select-none"
            >
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const isFlex =
                  meta?.isFlex ??
                  header.column.columnDef.size === 0;
                const colSize = header.getSize();
                const canSort = header.column.getCanSort();
                const customSortIcon = meta?.customSortIcon;
                const minWidth = meta?.minWidth 
                  ? `${meta.minWidth}px` 
                  : (isFlex ? '120px' : `${colSize}px`);
                const flexStyle = meta?.flex || (isFlex ? '1 1 0%' : undefined);
                const maxWidth = meta?.maxWidth 
                  ? `${meta.maxWidth}px` 
                  : (isFlex ? undefined : `${colSize}px`);
                const width = isFlex ? undefined : `${colSize}px`;

                return (
                  <div
                    key={header.id}
                    className={`flex items-center gap-1.5 ${density === 'compact' ? 'py-2.5 px-3' : 'py-3.5 px-4'} transition-colors group relative overflow-hidden ${
                      canSort ? 'cursor-pointer hover:text-slate-950 dark:hover:text-white' : ''
                    } ${meta?.className || ''} ${
                      isFlex ? 'min-w-0' : 'flex-shrink-0 justify-center'
                    }`}
                    style={{
                      flex: flexStyle,
                      width: width,
                      maxWidth: maxWidth,
                      minWidth: minWidth,
                    }}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && !customSortIcon && (
                      <div className={`flex items-center shrink-0 ${isFlex ? 'ml-1.5' : 'absolute right-1 sm:right-2'}`}>
                        <SortIcon column={header.column} />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Spacer per allineare l'header con l'icona/elemento trailing delle righe */}
              {renderRowTrailing ? (
                <div className="w-6 flex-shrink-0 mx-3 sm:mx-4 md:mx-6" />
              ) : headerTrailing ? (
                headerTrailing
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Virtualized Body */}
      <div
        className="w-full shrink-0"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center dark:text-slate-400 text-slate-600 absolute w-full top-0 left-0">
            <EmptyIcon size={36} className="mb-3 text-slate-500 opacity-60" />
            <p className="app-overline mb-1">{emptyTitle}</p>
            {emptyDescription && (
              <p className="app-body text-slate-500 dark:text-slate-400 max-w-sm mb-4">{emptyDescription}</p>
            )}
            {emptyAction && <div className="mt-2">{emptyAction}</div>}
          </div>
        ) : (
          rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isSelected = row.getIsSelected ? row.getIsSelected() : false;
            const customClassName = getRowClassName ? getRowClassName(row.original, row) : '';

            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="w-full relative hover:z-20"
              >
                <div
                  onClick={() => onRowClick && onRowClick(row.original, row)}
                  // Riga aperta col mouse: il focus che le resta (o che il drawer le
                  // restituisce) alla chiusura con Esc non deve mostrare l'anello.
                  onPointerDown={(e) => { e.currentTarget.dataset.pointerFocus = 'true'; }}
                  onBlur={(e) => {
                    if (e.relatedTarget && !e.relatedTarget.closest('[role="dialog"]')) {
                      delete e.currentTarget.dataset.pointerFocus;
                    }
                  }}
                  onKeyDown={(e) => {
                    // Esc chiude il drawer rimasto aperto su questa riga: non è navigazione
                    if (e.key !== 'Escape') delete e.currentTarget.dataset.pointerFocus;
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row.original, row);
                    }
                  }}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={selectionMode !== 'none' ? Boolean(isSelected) : undefined}
                  className={`flex items-center w-full border-b border-slate-100 dark:border-slate-800/60 group select-none text-xs text-slate-700 dark:text-slate-300 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } data-[pointer-focus=true]:outline-none transform-gpu transition-all duration-150 ease-out origin-center hover:scale-[1.008] md:hover:scale-[1.01] hover:bg-sky-50/80 dark:hover:bg-sky-900/35 hover:border-transparent ${
                    isSelected ? 'bg-sky-50 dark:bg-sky-950/40 shadow-[inset_3px_0_0_#0284c7]' : ''
                  } ${customClassName}`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const isFlex =
                      meta?.isFlex ??
                      cell.column.columnDef.size === 0;
                    const colSize = cell.column.getSize();
                    const minWidth = meta?.minWidth 
                      ? `${meta.minWidth}px` 
                      : (isFlex ? '120px' : `${colSize}px`);
                    const flexStyle = meta?.flex || (isFlex ? '1 1 0%' : undefined);
                    const maxWidth = meta?.maxWidth 
                      ? `${meta.maxWidth}px` 
                      : (isFlex ? undefined : `${colSize}px`);
                    const width = isFlex ? undefined : `${colSize}px`;

                    return (
                      <div
                        key={cell.id}
                        className={`flex items-center ${density === 'compact' ? 'py-2' : 'py-3.5'} overflow-hidden ${
                          meta?.className || ''
                        } ${isFlex ? 'min-w-0' : 'flex-shrink-0 justify-center'}`}
                        style={{
                          flex: flexStyle,
                          width: width,
                          maxWidth: maxWidth,
                          minWidth: minWidth,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                  {renderRowTrailing && (
                    <div className="w-6 flex-shrink-0 flex items-center justify-center mx-3 sm:mx-4 md:mx-6">
                      {renderRowTrailing(row.original, row)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {bottomSpacerClassName && (
        <div className={`${bottomSpacerClassName} shrink-0 w-full pointer-events-none`} />
      )}
    </div>
  );
});

export default VirtualizedTable;
