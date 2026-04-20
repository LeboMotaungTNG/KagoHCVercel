import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, Button, Input, Label, FormGroup, Table } from "reactstrap";
import { FaSave, FaEdit, FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaBuilding, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";

// ============================================
// COMPANY DETAILS TAB
// ============================================
const CompanyDetailsTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: "Kago Human Capital",
    size: 45,
    sector: "Technology",
    email: "info@kagohc.com",
    phone: "+27 11 123 4567",
    website: "www.kagohc.com",
    taxId: "1234567890",
    registrationNumber: "2018/123456/07",
    cipcNumber: "K234567890",
    companyStatus: "Active",
    registrationDate: "2018-05-15",
    registrationAuthority: "CIPC (Companies and Intellectual Property Commission)",
    companyType: "Close Corporation",
    address: {
      street: "123 Business Park",
      city: "Johannesburg",
      state: "Gauteng",
      country: "South Africa",
      postalCode: "2196"
    }
  });

  const [formData, setFormData] = useState(companyData);

  const handleSave = () => {
    setCompanyData(formData);
    setIsEditing(false);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Company Details</h3>
        {!isEditing ? (
          <Button color="primary" onClick={() => setIsEditing(true)} style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}>
            <FaEdit size={14} style={{ marginRight: "8px" }} /> Edit Company
          </Button>
        ) : (
          <Button color="success" onClick={handleSave} style={{ borderRadius: "20px" }}>
            <FaSave size={14} style={{ marginRight: "8px" }} /> Save Changes
          </Button>
        )}
      </div>

      <Card style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <CardBody>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#33A6CD", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "48px", fontWeight: "bold" }}>
              {companyData.name.charAt(0)}
            </div>
          </div>

          <Row>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Company Name</Label>
              {isEditing ? (
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.name}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Company Size</Label>
              {isEditing ? (
                <Input type="number" value={formData.size} onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.size} employees</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Sector</Label>
              {isEditing ? (
                <Input value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.sector}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Company Email</Label>
              {isEditing ? (
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.email}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Phone</Label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.phone}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Website</Label>
              {isEditing ? (
                <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.website}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Tax ID / VAT Number</Label>
              {isEditing ? (
                <Input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.taxId}</p>
              )}
            </Col>
          </Row>

          <hr style={{ margin: "24px 0" }} />

          <h5 style={{ marginBottom: "16px" }}>Company Registration Details</h5>
          <Row>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Business Registration Number</Label>
              {isEditing ? (
                <Input value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.registrationNumber}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>CIPC Registration Number</Label>
              {isEditing ? (
                <Input value={formData.cipcNumber} onChange={(e) => setFormData({ ...formData, cipcNumber: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.cipcNumber}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Company Type</Label>
              {isEditing ? (
                <Input type="select" value={formData.companyType} onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}>
                  <option>Close Corporation</option>
                  <option>Proprietary Limited</option>
                  <option>Public Limited</option>
                  <option>Partnership</option>
                  <option>Sole Proprietor</option>
                  <option>Non-Profit Organization</option>
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.companyType}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Company Status</Label>
              {isEditing ? (
                <Input type="select" value={formData.companyStatus} onChange={(e) => setFormData({ ...formData, companyStatus: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Suspended</option>
                  <option>De-registered</option>
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.companyStatus}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Registration Date</Label>
              {isEditing ? (
                <Input type="date" value={formData.registrationDate} onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{new Date(companyData.registrationDate).toLocaleDateString()}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Registration Authority</Label>
              {isEditing ? (
                <Input value={formData.registrationAuthority} onChange={(e) => setFormData({ ...formData, registrationAuthority: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.registrationAuthority}</p>
              )}
            </Col>
          </Row>

          <h5 style={{ marginBottom: "16px" }}>Address</h5>
          <Row>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Street</Label>
              {isEditing ? (
                <Input value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.address.street}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>City</Label>
              {isEditing ? (
                <Input value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.address.city}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>State/Province</Label>
              {isEditing ? (
                <Input value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.address.state}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Country</Label>
              {isEditing ? (
                <Input value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.address.country}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Postal Code</Label>
              {isEditing ? (
                <Input value={formData.address.postalCode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{companyData.address.postalCode}</p>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    </div>
  );
};

// ============================================
// PAYROLL SETTINGS TAB
// ============================================
const PayrollSettingsTab = () => {
  const [payrollSettings, setPayrollSettings] = useState({
    frequency: "Monthly",
    payDay: "25",
    currency: "ZAR",
    taxYear: "2025",
    overtimeRate: "1.5",
    weekendRate: "2.0",
    holidayRate: "2.5",
    uifEnabled: true,
    uifRate: "1",
    sdlEnabled: true,
    sdlRate: "1",
    payeEnabled: true,
    autoGeneratePayslips: true,
    allowSelfServicePayslips: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(payrollSettings);

  const handleSave = () => {
    setPayrollSettings(formData);
    setIsEditing(false);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Payroll Settings</h3>
        {!isEditing ? (
          <Button color="primary" onClick={() => setIsEditing(true)} style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}>
            <FaEdit size={14} style={{ marginRight: "8px" }} /> Edit Payroll Settings
          </Button>
        ) : (
          <Button color="success" onClick={handleSave} style={{ borderRadius: "20px" }}>
            <FaSave size={14} style={{ marginRight: "8px" }} /> Save Changes
          </Button>
        )}
      </div>

      <Card style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <CardBody>
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>General Payroll Settings</h5>
          <Row>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Payroll Frequency</Label>
              {isEditing ? (
                <Input type="select" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                  <option>Weekly</option>
                  <option>Bi-Weekly</option>
                  <option>Monthly</option>
                  <option>Semi-Monthly</option>
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.frequency}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Pay Day</Label>
              {isEditing ? (
                <Input type="select" value={formData.payDay} onChange={(e) => setFormData({ ...formData, payDay: e.target.value })}>
                  {[...Array(31)].map((_, i) => <option key={i+1}>{i+1}</option>)}
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.payDay} of each month</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Currency</Label>
              {isEditing ? (
                <Input type="select" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                  <option>ZAR - South African Rand</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.currency}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Current Tax Year</Label>
              {isEditing ? (
                <Input type="select" value={formData.taxYear} onChange={(e) => setFormData({ ...formData, taxYear: e.target.value })}>
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.taxYear}</p>
              )}
            </Col>
          </Row>

          <hr style={{ margin: "24px 0" }} />

          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Overtime & Holiday Rates</h5>
          <Row>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Overtime Rate (x)</Label>
              {isEditing ? (
                <Input type="number" step="0.1" value={formData.overtimeRate} onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.overtimeRate}x</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Weekend Rate (x)</Label>
              {isEditing ? (
                <Input type="number" step="0.1" value={formData.weekendRate} onChange={(e) => setFormData({ ...formData, weekendRate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.weekendRate}x</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Public Holiday Rate (x)</Label>
              {isEditing ? (
                <Input type="number" step="0.1" value={formData.holidayRate} onChange={(e) => setFormData({ ...formData, holidayRate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.holidayRate}x</p>
              )}
            </Col>
          </Row>

          <hr style={{ margin: "24px 0" }} />

          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Statutory Contributions (South Africa)</h5>
          <Row>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>UIF (Unemployment Insurance Fund)</Label>
              {isEditing ? (
                <div>
                  <Input type="checkbox" checked={formData.uifEnabled} onChange={(e) => setFormData({ ...formData, uifEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
                  <span>Enable UIF</span>
                  <Input type="number" step="0.1" value={formData.uifRate} onChange={(e) => setFormData({ ...formData, uifRate: e.target.value })} style={{ marginTop: "8px" }} disabled={!formData.uifEnabled} />
                </div>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.uifEnabled ? `Enabled (${payrollSettings.uifRate}%)` : "Disabled"}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>SDL (Skills Development Levy)</Label>
              {isEditing ? (
                <div>
                  <Input type="checkbox" checked={formData.sdlEnabled} onChange={(e) => setFormData({ ...formData, sdlEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
                  <span>Enable SDL</span>
                  <Input type="number" step="0.1" value={formData.sdlRate} onChange={(e) => setFormData({ ...formData, sdlRate: e.target.value })} style={{ marginTop: "8px" }} disabled={!formData.sdlEnabled} />
                </div>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.sdlEnabled ? `Enabled (${payrollSettings.sdlRate}%)` : "Disabled"}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>PAYE (Pay As You Earn)</Label>
              {isEditing ? (
                <div>
                  <Input type="checkbox" checked={formData.payeEnabled} onChange={(e) => setFormData({ ...formData, payeEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
                  <span>Enable PAYE</span>
                </div>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.payeEnabled ? "Enabled" : "Disabled"}</p>
              )}
            </Col>
          </Row>

          <hr style={{ margin: "24px 0" }} />

          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Payslip Settings</h5>
          <Row>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Auto-generate payslips</Label>
              {isEditing ? (
                <Input type="checkbox" checked={formData.autoGeneratePayslips} onChange={(e) => setFormData({ ...formData, autoGeneratePayslips: e.target.checked })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.autoGeneratePayslips ? "Yes" : "No"}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Allow employee self-service payslips</Label>
              {isEditing ? (
                <Input type="checkbox" checked={formData.allowSelfServicePayslips} onChange={(e) => setFormData({ ...formData, allowSelfServicePayslips: e.target.checked })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.allowSelfServicePayslips ? "Yes" : "No"}</p>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    </div>
  );
};

// ============================================
// LEAVE SETTINGS TAB - LEAVE RULE COMPONENTS
// ============================================

// Styles for leave tables
const thStyle: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
  color: "#4A5568",
  borderBottom: "1px solid #CBD5E0",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  fontSize: "12px",
  color: "#2D3748",
  borderBottom: "1px solid #EDF2F7",
  verticalAlign: "top",
};

// Leave Rule Types
interface LeaveCycle {
  id: string;
  cycleStartDate: string;
  cycleLength: string;
  cycleRecurs: string;
  entitlementValue: string;
  leaveAccrual: string;
  balanceAtEndOfCycle: string;
  leaveTakenOrder: number;
  allowExceed: "allow_without_warning" | "allow_with_warning" | "do_not_allow";
}

interface LeaveRule {
  id: string;
  name: string;
  description: string;
  cycles: LeaveCycle[];
}

// Leave Cycle Row Component
const LeaveCycleRow = ({ cycle, ruleName, onUpdate }: { cycle: LeaveCycle; ruleName: string; onUpdate: (updatedCycle: LeaveCycle) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCycle, setEditedCycle] = useState(cycle);

  const getAllowExceedText = (value: string) => {
    switch (value) {
      case "allow_without_warning": return "Allow without a warning";
      case "allow_with_warning": return "Allow with warning";
      case "do_not_allow": return "Do not allow";
      default: return value;
    }
  };

  const handleSave = () => {
    onUpdate(editedCycle);
    setIsEditing(false);
  };

  return (
    <div style={{ marginBottom: "16px", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "#F7FAFC",
          cursor: "pointer",
          borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
          <span style={{ fontWeight: 600, fontSize: "14px" }}>{ruleName} - Cycle {cycle.leaveTakenOrder || "Default"}</span>
          <span style={{ fontSize: "12px", color: "#718096" }}>Leave Taken Order: {cycle.leaveTakenOrder}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {!isEditing ? (
            <Button bsSize="sm" color="link" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ padding: "4px" }}>
              <FaEdit size={14} color="#3182CE" />
            </Button>
          ) : (
            <Button bsSize="sm" color="link" onClick={(e) => { e.stopPropagation(); handleSave(); }} style={{ padding: "4px" }}>
              <FaSave size={14} color="#48BB78" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: "16px", backgroundColor: "white", overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#EDF2F7" }}>
                <th style={thStyle}>Cycle Start Date</th>
                <th style={thStyle}>Cycle Length</th>
                <th style={thStyle}>Cycle Recurs</th>
                <th style={thStyle}>Entitlement Value</th>
                <th style={thStyle}>Leave Accrual</th>
                <th style={thStyle}>Balance at End</th>
                <th style={thStyle}>Leave Taken Order</th>
                <th style={thStyle}>Allow Exceed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.cycleStartDate} onChange={(e) => setEditedCycle({ ...editedCycle, cycleStartDate: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.cycleStartDate}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.cycleLength} onChange={(e) => setEditedCycle({ ...editedCycle, cycleLength: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.cycleLength || "-"}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.cycleRecurs} onChange={(e) => setEditedCycle({ ...editedCycle, cycleRecurs: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.cycleRecurs || "-"}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.entitlementValue} onChange={(e) => setEditedCycle({ ...editedCycle, entitlementValue: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.entitlementValue || "-"}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.leaveAccrual} onChange={(e) => setEditedCycle({ ...editedCycle, leaveAccrual: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.leaveAccrual || "-"}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="text" value={editedCycle.balanceAtEndOfCycle} onChange={(e) => setEditedCycle({ ...editedCycle, balanceAtEndOfCycle: e.target.value })} bsSize="sm" /> : <span style={{ fontSize: "12px" }}>{cycle.balanceAtEndOfCycle || "-"}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="number" value={editedCycle.leaveTakenOrder} onChange={(e) => setEditedCycle({ ...editedCycle, leaveTakenOrder: parseInt(e.target.value) })} bsSize="sm" style={{ width: "60px" }} /> : <span style={{ fontSize: "12px", fontWeight: 600 }}>{cycle.leaveTakenOrder}</span>}</td>
                <td style={tdStyle}>{isEditing ? <Input type="select" value={editedCycle.allowExceed} onChange={(e) => setEditedCycle({ ...editedCycle, allowExceed: e.target.value as any })} bsSize="sm"><option value="allow_without_warning">Allow without a warning</option><option value="allow_with_warning">Allow with warning</option><option value="do_not_allow">Do not allow</option></Input> : <span style={{ fontSize: "12px" }}>{getAllowExceedText(cycle.allowExceed)}</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Leave Rule Card Component
const LeaveRuleCard = ({ rule, onUpdateCycle }: { rule: LeaveRule; onUpdateCycle: (ruleId: string, updatedCycle: LeaveCycle) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card style={{ marginBottom: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: isExpanded ? "1px solid #E2E8F0" : "none", paddingBottom: isExpanded ? "16px" : "0", marginBottom: isExpanded ? "16px" : "0" }} onClick={() => setIsExpanded(!isExpanded)}>
          <div>
            <h4 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#2D3748" }}>{rule.name}</h4>
            <p style={{ fontSize: "13px", color: "#718096", margin: "4px 0 0 0" }}>{rule.description}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#718096" }}>{rule.cycles.length} cycle(s)</span>
            {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
          </div>
        </div>

        {isExpanded && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h5 style={{ fontSize: "14px", fontWeight: 600, color: "#4A5568" }}>Leave Cycles</h5>
                <Button bsSize="sm" style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}><FaPlus size={12} style={{ marginRight: "4px" }} /> Add Cycle</Button>
              </div>
              {rule.cycles.map((cycle) => (<LeaveCycleRow key={cycle.id} cycle={cycle} ruleName={rule.name} onUpdate={(updatedCycle) => onUpdateCycle(rule.id, updatedCycle)} />))}
            </div>
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #E2E8F0" }}>
              <Label style={{ fontSize: "13px", fontWeight: 600, color: "#4A5568" }}>Description</Label>
              <Input type="textarea" rows={2} defaultValue={rule.description} placeholder="Enter leave rule description..." />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Main Leave Settings Tab Component
const LeaveSettingsTab = () => {
  const mockLeaveRules: LeaveRule[] = [
    { id: "1", name: "Annual Leave", description: "Standard annual leave policy per BCEA", cycles: [
      { id: "1-1", cycleStartDate: "The employees' leave start date", cycleLength: "1 year", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Period entitlement is accrued at the start of each month", balanceAtEndOfCycle: "The balance will be transferred to rule 'Annual Leave 6 months remaining'", leaveTakenOrder: 2, allowExceed: "allow_without_warning" },
      { id: "1-2", cycleStartDate: "Start date of rule 'Annual Leave'", cycleLength: "6 months", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be transferred to rule 'Annual Leave excess'", leaveTakenOrder: 1, allowExceed: "allow_without_warning" },
      { id: "1-3", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "", balanceAtEndOfCycle: "", leaveTakenOrder: 0, allowExceed: "allow_without_warning" }
    ]},
    { id: "2", name: "Sick Leave", description: "Sick leave policy per BCEA guidelines", cycles: [
      { id: "2-1", cycleStartDate: "The employees' leave start date", cycleLength: "6 months", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Period entitlement is accrued at the start of each month", balanceAtEndOfCycle: "The balance will be transferred to rule 'Sick Leave remaining 30 months'", leaveTakenOrder: 3, allowExceed: "allow_without_warning" },
      { id: "2-2", cycleStartDate: "Start date of rule 'Sick Leave first 6 months' plus 6 months", cycleLength: "30 months", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 2, allowExceed: "allow_without_warning" },
      { id: "2-3", cycleStartDate: "Start date of rule 'Sick Leave remaining 30 months' plus 30 months", cycleLength: "3 years", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_without_warning" }
    ]},
    { id: "3", name: "Family Leave", description: "Family responsibility leave", cycles: [
      { id: "3-1", cycleStartDate: "The employees' leave start date plus 4 months", cycleLength: "8 months", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 2, allowExceed: "allow_with_warning" },
      { id: "3-2", cycleStartDate: "Start date of rule 'Family Leave first year' plus 8 months", cycleLength: "1 year", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_with_warning" }
    ]},
    { id: "4", name: "Maternity Leave", description: "Maternity leave policy (4 months)", cycles: [{ id: "4-1", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_without_warning" }]},
    { id: "5", name: "Parental Leave", description: "Parental leave policy (10 days)", cycles: [{ id: "5-1", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_without_warning" }]},
    { id: "6", name: "Adoption Leave", description: "Adoption leave policy", cycles: [{ id: "6-1", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_without_warning" }]},
    { id: "7", name: "Commissioning Parental Leave", description: "Commissioning parental leave for surrogacy", cycles: [{ id: "7-1", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "The balance will be cleared", leaveTakenOrder: 1, allowExceed: "allow_without_warning" }]},
    { id: "8", name: "Study Leave", description: "Study leave for examinations", cycles: [{ id: "8-1", cycleStartDate: "This cycle has no start value", cycleLength: "", cycleRecurs: "", entitlementValue: "", leaveAccrual: "Cycle entitlement is accrued at the start of the leave cycle", balanceAtEndOfCycle: "", leaveTakenOrder: 0, allowExceed: "allow_without_warning" }]}
  ];

  const [leaveRules, setLeaveRules] = useState<LeaveRule[]>(mockLeaveRules);
  const [searchTerm, setSearchTerm] = useState("");

  const handleUpdateCycle = (ruleId: string, updatedCycle: LeaveCycle) => {
    setLeaveRules((prev) => prev.map((rule) => rule.id === ruleId ? { ...rule, cycles: rule.cycles.map((cycle) => cycle.id === updatedCycle.id ? updatedCycle : cycle) } : rule));
  };

  const filteredRules = leaveRules.filter((rule) => rule.name.toLowerCase().includes(searchTerm.toLowerCase()) || rule.description.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Leave Setup</h3>
          <p style={{ fontSize: "14px", color: "#718096", margin: "4px 0 0 0" }}>Use the leave module in this company (no additional cost)</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Input type="text" placeholder="Search leave rules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "250px", borderRadius: "20px" }} />
          <Button style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px", padding: "8px 20px" }}><FaPlus size={14} style={{ marginRight: "8px" }} /> Add Leave Rule</Button>
        </div>
      </div>

      {filteredRules.map((rule) => (<LeaveRuleCard key={rule.id} rule={rule} onUpdateCycle={handleUpdateCycle} />))}

      <div style={{ marginTop: "32px", padding: "16px", backgroundColor: "#F0FFF4", borderRadius: "8px", borderLeft: "4px solid #48BB78" }}>
        <strong style={{ fontSize: "14px", color: "#2D3748" }}>Leave Policy Summary</strong>
        <p style={{ fontSize: "12px", color: "#718096", margin: "4px 0 0 0" }}>Total Leave Rules: {leaveRules.length} | Total Cycles: {leaveRules.reduce((acc, rule) => acc + rule.cycles.length, 0)}</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN ORGANIZATION SETTINGS PAGE
// ============================================
export const OrganizationSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<"company" | "payroll" | "leave">("company");

  const tabStyle = (isActive: boolean) => ({
    padding: "12px 24px",
    backgroundColor: isActive ? "#33A6CD" : "transparent",
    color: isActive ? "white" : "#4A5568",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  });

  return (
    <div className="w-100" style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("company")} style={tabStyle(activeTab === "company")}>
          <FaBuilding size={16} /> Company Details
        </button>
        <button onClick={() => setActiveTab("payroll")} style={tabStyle(activeTab === "payroll")}>
          <FaMoneyBillWave size={16} /> Payroll
        </button>
        <button onClick={() => setActiveTab("leave")} style={tabStyle(activeTab === "leave")}>
          <FaCalendarAlt size={16} /> Leave
        </button>
      </div>

      {activeTab === "company" && <CompanyDetailsTab />}
      {activeTab === "payroll" && <PayrollSettingsTab />}
      {activeTab === "leave" && <LeaveSettingsTab />}
    </div>
  );
};

