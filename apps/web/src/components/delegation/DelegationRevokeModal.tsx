import React, { useState } from "react";
import { X } from "lucide-react";
import { useDelegation } from "../../hooks/useDelegation";
import type { Delegation } from "../../types/delegation.types";
import { C } from "../../shared/utils/employee";
import { INPUT, GhostButton, PrimaryButton } from "../../shared/components/overtimeUi";

interface DelegationRevokeModalProps {
  delegation: Delegation;
  onClose: () => void;
  onSuccess: () => void;
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", zIndex: 2000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};

const DelegationRevokeModal: React.FC<DelegationRevokeModalProps> = ({ delegation, onClose, onSuccess }) => {
  const { revokeDelegation, loading } = useDelegation();
  const [reason, setReason] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await revokeDelegation(delegation._id, { reason });
      onSuccess();
    } catch (error) {
      console.error("Failed to revoke delegation:", error);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec",
        width: "min(480px, 100%)", padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink }}>Revoke delegation</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.muted }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>
          Revoke authority from <strong>{delegation.delegatorName}</strong> to <strong>{delegation.delegateName}</strong>.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>
          {new Date(delegation.startDate).toLocaleDateString()} – {new Date(delegation.endDate).toLocaleDateString()}
        </p>
        <label style={{ display: "block", marginBottom: 20 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Reason</span>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you revoking this delegation?"
            style={{ ...INPUT, height: "auto", padding: 12, resize: "vertical" }}
          />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <GhostButton type="button" onClick={onClose} style={{ padding: "8px 16px", fontSize: 14 }}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={loading || !reason} style={{ background: C.bad }}>
            {loading ? "Revoking..." : "Revoke"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default DelegationRevokeModal;
