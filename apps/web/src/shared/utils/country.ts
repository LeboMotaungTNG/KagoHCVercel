
export interface CountryProfile {
  /** Display name used throughout the app (matches SADC_COUNTRIES). */
  name: string;
  /** ISO 3166-1 alpha-2 code. */
  iso2: string;
  /** Dial code WITHOUT the leading "+". */
  dialCode: string;
  /** National trunk prefix (usually "0", empty if there isn't one). */
  trunkPrefix: string;
  /** Accepted national number lengths (without the trunk prefix). */
  nsnLengths: number[];
  /** Human readable example of a local mobile number (with trunk prefix). */
  placeholder: string;
  /** Local example formatted for display next to the dial code. */
  placeholderLocal: string;
  /** Small flag emoji for visual cue. */
  flag: string;
}

export const COUNTRY_PROFILES: CountryProfile[] = [
  { name: "Angola",                       iso2: "AO", dialCode: "244", trunkPrefix: "",  nsnLengths: [9],     placeholder: "923 123 456",   placeholderLocal: "923 123 456",   flag: "🇦🇴" },
  { name: "Botswana",                     iso2: "BW", dialCode: "267", trunkPrefix: "",  nsnLengths: [8],     placeholder: "71 123 456",    placeholderLocal: "71 123 456",    flag: "🇧🇼" },
  { name: "Comoros",                      iso2: "KM", dialCode: "269", trunkPrefix: "",  nsnLengths: [7],     placeholder: "321 2345",      placeholderLocal: "321 2345",      flag: "🇰🇲" },
  { name: "Democratic Republic of Congo", iso2: "CD", dialCode: "243", trunkPrefix: "0", nsnLengths: [9],     placeholder: "081 234 5678",  placeholderLocal: "81 234 5678",   flag: "🇨🇩" },
  { name: "Eswatini",                     iso2: "SZ", dialCode: "268", trunkPrefix: "",  nsnLengths: [8],     placeholder: "7612 3456",     placeholderLocal: "7612 3456",     flag: "🇸🇿" },
  { name: "Lesotho",                      iso2: "LS", dialCode: "266", trunkPrefix: "",  nsnLengths: [8],     placeholder: "5012 3456",     placeholderLocal: "5012 3456",     flag: "🇱🇸" },
  { name: "Madagascar",                   iso2: "MG", dialCode: "261", trunkPrefix: "0", nsnLengths: [9],     placeholder: "032 12 345 67", placeholderLocal: "32 12 345 67",  flag: "🇲🇬" },
  { name: "Malawi",                       iso2: "MW", dialCode: "265", trunkPrefix: "0", nsnLengths: [9],     placeholder: "099 123 4567",  placeholderLocal: "99 123 4567",   flag: "🇲🇼" },
  { name: "Mauritius",                    iso2: "MU", dialCode: "230", trunkPrefix: "",  nsnLengths: [8],     placeholder: "5123 4567",     placeholderLocal: "5123 4567",     flag: "🇲🇺" },
  { name: "Mozambique",                   iso2: "MZ", dialCode: "258", trunkPrefix: "",  nsnLengths: [9],     placeholder: "82 123 4567",   placeholderLocal: "82 123 4567",   flag: "🇲🇿" },
  { name: "Namibia",                      iso2: "NA", dialCode: "264", trunkPrefix: "0", nsnLengths: [9],     placeholder: "081 234 5678",  placeholderLocal: "81 234 5678",   flag: "🇳🇦" },
  { name: "Seychelles",                   iso2: "SC", dialCode: "248", trunkPrefix: "",  nsnLengths: [7],     placeholder: "251 2345",      placeholderLocal: "251 2345",      flag: "🇸🇨" },
  { name: "South Africa",                 iso2: "ZA", dialCode: "27",  trunkPrefix: "0", nsnLengths: [9],     placeholder: "082 123 4567",  placeholderLocal: "82 123 4567",   flag: "🇿🇦" },
  { name: "Tanzania",                     iso2: "TZ", dialCode: "255", trunkPrefix: "0", nsnLengths: [9],     placeholder: "071 234 5678",  placeholderLocal: "71 234 5678",   flag: "🇹🇿" },
  { name: "Zambia",                       iso2: "ZM", dialCode: "260", trunkPrefix: "0", nsnLengths: [9],     placeholder: "097 123 4567",  placeholderLocal: "97 123 4567",   flag: "🇿🇲" },
  { name: "Zimbabwe",                     iso2: "ZW", dialCode: "263", trunkPrefix: "0", nsnLengths: [9],     placeholder: "071 234 5678",  placeholderLocal: "71 234 5678",   flag: "🇿🇼" },
];

export const DEFAULT_COUNTRY = "South Africa";

const PROFILE_BY_NAME = new Map(COUNTRY_PROFILES.map(p => [p.name, p]));

export const getCountryProfile = (name?: string | null): CountryProfile =>
  (name && PROFILE_BY_NAME.get(name)) || PROFILE_BY_NAME.get(DEFAULT_COUNTRY)!;

/* ─────────────────────────────────────────────────────────────────────────
 * Phone helpers — operate on a single CountryProfile
 * ────────────────────────────────────────────────────────────────────── */

/** Strip everything except digits. */
export const onlyDigits = (s: string): string => (s || "").replace(/\D+/g, "");

/**
 * Strip dial code or trunk prefix from raw digits so we get just the
 * national significant number (NSN). Returns up to the max NSN length.
 */
export const toNationalDigits = (raw: string, profile: CountryProfile): string => {
  let d = onlyDigits(raw);
  if (!d) return "";
  // If the user typed the full international form (e.g. "27 82 ..." or "0027…")
  if (d.startsWith("00" + profile.dialCode)) d = d.slice(2 + profile.dialCode.length);
  else if (d.startsWith(profile.dialCode))   d = d.slice(profile.dialCode.length);
  // If they typed the national trunk prefix, drop it
  if (profile.trunkPrefix && d.startsWith(profile.trunkPrefix)) d = d.slice(profile.trunkPrefix.length);
  const maxLen = Math.max(...profile.nsnLengths);
  if (d.length > maxLen) d = d.slice(0, maxLen);
  return d;
};

/** Apply light spacing to the NSN for readability — does not change digits. */
export const formatLocalDisplay = (nsn: string, profile: CountryProfile): string => {
  if (!nsn) return "";
  // Use the placeholder layout as a template (numbers in placeholder = digit slots)
  const template = profile.placeholderLocal;
  let out = "";
  let i = 0;
  for (const ch of template) {
    if (i >= nsn.length) break;
    if (/\d/.test(ch)) { out += nsn[i]; i++; } else { out += ch; }
  }
  // Anything beyond the template just gets appended
  if (i < nsn.length) out += nsn.slice(i);
  return out;
};

/**
 * Returns what should actually live in the form-state for a phone value.
 * Format: dial code + space + spaced NSN — e.g. "+27 82 123 4567".
 * If the field is empty, returns "".
 */
export const composeStoredPhone = (raw: string, profile: CountryProfile): string => {
  const nsn = toNationalDigits(raw, profile);
  if (!nsn) return "";
  return `+${profile.dialCode} ${formatLocalDisplay(nsn, profile)}`;
};

/** Validate that the given input (any format) is a valid local number for the country. */
export const isValidLocalPhone = (raw: string, profile: CountryProfile): boolean => {
  const nsn = toNationalDigits(raw, profile);
  if (!nsn) return false;
  return profile.nsnLengths.includes(nsn.length);
};
