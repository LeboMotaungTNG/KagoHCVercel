import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { FaClock, FaEdit, FaSave } from "react-icons/fa";
import {
  DEFAULT_OVERTIME_SETTINGS,
  type OvertimeSettings,
  orgApi,
} from "../../shared/utils/organizationSettings";

type PanelRole = "owner" | "manager" | "employee";

const panelCard = "border-0 shadow-sm rounded-4 mb-4";

const OvertimeSettingsPanel = () => {
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
  return (
    <Card className={panelCard}>
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1"><FaClock className="text-info me-2" /> Overtime Rules</h5>
            <p className="text-muted small mb-0">Rules used when overtime is requested and calculated.</p>
          </div>
          {!editing ? (
            <Button color="outline-info" onClick={() => setEditing(true)}><FaEdit className="me-2" /> Edit</Button>
          ) : (
            <div className="d-flex gap-2">
              <Button color="secondary" outline onClick={() => setEditing(false)}>Cancel</Button>
              <Button color="success" disabled={saving} onClick={save}>{saving ? <Spinner size="sm" /> : <FaSave className="me-2" />} Save</Button>
            </div>
          )}
        </div>
        {message && <Alert color={message.includes("saved") ? "success" : "warning"} className="py-2">{message}</Alert>}
        <Row className="g-3">
          {([['standardHoursPerDay', 'Standard hours per day', 1, 24, 1], ['overtimeRate', 'Overtime rate (x)', 1, 5, 0.1], ['weekendRate', 'Weekend rate (x)', 1, 5, 0.1], ['holidayRate', 'Holiday rate (x)', 1, 5, 0.1], ['approvalThreshold', 'Approval threshold (hours)', 0, 24, 0.5], ['maxOvertimePerDay', 'Max overtime per day', 0, 24, 0.5]] as const).map(([key, label, min, max, step]) => (
            <Col md={4} key={key}>
              <FormGroup>
                <Label className="small text-muted fw-bold">{label}</Label>
                {editing ? (
                  <Input type="number" min={min} max={max} step={step} value={settings[key]} onChange={(event) => update(key, Number(event.target.value))} />
                ) : (
                  <p className="h6 fw-normal mt-1">{settings[key]}{key.includes("Rate") ? "x" : ""}</p>
                )}
              </FormGroup>
            </Col>
          ))}
          <Col md={4}>
            <FormGroup>
              <Label className="small text-muted fw-bold">Overtime approval</Label>
              {editing ? (
                <Input type="select" value={settings.approvalRequired ? "yes" : "no"} onChange={(event) => update("approvalRequired", event.target.value === "yes")}>
                  <option value="yes">Required</option>
                  <option value="no">Not required</option>
                </Input>
              ) : (
                <p className="h6 fw-normal mt-1">{settings.approvalRequired ? "Required" : "Not required"}</p>
              )}
            </FormGroup>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export const OvertimeControlPanel = ({ role }: { role: PanelRole }) => (
  <div>{role === "owner" ? <OvertimeSettingsPanel /> : null}</div>
);
export default OvertimeControlPanel;
