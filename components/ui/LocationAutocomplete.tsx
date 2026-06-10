'use client';

import * as React from 'react';
import { MapPin, Loader2, Check } from 'lucide-react';

interface Suggestion {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    state?: string;
    country?: string;
    county?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Build a short, friendly location label from Nominatim address parts
function buildLabel(s: Suggestion): string {
  const a = s.address;
  const parts: string[] = [];
  const area = a.neighbourhood || a.suburb || a.village || a.town || a.city;
  if (area) parts.push(area);
  const region = a.county || a.state;
  if (region) parts.push(region);
  if (a.country) parts.push(a.country);
  return parts.length > 0 ? parts.join(', ') : s.display_name.split(',').slice(0, 3).join(',');
}

export function LocationAutocomplete({
  value,
  onChange,
  disabled,
  placeholder = 'e.g. Koramangala, Bengaluru',
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(!!value);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = React.useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=city,town,village,suburb,neighbourhood`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsSelected(false);
    onChange(''); // clear until a real location is chosen

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (s: Suggestion) => {
    const label = buildLabel(s);
    setQuery(label);
    onChange(label);
    setIsSelected(true);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`flex h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-9 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-800 ${className ?? ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : isSelected ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden text-sm">
          {suggestions.map((s) => {
            const label = buildLabel(s);
            return (
              <li
                key={s.place_id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  handleSelect(s);
                }}
                className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <MapPin className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 leading-tight">{label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Helper text */}
      {!isSelected && query.trim().length > 0 && !isLoading && (
        <p className="text-[11px] text-amber-600 mt-1">
          ⚠ Please select a real location from the suggestions.
        </p>
      )}
      {isSelected && (
        <p className="text-[11px] text-emerald-600 mt-1">✓ Real location verified</p>
      )}
    </div>
  );
}
