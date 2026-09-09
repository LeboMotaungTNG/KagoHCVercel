import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, Col, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import { FaCheck, FaClock, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import {
  DEFAULT_OVERTIME_SETTINGS,
  type OvertimeRequest,
  type OvertimeSettings,
  orgApi,
} from "../../shared/utils/organizationSettings";

type PanelRole = "owner" | "manager" | "employee";

const panelCard = "border-0 shadow-sm rounded-4 mb-4";
const normalizeRequests = (data: any): OvertimeRequest[] => {
  const rows = Array.isArray(data) ? data : data?.requests;
  return (rows || []).map((request: any) => ({
    ...request,
    id: request.id || request._id,
    employeeName: request.employeeName || request.employee?.name,
    hours: Number(request.hours || 0),
    rate: Number(request.rate || 1.5),
    status: request.status || "pending",
  }));
};

const statusBadge = (status: OvertimeRequest["status"]) => (
  <Badge color={status === "approved" ? "success" : status === "rejected" ? "danger" : "warning"} pill>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

const hoursBetween = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return minutes > 0 ? Math.round((minutes / 60) * 100) / 100 : 0;
};

const OvertimeSettings = () => {
  const [settings, setSettings] = useState<OvertimeSettings>(DEFAULT_OVERTIME_SETTINGS);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    orgApi.loadOvertimeSettings().then((response) => {
      if (response.success && response.data) setSettings({ ...DEFAULT_OVERTIME_SETTINGS, ...response.data });
    }).catch(() => setMessage("Could not load overtime settings. Showing defaults.")).finally(() => setLoading(false));
  }, []);

  const update = (key: keyof OvertimeSettings, value: number | boolean) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const response = await orgApi.saveOvertimeSettings(settings);
      if (!response.success) throw new Error(response.message || "Save failed");
      setEditing(false); setMessage("Overtime settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save overtime settings.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-4 text-center"><Spinner size="sm" /> Loading overtime settings...</div>;
  return <Card className={panelCard}>
    <CardBody className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div><h5 className="fw-bold mb-1"><FaClock className="text-info me-2" /> Overtime Rules</h5><p className="text-muted small mb-0">Rules used when overtime is requested and calculated.</p></div>
        {!editing ? <Button color="outline-info" onClick={() => setEditing(true)}><FaEdit className="me-2" /> Edit</Button> : <div className="d-flex gap-2"><Button color="secondary" outline onClick={() => setEditing(false)}>Cancel</Button><Button color="success" disabled={saving} onClick={save}>{saving ? <Spinner size="sm" /> : <FaSave className="me-2" />} Save</Button></div>}
      </div>
      {message && <Alert color={message.includes("saved") ? "success" : "warning"} className="py-2">{message}</Alert>}
      <Row className="g-3">
        {([['standardHoursPerDay', 'Standard hours per day', 1, 24, 1], ['overtimeRate', 'Overtime rate (x)', 1, 5, 0.1], ['weekendRate', 'Weekend rate (x)', 1, 5, 0.1], ['holidayRate', 'Holiday rate (x)', 1, 5, 0.1], ['approvalThreshold', 'Approval threshold (hours)', 0, 24, 0.5], ['maxOvertimePerDay', 'Max overtime per day', 0, 24, 0.5]] as const).map(([key, label, min, max, step]) => <Col md={4} key={key}><FormGroup><Label className="small text-muted fw-bold">{label}</Label>{editing ? <Input type="number" min={min} max={max} step={step} value={settings[key]} onChange={(event) => update(key, Number(event.target.value))} /> : <p className="h6 fw-normal mt-1">{settings[key]}{key.includes("Rate") ? "x" : ""}</p>}</FormGroup></Col>)}
        <Col md={4}><FormGroup><Label className="small text-muted fw-bold">Overtime approval</Label>{editing ? <Input type="select" value={settings.approvalRequired ? "yes" : "no"} onChange={(event) => update("approvalRequired", event.target.value === "yes")}><option value="yes">Required</option><option value="no">Not required</option></Input> : <p className="h6 fw-normal mt-1">{settings.approvalRequired ? "Required" : "Not required"}</p>}</FormGroup></Col>
      </Row>
    </CardBody>
  </Card>;
};

const RequestHistory = ({ requests }: { requests: OvertimeRequest[] }) => <Card className={panelCard}><CardBody className="p-4"><h5 className="fw-bold mb-3">My Overtime</h5><Table responsive hover className="align-middle mb-0"><thead><tr><th>Date</th><th>Hours</th><th>Rate</th><th>Reason</th><th>Status</th></tr></thead><tbody>{requests.length ? requests.map((request) => <tr key={request.id}><td>{request.date}</td><td>{request.hours}h</td><td>{request.rate}x</td><td>{request.reason}</td><td>{statusBadge(request.status)}</td></tr>) : <tr><td colSpan={5} className="text-muted text-center py-4">No overtime requests yet.</td></tr>}</tbody></Table></CardBody></Card>;

const EmployeeOvertime = () => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", reason: "" });
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hours = hoursBetween(form.startTime, form.endTime);
  const load = () => orgApi.loadOvertimeRequests().then((response) => { if (response.success) setRequests(normalizeRequests(response.data)); }).catch(() => setMessage("Could not load your overtime history."));
  useEffect(() => { load(); }, []);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!hours || !form.reason.trim()) return setMessage("Add valid start and end times plus a reason."); setSaving(true); setMessage(null); try { const response = await orgApi.requestOvertime(form); if (!response.success) throw new Error(response.message || "Request failed"); setMessage("Overtime request submitted for approval."); setForm({ ...form, startTime: "", endTime: "", reason: "" }); load(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit request."); } finally { setSaving(false); } };
  return <><Card className={panelCard}><CardBody className="p-4"><h5 className="fw-bold mb-1"><FaClock className="text-info me-2" /> Request Overtime</h5><p className="text-muted small mb-3">Submit extra hours to your manager for approval.</p>{message && <Alert color="info" className="py-2">{message}</Alert>}<form onSubmit={submit}><Row className="g-3"><Col md={3}><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Col><Col md={3}><Label>Start time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Col><Col md={3}><Label>End time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Col><Col md={3}><Label>Calculated hours</Label><Input readOnly value={hours ? `${hours} hours` : "Select times"} /></Col><Col md={9}><Label>Reason</Label><Input type="textarea" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why is overtime needed?" /></Col><Col md={3} className="d-flex align-items-end"><Button color="info" className="text-white w-100" disabled={saving}>{saving ? <Spinner size="sm" /> : "Submit request"}</Button></Col></Row></form></CardBody></Card><RequestHistory requests={requests} /></>;
};

const ManagerOvertime = () => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const load = () => orgApi.loadOvertimeRequests().then((response) => { if (response.success) setRequests(normalizeRequests(response.data)); }).catch(() => setMessage("Could not load overtime requests.")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const decide = async (request: OvertimeRequest, approved: boolean) => { try { const response = approved ? await orgApi.approveOvertime(request.id) : await orgApi.rejectOvertime(request.id); if (!response.success) throw new Error(response.message || "Update failed"); setRequests((current) => current.map((row) => row.id === request.id ? { ...row, status: approved ? "approved" : "rejected" } : row)); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update request."); } };
  const pending = requests.filter((request) => request.status === "pending");
  if (loading) return <div className="py-4 text-center"><Spinner size="sm" /> Loading overtime requests...</div>;
  return <><Row className="g-3 mb-3"><Col md={4}><Card className={panelCard}><CardBody><span className="text-muted small">Pending approvals</span><div className="h3 mb-0">{pending.length}</div></CardBody></Card></Col><Col md={4}><Card className={panelCard}><CardBody><span className="text-muted small">Approved this month</span><div className="h3 mb-0">{requests.filter((request) => request.status === "approved").reduce((total, request) => total + request.hours, 0)}h</div></CardBody></Card></Col><Col md={4}><Card className={panelCard}><CardBody><span className="text-muted small">Team requests</span><div className="h3 mb-0">{requests.length}</div></CardBody></Card></Col></Row><Card className={panelCard}><CardBody className="p-4"><div className="d-flex justify-content-between align-items-center mb-3"><div><h5 className="fw-bold mb-1">Overtime Approvals</h5><p className="text-muted small mb-0">Review requests from your team.</p></div>{message && <Alert color="warning" className="py-2 mb-0">{message}</Alert>}</div><Table responsive hover className="align-middle mb-0"><thead><tr><th>Employee</th><th>Date</th><th>Hours</th><th>Rate</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>{requests.length ? requests.map((request) => <tr key={request.id}><td>{request.employeeName || "Employee"}</td><td>{request.date}</td><td>{request.hours}h</td><td>{request.rate}x</td><td>{request.reason}</td><td>{statusBadge(request.status)}</td><td>{request.status === "pending" && <div className="d-flex gap-2"><Button size="sm" color="success" title="Approve" onClick={() => decide(request, true)}><FaCheck /></Button><Button size="sm" color="danger" title="Reject" onClick={() => decide(request, false)}><FaTimes /></Button></div>}</td></tr>) : <tr><td colSpan={7} className="text-muted text-center py-4">No overtime requests found.</td></tr>}</tbody></Table></CardBody></Card></>;
};

export const OvertimeControlPanel = ({ role }: { role: PanelRole }) => <div>{role === "owner" ? <OvertimeSettings /> : role === "manager" ? <ManagerOvertime /> : <EmployeeOvertime />}</div>;
export default OvertimeControlPanel;
