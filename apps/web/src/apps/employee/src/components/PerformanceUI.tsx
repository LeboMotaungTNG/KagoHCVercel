import type { CSSProperties, ReactNode } from 'react';
import { C, FONT_NUM, R, SHADOW, SHADOW_L } from '../../../../shared/utils/employee';

/** Shared shell for all performance module pages. */
export function PerformancePage({
  children,
  maxWidth = 1100,
}: {
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div className="py-3" style={{ maxWidth, margin: '0 auto' }}>
      {children}
    </div>
  );
}

/** Kago gradient hero — use on every performance page. */
export function PageHero({
  icon,
  title,
  subtitle,
  actions,
  badge,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: { value: string | number; label: string };
}) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 55%, ${C.primaryLight} 130%)`,
        borderRadius: R.hero,
        boxShadow: SHADOW_L,
        padding: '26px 28px',
        marginBottom: 22,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
        }}
      />
      <div className="d-flex flex-wrap align-items-start gap-3" style={{ position: 'relative' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <h1 className="h4 mb-1" style={{ color: '#fff', fontWeight: 700 }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, maxWidth: 640 }}>
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <div
            className="text-center d-none d-md-block"
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: R.lg,
              padding: '10px 18px',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, ...FONT_NUM }}>{badge.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, opacity: 0.9 }}>
              {badge.label}
            </div>
          </div>
        )}
        {actions && <div className="d-flex flex-wrap gap-2 align-items-center">{actions}</div>}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon,
  color = C.primary,
  bg = C.primaryBg,
  sub,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color?: string;
  bg?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: R.xl,
        boxShadow: SHADOW,
        padding: '16px 18px',
        height: '100%',
        borderTop: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, ...FONT_NUM }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function SectionCard({
  icon,
  title,
  children,
  fill,
  actions,
  noMargin,
}: {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
  fill?: boolean;
  actions?: ReactNode;
  noMargin?: boolean;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: R.xl,
        boxShadow: SHADOW,
        padding: 18,
        marginBottom: noMargin ? 0 : 20,
        height: fill ? '100%' : undefined,
      }}
    >
      {(title || actions) && (
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            {icon && (
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: C.primaryBg,
                  color: C.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </span>
            )}
            {title && <span style={{ fontWeight: 700, color: C.ink }}>{title}</span>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function MeterRow({
  label,
  meta,
  pct,
  danger,
}: {
  label: string;
  meta: string;
  pct: number;
  danger?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between small mb-1">
        <span className="d-flex align-items-center gap-2" style={{ fontWeight: 600, color: C.text }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: danger ? C.bad : C.primary,
              display: 'inline-block',
            }}
          />
          {label}
        </span>
        <span style={{ color: C.muted, ...FONT_NUM }}>{meta}</span>
      </div>
      <div style={{ height: 8, borderRadius: 5, background: C.line, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            height: '100%',
            borderRadius: 5,
            background: danger
              ? `linear-gradient(90deg, ${C.bad}, #f87171)`
              : `linear-gradient(90deg, ${C.primaryDark}, ${C.primaryLight})`,
          }}
        />
      </div>
    </div>
  );
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: `1px solid ${value === t.key ? C.primary : C.line}`,
            background: value === t.key ? C.primary : C.surface,
            color: value === t.key ? '#fff' : C.text,
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: value === t.key ? SHADOW_L : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, message }: { icon?: ReactNode; message: string }) {
  return (
    <div
      style={{
        border: `1px dashed ${C.primaryLight}`,
        borderRadius: R.xl,
        padding: 40,
        textAlign: 'center',
        color: C.muted,
        background: C.primaryTint,
      }}
    >
      {icon && <div style={{ marginBottom: 10, color: C.primary }}>{icon}</div>}
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

export function CountPill({ count }: { count: number }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: C.primaryDark,
        background: C.primaryBg,
        borderRadius: 20,
        padding: '2px 10px',
        ...FONT_NUM,
      }}
    >
      {count}
    </span>
  );
}

export function SectionHeading({
  icon,
  title,
  count,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div className="d-flex align-items-center gap-2" style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>
        {icon && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: C.primaryBg,
              color: C.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </span>
        )}
        {title}
        {typeof count === 'number' && <CountPill count={count} />}
      </div>
      {actions}
    </div>
  );
}

export const perfBtnPrimary: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: 'none',
  background: C.primary,
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

export const perfBtnSecondary: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: C.surface,
  color: C.text,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

export const perfBtnGhost: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: 'transparent',
  color: C.muted,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

export const perfBtnHero: CSSProperties = {
  ...perfBtnPrimary,
  padding: '10px 16px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.2)',
  border: '1px solid rgba(255,255,255,0.35)',
  color: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

/** Dark Kago pillar strip used above evaluation / goals sections. */
export function PillarHeader({
  label,
  meta,
  connected,
}: {
  label: string;
  meta?: string;
  /** When true, bottom corners are square so a SectionCard can sit flush below. */
  connected?: boolean;
}) {
  return (
    <div
      className="px-3 py-2"
      style={{
        background: `linear-gradient(90deg, ${C.primaryDark}, ${C.primary})`,
        color: '#fff',
        borderRadius: connected ? '12px 12px 0 0' : 12,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.04em',
      }}
    >
      <div className="d-flex justify-content-between align-items-center">
        <span>{label}</span>
        {meta && <span className="small opacity-75">{meta}</span>}
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 20,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

export function AlertBanner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'ok';
  children: ReactNode;
}) {
  const styles =
    tone === 'warn'
      ? { bg: C.warnBg, color: C.warn }
      : tone === 'danger'
        ? { bg: C.badBg, color: C.bad }
        : tone === 'ok'
          ? { bg: C.okBg, color: C.ok }
          : { bg: C.primaryBg, color: C.primaryDark };

  return (
    <div
      style={{
        background: styles.bg,
        color: styles.color,
        padding: '10px 14px',
        borderRadius: R.md,
        marginBottom: 16,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
