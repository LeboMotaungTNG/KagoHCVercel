import React, { useEffect, useState } from "react";
import { useDelegation } from "../../hooks/useDelegation";
import type { Delegation } from "../../types/delegation.types";
import DelegationDetails from "./DelegationDetails";
import DelegationRevokeModal from "./DelegationRevokeModal";
import { C } from "../../shared/utils/employee";
import {
  CARD, INPUT, TD, TH, GhostButton, LoadingBlock, PersonCell,
} from "../../shared/components/overtimeUi";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

const statusStyle = (delegation: Delegation) => {
  const now = new Date();
  const start = new Date(delegation.startDate);
  const end = new Date(delegation.endDate);
  if (!delegation.isActive) return { label: "Revoked", bg: "#f2f4f7", color: "#667085" };
  if (now < start) return { label: "Upcoming", bg: C.primaryBg, color: C.primaryDark };
  if (now > end) return { label: "Expired", bg: C.warnBg, color: "#b54708" };
  return { label: "Active", bg: C.okBg, color: "#027a48" };
};

const DelegationList: React.FC = () => {
  const { delegations, fetchDelegations, loading, pagination } = useDelegation();
  const [filter, setFilter] = useState<"all" | "delegated-by-me" | "delegated-to-me">("all");
  const [showActive, setShowActive] = useState(true);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    fetchDelegations({
      type: filter,
      isActive: showActive ? true : undefined,
      page: 1,
      limit: 10,
    });
  }, [fetchDelegations, filter, showActive]);

  return (
    <div style={CARD}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.ink }}>Authority hand-offs</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
            Showing {delegations.length} of {pagination.total}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            style={{ ...INPUT, width: 200 }}
          >
            <option value="all">All delegations</option>
            <option value="delegated-by-me">Delegated by me</option>
            <option value="delegated-to-me">Delegated to me</option>
          </select>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={showActive} onChange={(e) => setShowActive(e.target.checked)} />
            Active only
          </label>
        </div>
      </div>

      {loading ? <LoadingBlock label="Loading delegations..." /> : delegations.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>No delegations found.</div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
          <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                {["Delegator", "Delegate", "Period", "Scope", "Status", "Actions"].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delegations.map((delegation, index) => {
                const status = statusStyle(delegation);
                return (
                  <tr key={delegation._id} style={{ borderBottom: "1px solid #f2f4f7" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                    <td style={TD}><PersonCell name={delegation.delegatorName} index={index} sub={delegation.delegatorEmail} /></td>
                    <td style={TD}><PersonCell name={delegation.delegateName} index={index + 3} sub={delegation.delegateEmail} /></td>
                    <td style={TD}>{formatDate(delegation.startDate)} – {formatDate(delegation.endDate)}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(delegation.scope?.roles || []).map((role) => (
                          <span key={role} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: C.primaryBg, color: C.primaryDark }}>
                            {role.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <GhostButton onClick={() => setSelectedDelegation(delegation)}>Details</GhostButton>
                        {delegation.isActive && (
                          <GhostButton
                            onClick={() => { setSelectedDelegation(delegation); setShowRevokeModal(true); }}
                            style={{ color: "#b42318", borderColor: "#fca5a5" }}
                          >
                            Revoke
                          </GhostButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDelegation && !showRevokeModal && (
        <DelegationDetails
          delegation={selectedDelegation}
          onClose={() => setSelectedDelegation(null)}
          onRevoke={() => setShowRevokeModal(true)}
        />
      )}

      {showRevokeModal && selectedDelegation && (
        <DelegationRevokeModal
          delegation={selectedDelegation}
          onClose={() => { setShowRevokeModal(false); setSelectedDelegation(null); }}
          onSuccess={() => {
            setShowRevokeModal(false);
            setSelectedDelegation(null);
            fetchDelegations();
          }}
        />
      )}
    </div>
  );
};

export default DelegationList;
