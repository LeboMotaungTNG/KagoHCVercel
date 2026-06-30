/**
 * Leave-type icon registry. We removed all emoji glyphs from the page and use
 * professional Lucide icons throughout. Older data stored emoji strings in the
 * `icon` field, so we normalize those to a canonical icon key on read.
 */

import React from "react";
import {
  BookOpen, Bird, Pause, Cake, Star, Smile, Umbrella, Stethoscope,
  Heart, Leaf, GraduationCap, Home, Plane, Activity, Handshake,
  ClipboardList, Baby, Users, type LucideIcon,
} from "lucide-react";

/** Canonical keys used in the icon picker and stored in the DB going forward. */
export type LeaveIconKey =
  | "umbrella" | "stethoscope" | "heart" | "baby" | "users"
  | "book-open" | "bird" | "pause" | "cake" | "star" | "smile"
  | "leaf" | "graduation-cap" | "home" | "plane" | "activity"
  | "handshake" | "clipboard";

export const LEAVE_ICON_KEYS: LeaveIconKey[] = [
  "book-open", "bird", "pause", "cake", "star", "smile",
  "umbrella", "stethoscope", "leaf", "graduation-cap",
  "handshake", "home", "plane", "activity",
];

const REGISTRY: Record<LeaveIconKey, LucideIcon> = {
  "umbrella":        Umbrella,
  "stethoscope":     Stethoscope,
  "heart":           Heart,
  "baby":            Baby,
  "users":           Users,
  "book-open":       BookOpen,
  "bird":            Bird,
  "pause":           Pause,
  "cake":            Cake,
  "star":            Star,
  "smile":           Smile,
  "leaf":            Leaf,
  "graduation-cap":  GraduationCap,
  "home":            Home,
  "plane":           Plane,
  "activity":        Activity,
  "handshake":       Handshake,
  "clipboard":       ClipboardList,
};

/** Map legacy emoji values stored in older leave-policy records to icon keys. */
const EMOJI_TO_KEY: Record<string, LeaveIconKey> = {
  "📚": "book-open",
  "🕊️": "bird",
  "🕊":  "bird",
  "⏸️": "pause",
  "⏸":  "pause",
  "🎂": "cake",
  "🕌": "star",
  "💆": "smile",
  "🏖️": "umbrella",
  "🏖":  "umbrella",
  "🏥": "stethoscope",
  "⭐": "star",
  "🌿": "leaf",
  "🤝": "handshake",
  "🎓": "graduation-cap",
  "🏠": "home",
  "✈️": "plane",
  "✈":  "plane",
  "🔵": "activity",
  "📋": "clipboard",
};

/** Always returns a usable icon key, defaulting to `star`. */
export function normalizeLeaveIcon(raw: string | undefined | null): LeaveIconKey {
  if (!raw) return "star";
  if ((REGISTRY as Record<string, unknown>)[raw]) return raw as LeaveIconKey;
  return EMOJI_TO_KEY[raw] ?? "star";
}

interface LeaveIconProps {
  name?:   string | null;
  size?:   number;
  color?:  string;
  /** Optional inline style override (e.g. for vertical alignment). */
  style?:  React.CSSProperties;
}

export const LeaveIcon: React.FC<LeaveIconProps> = ({ name, size = 16, color, style }) => {
  const Icon = REGISTRY[normalizeLeaveIcon(name)];
  return <Icon size={size} color={color} style={style} aria-hidden="true" />;
};
