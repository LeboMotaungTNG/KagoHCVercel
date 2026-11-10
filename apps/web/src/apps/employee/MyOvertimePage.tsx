import React from "react";
import SharedLayout from "./SharedLayout";
import { C } from "../../shared/utils/employee";
import {
  CARD, TD, TH, ErrorBanner, LoadingBlock, PageHeader,
  StatTiles, overtimeStatusPill, overtimeNotes, useOvertimeRequests,
} from "../../shared/components/overtimeUi";
import { PerformancePage } from "./src/components/PerformanceUI";

const MyOvertimeContent: React.FC = () => {
  const { requests, loading, message } = useOvertimeRequests();
  const approvedHours = requests.filter((row) => row.status === "approved").reduce((total, row) => total + row.hours, 0);
  const pending = requests.filter((row) => row.status === "pending").length;

  return (
    <PerformancePage maxWidth={1200}>
      <PageHeader title="My Overtime" subtitle="Track submitted extra hours and their approval status" />
      {message ? <ErrorBanner message={message} /> : null}
      <StatTiles items={[
        { label: "Pending", value: pending, color: C.amber },
        { label: "Approved hours", value: `${approvedHours}h`, color: C.green },
        { label: "All requests", value: requests.length, color: C.coral },
      ]} />
      <div style={CARD}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: C.ink }}>Request history</h3>
        {loading ? <LoadingBlock label="Loading your overtime..." /> : (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                  {["Date", "Hours", "Rate", "Reason", "Status", "Notes"].map((h) => <th key={h} style={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>No overtime yet. Time you work past your standard hours appears here for HR to approve, and you can also request overtime in advance.</td></tr>
                ) : requests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: "1px solid #f2f4f7" }}>
                    <td style={TD}>{request.date}</td>
                    <td style={{ ...TD, fontWeight: 600, color: C.ink }}>{request.hours}h</td>
                    <td style={TD}>{request.rate}x</td>
                    <td style={TD}>{request.reason || "—"}</td>
                    <td style={TD}>{overtimeStatusPill(request.status)}</td>
                    <td style={{ ...TD, maxWidth: 260, color: request.status === "rejected" ? "#B42318" : C.muted }}>{overtimeNotes(request)}</td>
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

const MyOvertimePage: React.FC = () => (
  <SharedLayout title="My Overtime">
    <MyOvertimeContent />
  </SharedLayout>
);

export default MyOvertimePage;
