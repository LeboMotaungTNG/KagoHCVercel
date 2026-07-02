import React, { useMemo } from "react";
import { useCountry } from "../contexts/CountryContext";
import {
  composeStoredPhone,
  formatLocalDisplay,
  isValidLocalPhone,
  toNationalDigits,
  type CountryProfile,
} from "../utils/country";
import { C } from "../utils/employee";

export interface PhoneInputProps {
  /** Current stored value (may already include "+27 …" or just digits — both work). */
  value: string;
  onChange: (next: string) => void;
  /** Optional override — useful if a row needs a different country than the active one. */
  profileOverride?: CountryProfile;
  /** Disable / read-only flag forwarded to the input. */
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

const BORDER = "#d0d5dd";
const BG_DIAL = "#f9fafb";
const TEXT = "#344054";
const MUTED = "#98a2b3";
const DANGER = "#b42318";
const DANGER_BG = "#fef3f2";
const FOCUS = C.primary;
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
  const profile = profileOverride || activeProfile;

  // Extract the local NSN from whatever the caller is currently storing.
  const nsn = useMemo(() => toNationalDigits(value, profile), [value, profile]);
  const displayValue = useMemo(() => formatLocalDisplay(nsn, profile), [nsn, profile]);
  const invalid = showValidationHint && value.trim().length > 0 && !isValidLocalPhone(value, profile);

  const isSm = size === "sm";
  const height = isSm ? 32 : 38;
  const fontSize = isSm ? 12.5 : 13.5;
  const padX = isSm ? 10 : 12;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = composeStoredPhone(e.target.value, profile);
    onChange(next);
  };

  return (
    <div style={{ width }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        border: `1px solid ${invalid ? DANGER : BORDER}`,
        borderRadius: 10, background: "#fff", overflow: "hidden",
        boxShadow: invalid ? `0 0 0 3px ${DANGER}1a` : undefined,
        transition: "border-color .15s ease, box-shadow .15s ease",
      }}>
        {/* Locked dial-code tile */}
        <span
          aria-hidden
          title={profile.name}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: `0 ${padX}px`,
            background: BG_DIAL,
            borderRight: `1px solid ${BORDER}`,
            fontSize, fontWeight: 700, color: TEXT,
            whiteSpace: "nowrap", flexShrink: 0,
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: fontSize + 2, lineHeight: 1 }}>{profile.flag}</span>
          <span>+{profile.dialCode}</span>
        </span>
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
            if (wrap && !invalid) {
              wrap.style.borderColor = FOCUS;
              wrap.style.boxShadow = `0 0 0 4px ${FOCUS}1f`;
            }
          }}
          onBlur={e => {
            const wrap = e.currentTarget.parentElement;
            if (wrap) {
              wrap.style.borderColor = invalid ? DANGER : BORDER;
              wrap.style.boxShadow = invalid ? `0 0 0 3px ${DANGER}1a` : "";
            }
          }}
        />
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
          {profile.name} numbers only · e.g. {profile.placeholder}
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
