"use client";

import React, { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_COLOR, BRAND_RING, BRAND_SHADOW, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

/** Shared Tailwind tokens for text-field chrome (aligned with admin tables/search). */
export const COMMON_GENERIC_INPUT_CLASS = cn(
  "w-full bg-white border border-slate-200 rounded-md text-[12px] text-slate-900 placeholder:text-slate-400",
  "outline-none focus:outline-none focus:ring-1 focus:border-amber-500 transition-all shadow-sm hover:border-slate-300",
  BRAND_RING,
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200",
);

export type CommonFieldProps = {
  label?: React.ReactNode;
  id?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

export function CommonField({ label, id, hint, error, className, children }: CommonFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label != null ? (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

type IconWrapProps = {
  children: React.ReactNode;
  side: "left" | "right";
};

function InputIconWrap({ children, side }: IconWrapProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 text-slate-400",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      {children}
    </span>
  );
}

export type CommonGenericInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
  inputClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

/** Text-like inputs: text, email, password, tel, url, search, etc. */
export const CommonGenericInput = forwardRef<HTMLInputElement, CommonGenericInputProps>(function CommonGenericInput(
  { className, inputClassName, leftIcon, rightIcon, disabled, ...rest },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      {leftIcon ? <InputIconWrap side="left">{leftIcon}</InputIconWrap> : null}
      {rightIcon ? <InputIconWrap side="right">{rightIcon}</InputIconWrap> : null}
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          COMMON_GENERIC_INPUT_CLASS,
          "py-1.5",
          leftIcon ? "pl-9" : "pl-3",
          rightIcon ? "pr-9" : "pr-3",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
});

export type CommonGenericTextProps = Omit<CommonGenericInputProps, "type">;

/** Convenience wrapper — same as `CommonGenericInput` with `type="text"` (default). */
export const CommonGenericText = forwardRef<HTMLInputElement, CommonGenericTextProps>(function CommonGenericText(
  props,
  ref,
) {
  return <CommonGenericInput ref={ref} type="text" {...props} />;
});

export type CommonNumberInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  className?: string;
  inputClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const CommonNumberInput = forwardRef<HTMLInputElement, CommonNumberInputProps>(function CommonNumberInput(
  { className, inputClassName, leftIcon, rightIcon, disabled, ...rest },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      {leftIcon ? <InputIconWrap side="left">{leftIcon}</InputIconWrap> : null}
      {rightIcon ? <InputIconWrap side="right">{rightIcon}</InputIconWrap> : null}
      <input
        ref={ref}
        type="number"
        disabled={disabled}
        className={cn(
          COMMON_GENERIC_INPUT_CLASS,
          "py-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          leftIcon ? "pl-9" : "pl-3",
          rightIcon ? "pr-9" : "pr-3",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
});

export type CommonTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  inputClassName?: string;
};

export const CommonTextarea = forwardRef<HTMLTextAreaElement, CommonTextareaProps>(function CommonTextarea(
  { className, inputClassName, disabled, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      rows={rows}
      className={cn(
        COMMON_GENERIC_INPUT_CLASS,
        "min-h-[4.5rem] resize-y px-3 py-2",
        inputClassName,
        className,
      )}
      {...rest}
    />
  );
});

export type CommonFileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  className?: string;
  /** Shown on the button surface when no file chosen (native filename still appears where supported). */
  browseLabel?: string;
};

export const CommonFileInput = forwardRef<HTMLInputElement, CommonFileInputProps>(function CommonFileInput(
  { className, browseLabel = "Choose file", disabled, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <input ref={ref} id={fid} type="file" className="sr-only" disabled={disabled} {...rest} />
      <label
        htmlFor={fid}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold shadow-sm transition-all hover:border-amber-300 hover:shadow-amber-100",
          BRAND_TEXT,
          "focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-md", BRAND_COLOR)} aria-hidden />
        {browseLabel}
      </label>
    </div>
  );
});

export type AutocompleteOption = { value: string; label?: string };

export type CommonAutocompleteProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "className"
> & {
  className?: string;
  inputClassName?: string;
  options: AutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  onOptionSelect?: (option: AutocompleteOption) => void;
  leftIcon?: React.ReactNode;
  /** Case-insensitive substring match on label/value when true (default). */
  filterOptions?: boolean | ((query: string, option: AutocompleteOption) => boolean);
  emptyMessage?: string;
  maxSuggestions?: number;
};

export function CommonAutocomplete({
  className,
  inputClassName,
  options,
  value,
  onValueChange,
  onOptionSelect,
  leftIcon,
  disabled,
  filterOptions = true,
  emptyMessage = "No matches",
  maxSuggestions = 12,
  onBlur,
  onFocus,
  onKeyDown,
  ...rest
}: CommonAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    let list = options;
    if (filterOptions === true && q) {
      list = options.filter((o) => {
        const lab = (o.label ?? o.value).toLowerCase();
        const val = o.value.toLowerCase();
        return lab.includes(q) || val.includes(q);
      });
    } else if (typeof filterOptions === "function") {
      list = options.filter((o) => filterOptions(value, o));
    }
    return list.slice(0, maxSuggestions);
  }, [options, value, filterOptions, maxSuggestions]);

  useEffect(() => {
    setHighlight(0);
  }, [value, filtered.length]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const selectOption = useCallback(
    (opt: AutocompleteOption) => {
      onValueChange(opt.value);
      onOptionSelect?.(opt);
      setOpen(false);
    },
    [onValueChange, onOptionSelect],
  );

  const showList = open && !disabled && filtered.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {leftIcon ? <InputIconWrap side="left">{leftIcon}</InputIconWrap> : null}
      <InputIconWrap side="right">
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-50", open && "rotate-180")} strokeWidth={2.5} />
      </InputIconWrap>
      <input
        {...rest}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && filtered[highlight]) {
            e.preventDefault();
            selectOption(filtered[highlight]);
          }
          onKeyDown?.(e);
        }}
        className={cn(
          COMMON_GENERIC_INPUT_CLASS,
          "py-1.5 pr-9",
          leftIcon ? "pl-9" : "pl-3",
          inputClassName,
        )}
      />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            BRAND_SHADOW,
          )}
        >
          {filtered.map((opt, idx) => (
            <li key={`${opt.value}-${idx}`} role="option" aria-selected={idx === highlight}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-[12px] text-slate-800 transition-colors",
                  idx === highlight ? "bg-amber-50 text-amber-900" : "hover:bg-slate-50",
                )}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => selectOption(opt)}
              >
                {opt.label ?? opt.value}
              </button>
            </li>
          ))}
        </ul>
      ) : open && !disabled && filtered.length === 0 && value.trim() !== "" ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-500 shadow-lg",
            BRAND_SHADOW,
          )}
        >
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}

export type SearchableSelectOption = { value: string; label: string };

/** Allows API/JSON payloads where `label` or `value` may be null before normalization. */
export type SearchableSelectOptionInput = {
  value?: string | null;
  label?: string | null;
};

function normalizeSearchableOptions(raw: SearchableSelectOptionInput[]): SearchableSelectOption[] {
  return raw.map((o) => {
    const value = o?.value == null ? "" : String(o.value);
    const rawLabel = o?.label;
    const label =
      rawLabel != null && String(rawLabel).trim() !== ""
        ? String(rawLabel)
        : value || "\u2014";
    return { value, label };
  });
}

/** Visible field stays blank when nothing chosen (`value === ""`); no “All …” text until user picks it. */
function queryLabelForSelected(selectedValue: string, opts: SearchableSelectOption[]): string {
  if (!selectedValue) return "";
  return opts.find((o) => o.value === selectedValue)?.label ?? "";
}

export type CommonSearchableSelectProps = {
  /** Form field name — submitted value is the selected option `value`. */
  name: string;
  options: SearchableSelectOptionInput[];
  /** Selected option value (e.g. vendor id or enum string). Use "" for “All”. */
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  emptyMessage?: string;
  /** Cap list length when query is empty or filtering (default 80). */
  maxSuggestions?: number;
};

/**
 * Searchable dropdown like a select: click/focus opens the full list (typing narrows).
 * No default label shown for empty value — field stays blank until the user chooses an option.
 * Hidden input still submits `""` when nothing is selected (e.g. “all” filters).
 */
export function CommonSearchableSelect({
  name,
  options,
  defaultValue = "",
  disabled,
  placeholder = "Choose…",
  className,
  inputClassName,
  emptyMessage = "No matches",
  maxSuggestions = 80,
}: CommonSearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stableOptionsKey = JSON.stringify(
    options.map((o) => ({ v: o?.value ?? null, l: o?.label ?? null })),
  );

  const normalizedOptions = useMemo(
    () => normalizeSearchableOptions(optionsRef.current),
    [stableOptionsKey],
  );

  const selectedRef = useRef(defaultValue);
  const [selected, setSelected] = useState(defaultValue);
  const [query, setQuery] = useState(() =>
    queryLabelForSelected(defaultValue ?? "", normalizeSearchableOptions(options)),
  );
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  selectedRef.current = selected;

  useEffect(() => {
    const next = defaultValue ?? "";
    setSelected(next);
    setQuery(queryLabelForSelected(next, normalizedOptions));
  }, [defaultValue, normalizedOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? normalizedOptions.filter((o) => {
          const lab = (o.label ?? "").toLowerCase();
          const val = (o.value ?? "").toLowerCase();
          return lab.includes(q) || val.includes(q);
        })
      : normalizedOptions;
    return base.slice(0, maxSuggestions);
  }, [normalizedOptions, query, maxSuggestions]);

  useEffect(() => {
    setHighlight(0);
  }, [query, filtered.length]);

  const closeAndRevertDisplay = useCallback(() => {
    setOpen(false);
    setQuery(queryLabelForSelected(selectedRef.current, normalizedOptions));
  }, [normalizedOptions]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) closeAndRevertDisplay();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [closeAndRevertDisplay]);

  const commit = useCallback((opt: SearchableSelectOption) => {
    setSelected(opt.value);
    selectedRef.current = opt.value;
    setQuery(opt.value === "" ? "" : opt.label);
    setOpen(false);
  }, []);

  const showList = open && !disabled && filtered.length > 0;
  const showEmpty = open && !disabled && filtered.length === 0 && query.trim() !== "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={selected} readOnly aria-hidden />
      <InputIconWrap side="right">
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-50", open && "rotate-180")} strokeWidth={2.5} />
      </InputIconWrap>
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onMouseDown={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            closeAndRevertDisplay();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && filtered[highlight]) {
            e.preventDefault();
            commit(filtered[highlight]);
          }
        }}
        className={cn(
          COMMON_GENERIC_INPUT_CLASS,
          "py-1.5 pl-3 pr-9",
          inputClassName,
        )}
      />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            BRAND_SHADOW,
          )}
        >
          {filtered.map((opt, idx) => (
            <li key={`${name}-${opt.value}-${idx}`} role="option" aria-selected={idx === highlight}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-[12px] text-slate-800 transition-colors",
                  idx === highlight ? "bg-amber-50 text-amber-900" : "hover:bg-slate-50",
                )}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => commit(opt)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : showEmpty ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-500 shadow-lg",
            BRAND_SHADOW,
          )}
        >
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}
