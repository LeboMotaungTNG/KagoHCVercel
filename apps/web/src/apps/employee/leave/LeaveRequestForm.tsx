import React from "react";
import { CalendarPlus, Plus } from "lucide-react";
import type { LeaveFormData, LeavePolicy } from "./types";
import { C, labelStyle, inputStyle, selectStyle, textareaStyle, primaryBtn } from "./leaveStyles";
import { Section } from "./leaveUiHelpers";

interface Props {
  formData: LeaveFormData;
  availableLeaveTypes: LeavePolicy[];
  submitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LeaveRequestForm: React.FC<Props> = ({
  formData,
  availableLeaveTypes,
  submitting,
  onChange,
  onSubmit,
}) => (
  <Section
    icon={<CalendarPlus size={20} />}
    iconColor={C.blue}
    title="Request leave"
    subtitle="Submit a new leave request for manager approval."
  >
    <form onSubmit={onSubmit}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Leave type</label>
          <select
            name="leaveType"
            value={formData.leaveType}
            onChange={onChange}
            style={selectStyle}
            required
          >
            {availableLeaveTypes.map(type => (
              <option key={type.type} value={type.type}>
                {type.label || type.name || type.type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Start date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={onChange}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>End date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={onChange}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Duration</label>
          <div style={{
            ...inputStyle,
            background: C.surfaceAlt,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: C.ink,
          }}>
            <span>{formData.days}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>day{formData.days === 1 ? "" : "s"} (auto)</span>
          </div>
          <input type="hidden" name="days" value={formData.days} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Reason</label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={onChange}
          rows={4}
          style={textareaStyle}
          placeholder="Brief explanation for your leave request…"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          ...primaryBtn,
          marginTop: 20,
          width: "100%",
          opacity: submitting ? 0.65 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        <Plus size={16} />
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  </Section>
);

export default LeaveRequestForm;
