import React, { useEffect, useState } from "react";
import { Check, FileText, Lock, X } from "lucide-react";
import { delegationApi } from "../../api/delegation.api";
import type { DelegationAuditLog } from "../../types/delegation.types";
import { C } from "../../shared/utils/employee";
import { CARD, LoadingBlock } from "../../shared/components/overtimeUi";

const actionMeta = (action: string) => {
  if (action === "DELEGATION_CREATED") return { icon: <FileText size={16} />, bg: C.primaryBg, color: C.primaryDark, label: "Created" };
  if (action === "DELEGATION_REVOKED") return { icon: <Lock size={16} />, bg: "#f2f4f7", color: "#667085", label: "Revoked" };
  if (action === "APPROVE_DELEGATED") return { icon: <Check size={16} />, bg: C.okBg, color: "#027a48", label: "Approved" };
  if (action === "REJECT_DELEGATED") return { icon: <X size={16} />, bg: C.badBg, color: "#b42318", label: "Rejected" };
  return { icon: <FileText size={16} />, bg: "#f2f4f7", color: C.muted, label: action.replace(/_/g, " ") };
};

const DelegationAuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<DelegationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      setLoading(true);
      try {
        const response = await delegationApi.getAuditTrail({ limit: 50 });
        setLogs(response.logs || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditTrail();
  }, []);

  return (
    <div style={CARD}>
      <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: C.ink }}>Audit trail</h3>
      {loading ? <LoadingBlock label="Loading audit trail..." /> : logs.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No audit logs found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {logs.map((log) => {
            const meta = actionMeta(log.action);
            return (
              <div key={log._id} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid #eef0f3", background: "#f9fafb" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: meta.bg, color: meta.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {meta.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{meta.label}</div>
                  <div style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{log.message}</div>
                  <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>
                    {log.userEmail} · {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DelegationAuditTrail;
