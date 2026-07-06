import type React from "react";
import { C, R, SHADOW, FONT_NUM } from "../../../shared/utils/employee";

export const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: R.xl,
  boxShadow: SHADOW,
  padding: 24,
};

export const subtle: React.CSSProperties = { color: C.muted, fontSize: 13 };

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: C.faint,
  marginBottom: 6,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "#fff",
  fontSize: 14,
  color: C.ink,
  outline: "none",
  boxSizing: "border-box",
};

export const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 96,
  fontFamily: "inherit",
};

export const primaryBtn: React.CSSProperties = {
  padding: "11px 20px",
  borderRadius: 10,
  border: "none",
  background: C.primary,
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  boxShadow: "0 4px 12px rgba(51,166,205,0.28)",
};

export const heroStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${C.primaryTint} 0%, ${C.surface} 55%, ${C.surfaceAlt} 100%)`,
  border: `1px solid ${C.line}`,
  borderRadius: R.hero,
  padding: "28px 28px 24px",
  marginBottom: 24,
  boxShadow: SHADOW,
};

export const statChip: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: R.lg,
  padding: "14px 16px",
  minWidth: 0,
};

export const numStyle: React.CSSProperties = {
  ...FONT_NUM,
  fontSize: 22,
  fontWeight: 800,
  color: C.ink,
  lineHeight: 1.1,
};

export { C, R, SHADOW, FONT_NUM };
