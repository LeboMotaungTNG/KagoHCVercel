import React from "react";
import { X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import type { Delegation } from "../../types/delegation.types";
import { C } from "../../shared/utils/employee";
import { GhostButton, PrimaryButton } from "../../shared/components/overtimeUi";

interface DelegationDetailsProps {
  delegation: Delegation;
  onClose: () => void;
  onRevoke: () => void;
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", zIndex: 2000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const sheet: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec",
  width: "min(560px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 24,
};
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 };

const DelegationDetails: React.FC<DelegationDetailsProps> = ({ delegation, onClose, onRevoke }) => {
  const { user } = useAuth();
  const isDelegator = user?.id === delegation.delegatorId || user?._id === delegation.delegatorId;
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-ZA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink }}>Delegation details</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.muted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={label}>Delegator</div>
            <div style={{ fontWeight: 600, color: C.ink }}>{delegation.delegatorName}</div>
            <div style={{ fontSize: 13, color: C.faint }}>{delegation.delegatorEmail}</div>
          </div>
          <div>
            <div style={label}>Delegate</div>
            <div style={{ fontWeight: 600, color: C.ink }}>{delegation.delegateName}</div>
            <div style={{ fontSize: 13, color: C.faint }}>{delegation.delegateEmail}</div>
          </div>
          <div>
            <div style={label}>Period</div>
            <div style={{ fontSize: 14, color: C.text }}>{formatDate(delegation.startDate)} – {formatDate(delegation.endDate)}</div>
          </div>
          {delegation.reason && (
            <div>
              <div style={label}>Reason</div>
              <div style={{ fontSize: 14, color: C.text }}>{delegation.reason}</div>
            </div>
          )}
          <div>
            <div style={label}>Roles</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(delegation.scope?.roles || []).map((role) => (
                <span key={role} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: C.primaryBg, color: C.primaryDark }}>
                  {role.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <GhostButton type="button" onClick={onClose} style={{ padding: "8px 16px", fontSize: 14 }}>Close</GhostButton>
          {isDelegator && delegation.isActive && (
            <PrimaryButton type="button" onClick={onRevoke} style={{ background: C.bad }}>Revoke</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelegationDetails;
