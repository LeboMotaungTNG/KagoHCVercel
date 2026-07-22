import { C } from '../../../../shared/utils/employee';

interface RatingBadgeProps {
  label: string;
  color: string;
}

export default function RatingBadge({ label, color }: RatingBadgeProps) {
  if (!label) {
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 20,
          background: C.surfaceAlt,
          color: C.muted,
          border: `1px solid ${C.line}`,
        }}
      >
        Not yet scored
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 700,
        padding: '4px 12px',
        borderRadius: 20,
        backgroundColor: color,
        color: '#fff',
      }}
    >
      {label}
    </span>
  );
}
