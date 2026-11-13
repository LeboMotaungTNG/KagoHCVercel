import React, { useEffect, useState } from "react";
import { Col, FormGroup, Input, Label, Row } from "reactstrap";
import { FaBusinessTime, FaEdit, FaSave, FaUndo } from "react-icons/fa";
import {
  DEFAULT_WORK_SCHEDULE,
  type WorkSchedule,
  useWorkSchedule,
} from "../../shared/utils/attendance";
import { C } from "../../shared/utils/employee";
import { AlertBanner, SectionCard, perfBtnGhost, perfBtnPrimary, perfBtnSecondary } from "./ownerUi";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

function validate(s: WorkSchedule): string | null {
  if (!TIME_RE.test(s.arrivalTime)) return "Enter a valid start time (HH:MM).";
  if (!TIME_RE.test(s.departureTime)) return "Enter a valid end time (HH:MM).";
  if (toMinutes(s.departureTime) <= toMinutes(s.arrivalTime)) return "End time must be after start time.";
  if (!Number.isFinite(s.graceMinutes) || s.graceMinutes < 0 || s.graceMinutes > 180) {
    return "Late grace period must be between 0 and 180 minutes.";
  }
  return null;
}

/**
 * Lets the owner set the company's official working hours. The schedule is
 * the same one Attendance uses to decide whether a clock-in is "late".
 */
export const WorkingHoursPanel = () => {
  const [schedule, setSchedule] = useWorkSchedule();
  const [draft, setDraft] = useState<WorkSchedule>(schedule);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  useEffect(() => { if (!editing) setDraft(schedule); }, [schedule, editing]);

  const update = <K extends keyof WorkSchedule>(key: K, value: WorkSchedule[K]) =>
    setDraft((cur) => ({ ...cur, [key]: value }));

  const save = () => {
    const error = validate(draft);
    if (error) { setMessage({ tone: "warn", text: error }); return; }
    setSchedule(draft);
    setEditing(false);
    setMessage({ tone: "ok", text: "Working hours saved." });
  };

  const cancel = () => { setDraft(schedule); setEditing(false); setMessage(null); };

  const shown = editing ? draft : schedule;
  const span = TIME_RE.test(shown.arrivalTime) && TIME_RE.test(shown.departureTime)
    ? toMinutes(shown.departureTime) - toMinutes(shown.arrivalTime)
    : 0;

  return (
    <SectionCard
      icon={<FaBusinessTime size={14} />}
      title="Working Hours"
      actions={
        !editing ? (
          <button type="button" style={perfBtnSecondary} onClick={() => { setEditing(true); setMessage(null); }}>
            <FaEdit className="me-2" /> Edit
          </button>
        ) : (
          <div className="d-flex gap-2">
            <button type="button" style={perfBtnGhost} onClick={() => setDraft(DEFAULT_WORK_SCHEDULE)}>
              <FaUndo className="me-2" /> Reset to default
            </button>
            <button type="button" style={perfBtnGhost} onClick={cancel}>Cancel</button>
            <button type="button" style={perfBtnPrimary} onClick={save}><FaSave className="me-2" /> Save</button>
          </div>
        )
      }
    >
      <p className="small mb-3" style={{ color: C.muted }}>
        Your company's official start and end of day. Employees who clock in after the start time
        (plus any grace period) are marked as late in Attendance.
      </p>
      {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
      <Row className="g-3">
        <Col md={4}>
          <FormGroup>
            <Label className="small fw-bold" style={{ color: C.muted }}>Start time</Label>
            {editing ? (
              <Input type="time" value={draft.arrivalTime} onChange={(e) => update("arrivalTime", e.target.value)} />
            ) : (
              <p className="h6 fw-normal mt-1">{schedule.arrivalTime}</p>
            )}
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <Label className="small fw-bold" style={{ color: C.muted }}>End time</Label>
            {editing ? (
              <Input type="time" value={draft.departureTime} onChange={(e) => update("departureTime", e.target.value)} />
            ) : (
              <p className="h6 fw-normal mt-1">{schedule.departureTime}</p>
            )}
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <Label className="small fw-bold" style={{ color: C.muted }}>Late grace period (minutes)</Label>
            {editing ? (
              <Input type="number" min={0} max={180} step={1} value={draft.graceMinutes}
                     onChange={(e) => update("graceMinutes", Number(e.target.value))} />
            ) : (
              <p className="h6 fw-normal mt-1">{schedule.graceMinutes ? `${schedule.graceMinutes} min` : "None"}</p>
            )}
          </FormGroup>
        </Col>
      </Row>
      {span > 0 && (
        <p className="small mb-0" style={{ color: C.muted }}>
          Working day: {shown.arrivalTime} – {shown.departureTime} ({fmtDuration(span)} including breaks)
        </p>
      )}
    </SectionCard>
  );
};

export default WorkingHoursPanel;
