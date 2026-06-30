import React, { useEffect, useMemo, useState } from "react";
import { useCountry } from "../contexts/CountryContext";
import {
  COUNTRY_PROFILES,
  composeStoredPhone,
  formatLocalDisplay,
  isValidLocalPhone,
  onlyDigits,
  toNationalDigits,
  type CountryProfile,
} from "../utils/country";

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
const FOCUS = "#33A6CD";
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
  const [selectedCountry, setSelectedCountry] = useState(profileOverride?.name || profile.name);

  useEffect(() => {
    setSelectedCountry(profileOverride?.name || profile.name);
  }, [profileOverride?.name, profile.name]);

  const effectiveProfile = useMemo(() => {
    return COUNTRY_PROFILES.find(c => c.name === selectedCountry) || profile;
  }, [profile, selectedCountry]);

  // Extract the local NSN from whatever the caller is currently storing.
  const nsn = useMemo(() => toNationalDigits(value, effectiveProfile), [value, effectiveProfile]);
  const displayValue = useMemo(() => formatLocalDisplay(nsn, effectiveProfile), [nsn, effectiveProfile]);
  const invalid = showValidationHint && value.trim().length > 0 && !isValidLocalPhone(value, effectiveProfile);

  const isSm = size === "sm";
  const height = isSm ? 32 : 38;
  const fontSize = isSm ? 12.5 : 13.5;
  const padX = isSm ? 10 : 12;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = composeStoredPhone(e.target.value, effectiveProfile);
    onChange(next);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = e.target.value;
    setSelectedCountry(nextCountry);
    const nextProfile = COUNTRY_PROFILES.find(c => c.name === nextCountry) || effectiveProfile;
    onChange(value ? composeStoredPhone(onlyDigits(value), nextProfile) : "");
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
        <select
          aria-label="Country code"
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={disabled || readOnly}
          style={{
            minWidth: 170, padding: `0 ${padX}px`, border: "none",
            borderRight: `1px solid ${BORDER}`, background: BG_DIAL,
            fontSize, color: TEXT, outline: "none", cursor: "pointer",
          }}
        >
          {COUNTRY_PROFILES.map(country => (
            <option key={country.name} value={country.name}>
              {country.flag} {country.name} (+{country.dialCode})
            </option>
          ))}
        </select>
        <div style={{ flex: 1, minWidth: 0 }}>
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
            placeholder={effectiveProfile.placeholderLocal}
            aria-label={`Phone number (${effectiveProfile.name})`}
            aria-invalid={invalid || undefined}
            style={{
              width: "100%", minWidth: 0,
              padding: `0 ${padX}px`,
              border: "none", outline: "none",
              fontSize, color: TEXT, background: "transparent",
              height,
            }}
            onFocus={e => {
              const wrap = e.currentTarget.parentElement?.parentElement;
              if (wrap && !invalid) {
                wrap.style.borderColor = FOCUS;
                wrap.style.boxShadow = `0 0 0 4px ${FOCUS}1f`;
              }
            }}
            onBlur={e => {
              const wrap = e.currentTarget.parentElement?.parentElement;
              if (wrap) {
                wrap.style.borderColor = invalid ? DANGER : BORDER;
                wrap.style.boxShadow = invalid ? `0 0 0 3px ${DANGER}1a` : "";
              }
            }}
          />
        </div>
      </div>
      {invalid && (
        <div style={{
          marginTop: 6, padding: "4px 8px", borderRadius: 6,
          background: DANGER_BG, color: DANGER, fontSize: 11.5, fontWeight: 600,
        }}>
          Enter a valid {effectiveProfile.name} number (
          {effectiveProfile.nsnLengths.join("/")} digits after +{effectiveProfile.dialCode}
          {effectiveProfile.trunkPrefix ? ` or starting with ${effectiveProfile.trunkPrefix}` : ""})
        </div>
      )}
      {!invalid && !displayValue && (
        <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>
          {effectiveProfile.name} numbers only · e.g. {effectiveProfile.placeholder}
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
