import React, { useState } from "react";
import SharedLayout from "./SharedLayout";
import { C } from "../../shared/utils/employee";
import { orgApi } from "../../shared/utils/organizationSettings";
import {
  CARD, INPUT, TD, TH, ErrorBanner, LoadingBlock, PageHeader,
  PrimaryButton, SuccessBanner, hoursBetween, overtimeStatusPill, useOvertimeRequests,
} from "../../shared/components/overtimeUi";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{label}</span>
    {children}
  </label>
);

const OvertimeRequestContent: React.FC = () => {
  const { requests, loading, message, setMessage, load } = useOvertimeRequests();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const hours = hoursBetween(form.startTime, form.endTime);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hours || !form.reason.trim()) {
      setMessage("Add valid start and end times plus a reason.");
      return;
    }
    setSaving(true);
    try {
      const response = await orgApi.requestOvertime(form);
      if (!response.success) throw new Error(response.message || "Request failed");
      setMessage("Overtime request submitted for approval.");
      setForm({ ...form, startTime: "", endTime: "", reason: "" });
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit request.");
    } finally {
      setSaving(false);
    }
  };

  const isError = message && !message.toLowerCase().includes("submitted");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader title="Request Overtime" subtitle="Submit extra hours to your manager for approval" />
      {message && isError ? <ErrorBanner message={message} /> : null}
      {message && !isError ? <SuccessBanner message={message} /> : null}

      <form onSubmit={submit} style={{ ...CARD, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={INPUT} />
          </Field>
          <Field label="Start time">
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={INPUT} />
          </Field>
          <Field label="End time">
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={INPUT} />
          </Field>
          <Field label="Calculated hours">
            <input readOnly value={hours ? `${hours} hours` : "Select times"} style={{ ...INPUT, background: "#f9fafb" }} />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Reason">
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Why is overtime needed?"
              style={{ ...INPUT, height: "auto", padding: 12, resize: "vertical" }}
            />
          </Field>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryButton type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit request"}</PrimaryButton>
        </div>
      </form>

      <div style={CARD}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: C.ink }}>Recent requests</h3>
        {loading ? <LoadingBlock label="Loading your overtime..." /> : (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                  {["Date", "Hours", "Rate", "Reason", "Status"].map((h) => <th key={h} style={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>No overtime requests yet</td></tr>
                ) : requests.slice(0, 5).map((request) => (
                  <tr key={request.id} style={{ borderBottom: "1px solid #f2f4f7" }}>
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
    </div>
  );
};

const OvertimeRequestPage: React.FC = () => (
  <SharedLayout title="Request Overtime">
    <OvertimeRequestContent />
  </SharedLayout>
);

export default OvertimeRequestPage;
