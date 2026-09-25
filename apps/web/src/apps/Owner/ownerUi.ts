import type { CSSProperties } from "react";
import { C, R, SHADOW } from "../../shared/utils/employee";

export {
  AlertBanner,
  EmptyState,
  FilterTabs,
  PageHero,
  PerformancePage,
  SectionCard,
  StatTile,
  perfBtnGhost,
  perfBtnHero,
  perfBtnPrimary,
  perfBtnSecondary,
} from "../employee/src/components/PerformanceUI";

export const ownerSearch: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: 280,
  height: 42,
  padding: "0 14px",
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
};

export const ownerInput: CSSProperties = {
  border: "none",
  outline: "none",
  width: "100%",
  fontSize: 14,
  color: C.ink,
  background: "transparent",
};

export const ownerTableCard: CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: R.xl,
  boxShadow: SHADOW,
  overflow: "hidden",
};

export const ownerTableStyles = {
  headRow: {
    style: {
      background: C.surfaceAlt,
      borderBottom: `1px solid ${C.line}`,
      minHeight: 48,
    },
  },
  headCells: {
    style: {
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
      color: C.muted,
    },
  },
  rows: {
    style: {
      minHeight: 56,
      borderBottom: `1px solid ${C.line}`,
    },
  },
};
