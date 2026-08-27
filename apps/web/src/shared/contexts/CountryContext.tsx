import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_COUNTRY, getCountryProfile, type CountryProfile } from "../utils/country";

const STORAGE_KEY = "kago.activeCountry";
const ONBOARDING_CACHE_KEY = "kago.ownerOnboarding";

const readInitialCountry = (): string => {
  try {
    const direct = localStorage.getItem(STORAGE_KEY);
    if (direct) return direct;
    // Fallback to the owner onboarding cache so we don't lose context
    // when the user already picked a country during onboarding.
    const onboarding = localStorage.getItem(ONBOARDING_CACHE_KEY);
    if (onboarding) {
      const parsed = JSON.parse(onboarding) as { country?: string };
      if (parsed?.country) return parsed.country;
    }
  } catch { /* ignore */ }
  return DEFAULT_COUNTRY;
};

interface CountryContextValue {
  country: string;
  profile: CountryProfile;
  setCountry: (next: string) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country, setCountryState] = useState<string>(readInitialCountry);

  // Persist to localStorage so other tabs / components see updates
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, country); } catch { /* ignore */ }
  }, [country]);

  // Cross-tab sync — if another tab changes the active country, pick it up
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== country) {
        setCountryState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [country]);

  const setCountry = useCallback((next: string) => {
    if (!next) return;
    setCountryState(next);
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({ country, profile: getCountryProfile(country), setCountry }),
    [country, setCountry],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
};

/**
 * Read the active country profile.
 *
 * Safe to use outside a CountryProvider — it falls back to the default
 * (South Africa) so older pages that haven't been wrapped still work.
 */
export const useCountry = (): CountryContextValue => {
  const ctx = useContext(CountryContext);
  if (ctx) return ctx;
  return {
    country: DEFAULT_COUNTRY,
    profile: getCountryProfile(DEFAULT_COUNTRY),
    setCountry: () => { /* no-op when no provider */ },
  };
};
