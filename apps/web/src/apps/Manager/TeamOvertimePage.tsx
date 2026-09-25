import React, { useMemo, useState } from "react";
import SharedLayout from "./SharedLayout";
import { C } from "../../shared/utils/employee";
import {
  CARD, INPUT, TD, TH, ErrorBanner, LoadingBlock, PageHeader, PersonCell,
  StatTiles, overtimeStatusPill, useOvertimeRequests,
} from "../../shared/components/overtimeUi";
import type { OvertimeRequest } from "../../shared/utils/organizationSettings";
import { PerformancePage } from "./managerUi";

export const TeamOvertimeContent: React.FC = () => {
  const { requests, loading, message } = useOvertimeRequests();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | OvertimeRequest["status"]>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((row) => {
      if (status && row.status !== status) return false;
      if (!q) return true;
      return [row.employeeName, row.date, row.reason, row.status].some((value) =>
        String(value || "").toLowerCase().includes(q),
      );
    });
  }, [requests, search, status]);

  const approvedHours = requests.filter((row) => row.status === "approved").reduce((total, row) => total + row.hours, 0);
  const pending = requests.filter((row) => row.status === "pending").length;

  return (
    <PerformancePage maxWidth={1200}>
      <PageHeader
        title="Team Overtime"
        subtitle="Hours, status, and history for your team's extra-time requests"
      />
      {message ? <ErrorBanner message={message} /> : null}
      <StatTiles items={[
        { label: "Pending", value: pending, color: C.amber },
        { label: "Approved hours", value: `${approvedHours}h`, color: C.green },
        { label: "All requests", value: requests.length, color: C.coral },
      ]} />

      <div style={CARD}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.ink }}>Overtime history</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
              Showing {filtered.length} of {requests.length}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search employee or reason"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...INPUT, width: 240 }}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value as "" | OvertimeRequest["status"])} style={{ ...INPUT, width: 160 }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {loading ? <LoadingBlock label="Loading team overtime..." /> : (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
            <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                  {["Employee", "Date", "Hours", "Rate", "Reason", "Status"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>
                      No overtime records match your filters
                    </td>
                  </tr>
                ) : filtered.map((request, index) => (
                  <tr key={request.id} style={{ borderBottom: "1px solid #f2f4f7" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                    <td style={TD}><PersonCell name={request.employeeName} index={index} /></td>
                    <td style={TD}>{request.date}</td>
                    <td style={{ ...TD, fontWeight: 600, color: C.ink }}>{request.hours}h</td>
                    <td style={TD}>{request.rate}x</td>
                    <td style={TD}>{request.reason || "—"}</td>
                    <td style={TD}>{overtimeStatusPill(request.status)}</td>
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

const TeamOvertimePage: React.FC = () => (
  <SharedLayout title="Team Overtime">
    <TeamOvertimeContent />
  </SharedLayout>
);

export default TeamOvertimePage;
