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
  /** Set one form field directly (used by the half-day choices). */
  onSetField?: (name: keyof LeaveFormData, value: string) => void;
}

const DAY_PARTS: Array<{ value: LeaveFormData["dayPart"]; label: string; hint: string }> = [
  { value: "full", label: "Full day", hint: "" },
  { value: "morning", label: "Morning", hint: "half day" },
  { value: "afternoon", label: "Afternoon", hint: "half day" },
];

const formatDays = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} working day${n === 1 ? "" : "s"}`;

/** Half-day choices: Morning/Afternoon for one day; first/last day halves for longer requests. */
const HalfDayChoice: React.FC<{
  formData: LeaveFormData;
  onSetField: (name: keyof LeaveFormData, value: string) => void;
}> = ({ formData, onSetField }) => {
  if (!formData.startDate || !formData.endDate) return null;
  const singleDay = formData.startDate === formData.endDate;

  if (singleDay) {
    return (
      <div role="radiogroup" aria-label="Full or half day" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {DAY_PARTS.map(part => {
          const active = formData.dayPart === part.value;
          return (
            <button
              key={part.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSetField("dayPart", part.value)}
              style={{
                padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${active ? C.blue : C.line}`,
                background: active ? C.blueBg : C.surface,
                color: active ? C.blue : C.ink,
              }}
            >
              {part.label}{part.hint ? <span style={{ fontWeight: 400, color: C.muted }}> · {part.hint}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  const checkbox = (checked: boolean, onToggle: () => void, label: string) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.ink, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      {label}
    </label>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {checkbox(
        formData.startDayPart === "afternoon",
        () => onSetField("startDayPart", formData.startDayPart === "afternoon" ? "full" : "afternoon"),
        "First day: start in the afternoon (half day)",
      )}
      {checkbox(
        formData.endDayPart === "morning",
        () => onSetField("endDayPart", formData.endDayPart === "morning" ? "full" : "morning"),
        "Last day: finish at midday (half day)",
      )}
    </div>
  );
};

const LeaveRequestForm: React.FC<Props> = ({
  formData,
  availableLeaveTypes,
  submitting,
  onChange,
  onSubmit,
  onSetField,
}) => {
  const selectedType = availableLeaveTypes.find(t => t.type === formData.leaveType);
  const halfDaysAllowed = !!onSetField && selectedType?.allowHalfDays !== false;
  return (
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
            <span>{formatDays(formData.days)}</span>
          </div>
          <input type="hidden" name="days" value={formData.days} />
        </div>

        {halfDaysAllowed && formData.startDate && formData.endDate && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Half day</label>
            <HalfDayChoice formData={formData} onSetField={onSetField!} />
          </div>
        )}
        {!halfDaysAllowed && selectedType && onSetField && formData.startDate && (
          <div style={{ gridColumn: "1 / -1", fontSize: 12, color: C.muted }}>
            Half days aren't available for {selectedType.label || selectedType.name || "this leave type"}.
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
        Weekends and public holidays aren't counted as leave days.
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
};

export default LeaveRequestForm;
