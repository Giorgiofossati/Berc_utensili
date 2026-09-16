import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flexRender } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import SortIcon from './SortIcon';

export const VirtualizedTable = memo(({
  table,
  estimateRowSize = 56,
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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto custom-scrollbar overflow-x-auto flex-1 min-h-0 relative w-full flex flex-col ${className}`}
    >
      {/* Sticky Header */}
      {rows.length > 0 && (
        <div className="sticky top-0 z-[10] border-b dark:border-white/10 border-slate-900/10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur flex min-w-full w-fit md:w-full shrink-0 shadow-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              className="flex flex-1 min-w-full app-overline dark:text-slate-400 text-slate-600 select-none"
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
                  : (isFlex ? '180px' : `${colSize}px`);
                const flexStyle = meta?.flex || (isFlex ? '1 1 0%' : undefined);
                const maxWidth = meta?.maxWidth 
                  ? `${meta.maxWidth}px` 
                  : (isFlex ? undefined : `${colSize}px`);
                const width = isFlex ? undefined : `${colSize}px`;

                return (
                  <div
                    key={header.id}
                    className={`flex items-center gap-2 py-2.5 transition-colors group relative overflow-hidden ${
                      canSort ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-200' : ''
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
        className="w-full min-w-full shrink-0"
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
                  minWidth: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick && onRowClick(row.original, row)}
                className={`flex items-center min-w-full w-fit md:w-full hover:bg-white/[0.06] active:bg-accent-blue/10 ${
                  onRowClick ? 'cursor-pointer' : ''
                } transition-colors border-b dark:border-white/[0.03] border-slate-900/5 group select-none ${
                  isSelected ? 'bg-accent-blue/5' : ''
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
                    : (isFlex ? '180px' : `${colSize}px`);
                  const flexStyle = meta?.flex || (isFlex ? '1 1 0%' : undefined);
                  const maxWidth = meta?.maxWidth 
                    ? `${meta.maxWidth}px` 
                    : (isFlex ? undefined : `${colSize}px`);
                  const width = isFlex ? undefined : `${colSize}px`;

                  return (
                    <div
                      key={cell.id}
                      className={`flex items-center py-2.5 sm:py-2 overflow-hidden ${
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
