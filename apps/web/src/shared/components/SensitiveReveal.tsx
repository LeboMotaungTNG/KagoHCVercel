import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { C } from "../utils/employee";
import { maskLast4, recordPiiReveal, type PiiField } from "../utils/piiAudit";

type SensitiveRevealProps = {
  value?: string | null;
  field: PiiField;
  subjectId?: string;
  subjectName?: string;
  emptyLabel?: string;
  /** When false, reveal is not written to the audit trail (e.g. someone viewing their own record). */
  audit?: boolean;
};

const SensitiveReveal: React.FC<SensitiveRevealProps> = ({
  value,
  field,
  subjectId,
  subjectName,
  emptyLabel = "Not provided",
  audit = true,
}) => {
  const [open, setOpen] = useState(false);
  const raw = String(value || "").trim();
  if (!raw) return <span>{emptyLabel}</span>;

  const masked = maskLast4(raw);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && audit) {
      void recordPiiReveal({ field, value: raw, subjectId, subjectName });
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: open ? 0 : 0.4 }}>
        {open ? raw : masked}
      </span>
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Hide number" : "Show number"}
        title={open ? "Hide" : "Show last digits — this is recorded"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          border: `1px solid ${C.line}`, background: "#fff",
          borderRadius: 6, padding: "2px 8px", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: C.primaryDark,
        }}
      >
        {open ? <EyeOff size={13} /> : <Eye size={13} />}
        {open ? "Hide" : "Show"}
      </button>
    </span>
  );
};

export default SensitiveReveal;
