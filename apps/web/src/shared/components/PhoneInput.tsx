import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCountry } from "../contexts/CountryContext";
import {
  COUNTRY_PROFILES,
  composeStoredPhone,
  detectCountryFromValue,
  formatLocalDisplay,
  isValidLocalPhone,
  toNationalDigits,
  type CountryProfile,
} from "../utils/country";

export interface PhoneInputProps {
  /** Current stored value (may already include "+27 …" or just digits — both work). */
  value: string;

  onChange: (next: string) => void;
  /**
   * Optional starting country override. When provided, this is used as the
   * initial country if the current value has no detectable dial-code prefix.
   * The user can still change countries via the picker.
   */
  profileOverride?: CountryProfile;
  /** Disable / read-only flag forwarded to the input (also disables the picker). */
  disabled?: boolean;
  readOnly?: boolean;
  /** Visual width; defaults to "100%". */
  width?: number | string;
  /** Visual size variant. */
  size?: "sm" | "md";
  /** Optional id / name for form integration. */
  id?: string;
  name?: string;
  /** Show a validation hint underneath when input is non-empty and not a valid local number. */
  showValidationHint?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────
 * Tokens (kept in the Kago Owner palette used by the rest of the form)
 * ────────────────────────────────────────────────────────────────── */
const BORDER = "#d0d5dd";
const BG_DIAL = "#f9fafb";
const TEXT = "#344054";
const INK = "#101828";
const MUTED = "#98a2b3";
const DANGER = "#b42318";
const DANGER_BG = "#fef3f2";
const FOCUS = "#33A6CD";
const FOCUS_DK = "#0369A1";

/* ─────────────────────────────────────────────────────────────────────
 * PhoneInput
 * ────────────────────────────────────────────────────────────────── */
const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  profileOverride,
  disabled,
  readOnly,
  width = "100%",
  size = "md",
  id,
  name,
  showValidationHint = false,
}) => {
  const { profile: activeProfile } = useCountry();

  // Country selection priority:
  //   1) whatever dial code is embedded in the current stored value
  //   2) explicit `profileOverride` prop
  //   3) the active app-wide profile from CountryContext
  const initialProfile = useMemo<CountryProfile>(
    () => detectCountryFromValue(value) || profileOverride || activeProfile,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [profile, setProfile] = useState<CountryProfile>(initialProfile);

  // Keep the picker in sync when the stored value changes externally
  // (e.g. server load, form reset).
  useEffect(() => {
    const detected = detectCountryFromValue(value);
    if (detected && detected.iso2 !== profile.iso2) {
      setProfile(detected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const nsn = useMemo(() => toNationalDigits(value, profile), [value, profile]);
  const displayValue = useMemo(() => formatLocalDisplay(nsn, profile), [nsn, profile]);
  const invalid = showValidationHint && value.trim().length > 0 && !isValidLocalPhone(value, profile);

  const isSm = size === "sm";
  const height = isSm ? 32 : 38;
  const fontSize = isSm ? 12.5 : 13.5;
  const padX = isSm ? 10 : 12;

  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(composeStoredPhone(e.target.value, profile));
  };

  const handleCountrySelect = (next: CountryProfile) => {
    setProfile(next);
    setPickerOpen(false);
    // Re-emit the value with the new dial code but preserve the typed NSN.
    if (nsn) onChange(`+${next.dialCode} ${formatLocalDisplay(nsn, next)}`);
    else onChange("");
  };

  const pickerLocked = !!(disabled || readOnly);

  return (
    <div style={{ width, position: "relative" }} ref={wrapRef}>
      <div style={{
        display: "flex", alignItems: "stretch",
        border: `1px solid ${invalid ? DANGER : (pickerOpen ? FOCUS : BORDER)}`,
        borderRadius: 10, background: "#fff", overflow: "visible",
        boxShadow: invalid
          ? `0 0 0 3px ${DANGER}1a`
          : pickerOpen ? `0 0 0 4px ${FOCUS}1f` : undefined,
        transition: "border-color .15s ease, box-shadow .15s ease",
      }}>
        {/* Country picker trigger */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          aria-label={`Country: ${profile.name} (+${profile.dialCode}). Click to change.`}
          title={pickerLocked ? profile.name : `${profile.name} · Click to change`}
          disabled={pickerLocked}
          onClick={() => !pickerLocked && setPickerOpen(o => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: `0 ${padX}px`,
            background: BG_DIAL,
            borderRight: `1px solid ${BORDER}`,
            border: "none", borderRadius: 0,
            fontSize, fontWeight: 700, color: TEXT,
            whiteSpace: "nowrap", flexShrink: 0,
            cursor: pickerLocked ? "default" : "pointer",
            userSelect: "none", outline: "none",
            transition: "background .15s ease",
          }}
          onMouseEnter={e => { if (!pickerLocked) e.currentTarget.style.background = "#f2f4f7"; }}
          onMouseLeave={e => { e.currentTarget.style.background = BG_DIAL; }}
        >
          <span style={{ fontSize: fontSize + 3, lineHeight: 1 }}>{profile.flag}</span>
          <span style={{ letterSpacing: 0.2 }}>+{profile.dialCode}</span>
          {!pickerLocked && (
            <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden style={{
              marginLeft: 2, color: MUTED,
              transition: "transform .15s ease",
              transform: pickerOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* National number input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={profile.placeholderLocal}
          aria-label={`Phone number (${profile.name})`}
          aria-invalid={invalid || undefined}
          style={{
            flex: 1, minWidth: 0,
            padding: `0 ${padX}px`,
            border: "none", outline: "none",
            fontSize, color: TEXT, background: "transparent",
            height,
          }}
          onFocus={e => {
            const wrap = e.currentTarget.parentElement;
            if (wrap && !invalid && !pickerOpen) {
              wrap.style.borderColor = FOCUS;
              wrap.style.boxShadow = `0 0 0 4px ${FOCUS}1f`;
            }
          }}
          onBlur={e => {
            const wrap = e.currentTarget.parentElement;
            if (wrap && !pickerOpen) {
              wrap.style.borderColor = invalid ? DANGER : BORDER;
              wrap.style.boxShadow = invalid ? `0 0 0 3px ${DANGER}1a` : "";
            }
          }}
        />

        {pickerOpen && (
          <CountryPicker
            active={profile}
            width={Math.max(280, typeof width === "number" ? width : 320)}
            onClose={() => setPickerOpen(false)}
            onSelect={handleCountrySelect}
            anchorRef={wrapRef}
          />
        )}
      </div>

      {invalid && (
        <div style={{
          marginTop: 6, padding: "4px 8px", borderRadius: 6,
          background: DANGER_BG, color: DANGER, fontSize: 11.5, fontWeight: 600,
        }}>
          Enter a valid {profile.name} number (
          {profile.nsnLengths.join("/")} digits after +{profile.dialCode}
          {profile.trunkPrefix ? ` or starting with ${profile.trunkPrefix}` : ""})
        </div>
      )}
      {!invalid && !displayValue && (
        <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>
          {profile.name} · e.g. {profile.placeholder}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────
 * CountryPicker — searchable dropdown, keyboard accessible
 * ────────────────────────────────────────────────────────────────── */

interface CountryPickerProps {
  active: CountryProfile;
  onSelect: (p: CountryProfile) => void;
  onClose: () => void;
  width: number;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

const CountryPicker: React.FC<CountryPickerProps> = ({
  active, onSelect, onClose, width, anchorRef,
}) => {
  const [query, setQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_PROFILES;
    return COUNTRY_PROFILES.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.iso2.toLowerCase().includes(q) ||
      p.dialCode.includes(q.replace(/^\+/, "")),
    );
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const idx = results.findIndex(p => p.iso2 === active.iso2);
    setFocusIdx(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusIdx >= results.length) setFocusIdx(Math.max(0, results.length - 1));
  }, [results, focusIdx]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${focusIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIdx]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(i => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[focusIdx];
      if (pick) onSelect(pick);
    } else if (e.key === "Home") {
      setFocusIdx(0);
    } else if (e.key === "End") {
      setFocusIdx(results.length - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Select country"
      style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 3000,
        width, background: "#fff",
        border: `1px solid ${BORDER}`, borderRadius: 12,
        boxShadow: "0 20px 40px rgba(16,24,40,0.12), 0 4px 10px rgba(16,24,40,0.06)",
        overflow: "hidden",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Search */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: BG_DIAL, border: `1px solid ${BORDER}`,
          borderRadius: 8, padding: "6px 10px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ color: MUTED, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search country or dial code…"
            aria-label="Search country"
            style={{
              flex: 1, minWidth: 0, border: "none", outline: "none",
              background: "transparent", fontSize: 13, color: INK,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="Clear search"
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                color: MUTED, fontSize: 14, lineHeight: 1, padding: 2,
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        role="listbox"
        aria-activedescendant={`country-opt-${focusIdx}`}
        ref={listRef}
        style={{ maxHeight: 300, overflowY: "auto", padding: 4 }}
      >
        {results.length === 0 ? (
          <div style={{
            padding: "20px 12px", textAlign: "center",
            fontSize: 12.5, color: MUTED,
          }}>
            No matches for “{query}”
          </div>
        ) : results.map((p, i) => {
          const selected = p.iso2 === active.iso2;
          const focused = i === focusIdx;
          return (
            <button
              key={p.iso2}
              id={`country-opt-${i}`}
              role="option"
              aria-selected={selected}
              data-idx={i}
              type="button"
              onMouseEnter={() => setFocusIdx(i)}
              onClick={() => onSelect(p)}
              style={{
                width: "100%", border: "none",
                background: focused ? "#f2f4f7" : "transparent",
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                textAlign: "left", transition: "background .1s ease",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{p.flag}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: selected ? 700 : 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: selected ? FOCUS_DK : MUTED,
                background: selected ? `${FOCUS}1a` : "transparent",
                borderRadius: 6, padding: "2px 8px", flexShrink: 0,
              }}>
                +{p.dialCode}
              </span>
              {selected && (
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ color: FOCUS_DK, flexShrink: 0 }}>
                  <path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px", borderTop: `1px solid ${BORDER}`,
        fontSize: 10.5, fontWeight: 600, color: MUTED,
        background: BG_DIAL, letterSpacing: 0.3, textTransform: "uppercase",
      }}>
        {results.length} countr{results.length === 1 ? "y" : "ies"} · ↑↓ to navigate · Enter to select
      </div>
    </div>
  );
};

export default PhoneInput;
