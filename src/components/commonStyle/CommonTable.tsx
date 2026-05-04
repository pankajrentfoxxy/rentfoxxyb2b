"use client";

import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterTabChip } from '@/components/commonStyle/FilterTabChip';

export const BRAND_COLOR = "bg-amber-600";
export const BRAND_TEXT = "text-amber-600";
export const BRAND_RING = "focus:ring-amber-500";
export const BRAND_SHADOW = "shadow-amber-100";

export interface Column<T> {
  header: string;
  key: string;
  /** Pixel width (number) or CSS length (e.g. "12rem", "20%"). Applied to header and cells. */
  width?: number | string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (item: T) => React.ReactNode;
}

function columnWidthStyle(width: number | string | undefined): React.CSSProperties | undefined {
  if (width === undefined) return undefined;
  return { width: typeof width === "number" ? `${width}px` : width };
}

export interface TabItem {
  label: string;
  active: boolean;
  onClick?: () => void;
  href?: string;
}

export interface CommonTableProps<T> {
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  
  tabs?: TabItem[];
  
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;

  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  
  totalItems?: number;
}

export function CommonTable<T>({
  title,
  subtitle,
  actionButton,
  tabs,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  columns,
  data,
  keyExtractor,
  emptyMessage = "No matching items found",
  totalItems,
}: CommonTableProps<T>) {
  return (
    <div className="flex-1 w-full space-y-2">
      {(title || subtitle) ? (
        <div>
          {title ? (
            <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {/* Filters and Search */}
      {(tabs || onSearchChange) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {tabs?.map((tab, idx) => (
              <FilterTabChip
                key={idx}
                active={tab.active}
                href={tab.href}
                onClick={tab.onClick}
              >
                {tab.label}
              </FilterTabChip>
            ))}
          </div>

          {/* Search Bar */}
          {onSearchChange && (
            <div className="flex items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder={searchPlaceholder}
                className={`w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] focus:outline-none focus:ring-1 ${BRAND_RING} transition-all shadow-sm outline-none`}
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            {(actionButton) && (
                <div className="flex items-center justify-end">
                {actionButton}
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className={`${BRAND_COLOR} text-white`}>
                {columns.map((col) => (
                  <th 
                    key={col.key}
                    style={columnWidthStyle(col.width)}
                    className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r border-amber-500/20 last:border-r-0 ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? (
                data.map((item) => (
                  <tr key={keyExtractor(item)} className="hover:bg-amber-50/20 transition-colors group">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={columnWidthStyle(col.width)}
                        className={`px-6 py-4 whitespace-nowrap ${col.cellClassName || ''}`}
                        >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{emptyMessage}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-2 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {data.length} {totalItems !== undefined && `of ${totalItems} `}results
          </div>
          
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-300 hover:text-amber-600 disabled:opacity-30 transition-all" disabled>
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1 px-1">
              <button className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-all ${BRAND_COLOR} text-white`}>
                1
              </button>
            </div>

            <button className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-300 hover:text-amber-600 disabled:opacity-30 transition-all" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
