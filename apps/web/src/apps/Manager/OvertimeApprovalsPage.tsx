import React from "react";
import { Check, X } from "lucide-react";
import SharedLayout from "./SharedLayout";
import { C } from "../../shared/utils/employee";
import { orgApi, type OvertimeRequest } from "../../shared/utils/organizationSettings";
import {
  CARD, TD, TH, ErrorBanner, GhostButton, LoadingBlock, PageHeader, PersonCell,
  StatTiles, overtimeStatusPill, useOvertimeRequests,
} from "../../shared/components/overtimeUi";
import { PerformancePage } from "./managerUi";

export const OvertimeApprovalsContent: React.FC = () => {
  const { requests, setRequests, loading, message, setMessage } = useOvertimeRequests();
  const pending = requests.filter((row) => row.status === "pending");
  const approvedHours = requests
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + row.hours, 0);

  const decide = async (request: OvertimeRequest, approved: boolean) => {
    try {
      const response = approved
        ? await orgApi.approveOvertime(request.id)
        : await orgApi.rejectOvertime(request.id);
      if (!response.success) throw new Error(response.message || "Update failed");
      setRequests((current) => current.map((row) => (
        row.id === request.id ? { ...row, status: approved ? "approved" : "rejected" } : row
      )));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update request.");
    }
  };

  return (
    <PerformancePage maxWidth={1200}>
      <PageHeader
        title="Overtime Approvals"
        subtitle="Review pending extra-hours requests from your team"
      />
      {message ? <ErrorBanner message={message} /> : null}
      <StatTiles items={[
        { label: "Pending approvals", value: pending.length, color: C.amber },
        { label: "Approved this month", value: `${approvedHours}h`, color: C.green },
        { label: "Team requests", value: requests.length, color: C.coral },
      ]} />

      <div style={CARD}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.ink }}>Pending queue</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
            {pending.length} request{pending.length === 1 ? "" : "s"} waiting for a decision
          </p>
        </div>
        {loading ? <LoadingBlock label="Loading overtime requests..." /> : (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                  {["Employee", "Date", "Hours", "Rate", "Reason", "Status", "Actions"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>
                      No pending overtime requests
                    </td>
                  </tr>
                ) : pending.map((request, index) => (
                  <tr key={request.id} style={{ borderBottom: "1px solid #f2f4f7" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                    <td style={TD}><PersonCell name={request.employeeName} index={index} sub={request.startTime && request.endTime ? `${request.startTime} – ${request.endTime}` : undefined} /></td>
                    <td style={TD}>{request.date}</td>
                    <td style={{ ...TD, fontWeight: 600, color: C.ink }}>{request.hours}h</td>
                    <td style={TD}>{request.rate}x</td>
                    <td style={TD}>{request.reason || "—"}</td>
                    <td style={TD}>{overtimeStatusPill(request.status)}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <GhostButton onClick={() => decide(request, true)} style={{ color: "#027a48", borderColor: "#a6f4c5", background: C.okBg }}>
                          <Check size={14} /> Approve
                        </GhostButton>
                        <GhostButton onClick={() => decide(request, false)} style={{ color: "#b42318", borderColor: "#fca5a5", background: C.badBg }}>
                          <X size={14} /> Reject
                        </GhostButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PerformancePage>
  );
};

const OvertimeApprovalsPage: React.FC = () => (
  <SharedLayout title="Overtime Approvals">
    <OvertimeApprovalsContent />
  </SharedLayout>
);

export default OvertimeApprovalsPage;
