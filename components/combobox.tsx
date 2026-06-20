"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Eingabefeld mit sichtbarer, filterbarer Vorschlagsliste.
 * Man kann einen Vorschlag anklicken ODER einen eigenen Wert eintippen.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  autoFocus,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          autoComplete="off"
          className="!pr-9"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white"
        >
          <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-panel-2 py-1 shadow-xl">
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm hover:bg-white/10",
                  o === value && "text-brand",
                )}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
