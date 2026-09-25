import type { LucideIcon } from "lucide-react";

export type NavLinkItem = {
  kind: "link";
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only this path (e.g. Dashboard). */
  exact?: boolean;
  /** Extra path prefixes that count as active. */
  match?: string[];
};

export type NavGroupItem = {
  kind: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  children: { to: string; label: string; exact?: boolean; match?: string[] }[];
};

export type NavEntry = NavLinkItem | NavGroupItem;

export type NavSection = {
  id: string;
  label: string;
  items: NavEntry[];
};

export type AppShellNav = {
  sections: NavSection[];
  mobile: { to: string; label: string; icon: LucideIcon }[];
};

export function pathIsActive(
  pathname: string,
  to: string,
  opts?: { exact?: boolean; match?: string[] },
): boolean {
  const matches = (base: string, exact?: boolean) => {
    if (exact) return pathname === base || pathname === `${base}/`;
    return pathname === base || pathname.startsWith(`${base}/`);
  };
  if (matches(to, opts?.exact)) return true;
  return (opts?.match || []).some((p) => matches(p, false));
}

export function groupIsActive(pathname: string, group: NavGroupItem): boolean {
  return group.children.some((child) =>
    pathIsActive(pathname, child.to, { exact: child.exact, match: child.match }),
  );
}
