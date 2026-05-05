import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Button, Input, Label, FormGroup, Table, Spinner } from "reactstrap";
import { FaSave, FaEdit, FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaBuilding, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

// ============================================
// COMPANY DETAILS TAB (ENHANCED VERSION - FIXED)
// ============================================
const CompanyDetailsTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    // Basic Information
    name: "Kago Human Capital",
    size: 45,
    sector: "Technology",
    email: "info@kagohc.com",
    phone: "+27 11 123 4567",
    alternativePhone: "+27 11 123 4568",
    website: "www.kagohc.com",
    fax: "+27 11 123 4569",
    
    // Registration & Legal
    taxId: "1234567890",
    registrationNumber: "2020/123456/07",
    vatNumber: "4123456789",
    uifReference: "UIF123456789",
    sdlReference: "SDL123456789",
    workInjuryFundRef: "WIF123456789",
    
    // Banking Information
    bank: {
      bankName: "First National Bank",
      accountName: "Kago Human Capital",
      accountNumber: "62812345678",
      branchCode: "250655",
      accountType: "Business Cheque",
      swiftCode: "FIRNZAJJ"
    },
    
    // Contact Persons
    contacts: {
      ceo: {
        name: "Thabo Mbeki",
        email: "thabo@kagohc.com",
        phone: "+27 82 123 4567"
      },
      finance: {
        name: "Naledi Dlamini",
        email: "naledi@kagohc.com",
        phone: "+27 83 123 4567"
      },
      payroll: {
        name: "Peter Petersen",
        email: "peter@kagohc.com",
        phone: "+27 84 123 4567"
      }
    },
    
    // Address
    address: {
      street: "123 Business Park",
      city: "Johannesburg",
      state: "Gauteng",
      country: "South Africa",
      postalCode: "2196",
      physicalAddress: "123 Business Park, Sandton, Johannesburg",
      postalAddress: "PO Box 1234, Sandton, 2196"
    },
    
    // Business Classification
    businessType: "Private Company",
    industry: "Human Capital & Recruitment",
    yearsInOperation: 8,
    blackOwnership: 51,
    womenOwnership: 35,
    youthOwnership: 20,
    bbbeeLevel: "Level 2",
    
    // SARS & Tax Information
    sarsBranch: "Sandton",
    incomeTaxNumber: "9876543210",
    payeReference: "PAYE123456789",
    provisionalTaxpayer: true,
    taxComplianceStatus: "Compliant",
    
    // Additional Settings
    language: "English",
    timezone: "Africa/Johannesburg",
    dateFormat: "DD/MM/YYYY",
    fiscalYearStart: "2025-03-01",
    fiscalYearEnd: "2026-02-28",
    
    // Status
    status: "Active",
    verified: true,
    lastAuditDate: "2025-01-15"
  });

  const [formData, setFormData] = useState(companyData);

  // Fetch company data from API on component mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/owner/company/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data) {
          // Merge API data with defaults to ensure all nested objects exist
          const mergedData = {
            ...companyData,
            ...data.data,
            bank: { ...companyData.bank, ...data.data.bank },
            contacts: { ...companyData.contacts, ...data.data.contacts },
            address: { ...companyData.address, ...data.data.address }
          };
          setCompanyData(mergedData);
          setFormData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
        // Keep using default mock data on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyData();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/owner/company/settings`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setCompanyData(formData);
        setIsEditing(false);
        alert("Company details saved successfully!");
      } else {
        alert("Error saving company details");
      }
    } catch (error) {
      console.error("Error saving company data:", error);
      alert("Error saving company details");
    }
  };

  // Helper function to get nested value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  };

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any): any => {
    const parts = path.split('.');
    const newObj = { ...obj };
    let current = newObj;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return newObj;
  };

  // Helper function to render editable fields
  const renderField = (label: string, value: any, fieldPath: string, type: "text" | "email" | "number" | "date" | "checkbox" | "select" | "textarea" = "text") => {
    const currentValue = getNestedValue(formData, fieldPath) || "";
    
    return (
      <Col md={6} key={fieldPath}>
        <Label style={{ fontWeight: 600 }}>{label}</Label>
        {isEditing ? (
          type === "textarea" ? (
            <textarea 
              rows={3}
              value={currentValue} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, e.target.value))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E0", fontSize: "14px", resize: "vertical", minHeight: "80px" }}
              className="form-control"
            />
          ) : type === "number" ? (
            <Input 
              type="number" 
              value={currentValue} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, parseInt(e.target.value) || 0))}
            />
          ) : type === "date" ? (
            <Input 
              type="date" 
              value={currentValue} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, e.target.value))}
            />
          ) : type === "checkbox" ? (
            <input 
              type="checkbox" 
              checked={currentValue === true || currentValue === "true"} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, e.target.checked))}
              style={{ width: "auto", marginTop: "8px" }}
              className="form-check-input"
            />
          ) : type === "select" ? (
            <select 
              value={currentValue} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, e.target.value))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E0", fontSize: "14px" }}
              className="form-control"
            >
              {label === "Business Type" && (
                <>
                  <option>Private Company</option>
                  <option>Public Company</option>
                  <option>Non-Profit Organisation</option>
                  <option>Trust</option>
                  <option>Partnership</option>
                  <option>Sole Proprietor</option>
                </>
              )}
              {label === "Industry" && (
                <>
                  <option>Technology</option>
                  <option>Human Capital & Recruitment</option>
                  <option>Finance</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Construction</option>
                </>
              )}
              {label === "Language" && (
                <>
                  <option>English</option>
                  <option>Afrikaans</option>
                  <option>isiZulu</option>
                  <option>isiXhosa</option>
                  <option>Sepedi</option>
                  <option>Setswana</option>
                  <option>Other</option>
                </>
              )}
              {label === "Timezone" && (
                <>
                  <option>Africa/Johannesburg</option>
                  <option>Africa/Cape Town</option>
                  <option>Africa/Durban</option>
                </>
              )}
              {label === "Date Format" && (
                <>
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </>
              )}
              {label === "Account Type" && (
                <>
                  <option>Business Cheque</option>
                  <option>Business Savings</option>
                  <option>Business Current</option>
                </>
              )}
              {label === "Status" && (
                <>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Suspended</option>
                  <option>Pending Verification</option>
                </>
              )}
              {label === "Bank Name" && (
                <>
                  <option>First National Bank</option>
                  <option>Standard Bank</option>
                  <option>Absa</option>
                  <option>Nedbank</option>
                  <option>Capitec</option>
                  <option>Discovery Bank</option>
                </>
              )}
            </select>
          ) : (

            <Input 
              type={type} 
              value={currentValue} 
              onChange={(e) => setFormData(setNestedValue(formData, fieldPath, e.target.value))}
            />
          )
        ) : (
          <p style={{ marginTop: "8px" }}>
            {type === "checkbox" ? (currentValue ? "Yes" : "No") : (currentValue || "-")}
          </p>
        )}
      </Col>
    );
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
          {isLoading && (
            <div style={{ textAlign: "center", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <Spinner color="primary" />
              <p style={{ color: "#667085" }}>Loading company data...</p>
            </div>
          )}
          {!isLoading && (
          <>
          {/* Company Logo & Basic Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#33A6CD", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "48px", fontWeight: "bold" }}>
              {(companyData?.name || "K").charAt(0)}
            </div>
            {isEditing && (
              <Button bsSize="sm" variant="outline" style={{ borderColor: "#33A6CD", color: "#33A6CD" }}>
                Upload Logo
              </Button>
            )}
          </div>

          {/* Basic Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Basic Information</h5>
          <Row>
            {renderField("Company Name", companyData.name, "name")}
            {renderField("Company Size", companyData.size, "size", "number")}
            {renderField("Sector/Industry", companyData.sector, "sector", "select")}
            {renderField("Business Type", companyData.businessType, "businessType", "select")}
            {renderField("Years in Operation", companyData.yearsInOperation, "yearsInOperation", "number")}
            {renderField("Company Email", companyData.email, "email", "email")}
            {renderField("Phone Number", companyData.phone, "phone")}
            {renderField("Alternative Phone", companyData.alternativePhone, "alternativePhone")}
            {renderField("Fax Number", companyData.fax, "fax")}
            {renderField("Website", companyData.website, "website")}
            {renderField("Language", companyData.language, "language", "select")}
            {renderField("Timezone", companyData.timezone, "timezone", "select")}
            {renderField("Date Format", companyData.dateFormat, "dateFormat", "select")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* Registration & Legal Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Registration & Legal Information</h5>
          <Row>
            {renderField("Registration Number (CIPC)", companyData.registrationNumber, "registrationNumber")}
            {renderField("Tax ID / VAT Number", companyData.taxId, "taxId")}
            {renderField("VAT Number", companyData.vatNumber, "vatNumber")}
            {renderField("UIF Reference", companyData.uifReference, "uifReference")}
            {renderField("SDL Reference", companyData.sdlReference, "sdlReference")}
            {renderField("Work Injury Fund Ref", companyData.workInjuryFundRef, "workInjuryFundRef")}
            {renderField("Income Tax Number", companyData.incomeTaxNumber, "incomeTaxNumber")}
            {renderField("PAYE Reference", companyData.payeReference, "payeReference")}
            {renderField("SARS Branch", companyData.sarsBranch, "sarsBranch")}
            {renderField("Provisional Taxpayer", companyData.provisionalTaxpayer, "provisionalTaxpayer", "checkbox")}
            {renderField("Tax Compliance Status", companyData.taxComplianceStatus, "taxComplianceStatus")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* B-BBEE Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>B-BBEE Information</h5>
          <Row>
            {renderField("Black Ownership %", companyData.blackOwnership, "blackOwnership", "number")}
            {renderField("Women Ownership %", companyData.womenOwnership, "womenOwnership", "number")}
            {renderField("Youth Ownership %", companyData.youthOwnership, "youthOwnership", "number")}
            {renderField("B-BBEE Level", companyData.bbbeeLevel, "bbbeeLevel")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* Banking Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Banking Information</h5>
          <Row>
            {renderField("Bank Name", companyData?.bank?.bankName || "", "bank.bankName", "select")}
            {renderField("Account Name", companyData?.bank?.accountName || "", "bank.accountName")}
            {renderField("Account Number", companyData?.bank?.accountNumber || "", "bank.accountNumber")}
            {renderField("Branch Code", companyData?.bank?.branchCode || "", "bank.branchCode")}
            {renderField("Account Type", companyData?.bank?.accountType || "", "bank.accountType", "select")}
            {renderField("SWIFT Code", companyData?.bank?.swiftCode || "", "bank.swiftCode")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* Contact Persons */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Key Contact Persons</h5>
          <h6 style={{ fontSize: "14px", marginBottom: "12px", color: "#4A5568" }}>CEO / Managing Director</h6>
          <Row>
            {renderField("CEO Name", companyData.contacts.ceo.name, "contacts.ceo.name")}
            {renderField("CEO Email", companyData.contacts.ceo.email, "contacts.ceo.email", "email")}
            {renderField("CEO Phone", companyData.contacts.ceo.phone, "contacts.ceo.phone")}
          </Row>
          <div style={{ marginTop: "12px" }} />
          <h6 style={{ fontSize: "14px", marginBottom: "12px", color: "#4A5568" }}>Finance Director / CFO</h6>
          <Row>
            {renderField("Finance Name", companyData.contacts.finance.name, "contacts.finance.name")}
            {renderField("Finance Email", companyData.contacts.finance.email, "contacts.finance.email", "email")}
            {renderField("Finance Phone", companyData.contacts.finance.phone, "contacts.finance.phone")}
          </Row>
          <div style={{ marginTop: "12px" }} />
          <h6 style={{ fontSize: "14px", marginBottom: "12px", color: "#4A5568" }}>Payroll Manager</h6>
          <Row>
            {renderField("Payroll Name", companyData.contacts.payroll.name, "contacts.payroll.name")}
            {renderField("Payroll Email", companyData.contacts.payroll.email, "contacts.payroll.email", "email")}
            {renderField("Payroll Phone", companyData.contacts.payroll.phone, "contacts.payroll.phone")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* Address Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Address Information</h5>
          <Row>
            {renderField("Physical Address", companyData.address.physicalAddress, "address.physicalAddress", "textarea")}
            {renderField("Postal Address", companyData.address.postalAddress, "address.postalAddress", "textarea")}
            {renderField("Street", companyData.address.street, "address.street")}
            {renderField("City", companyData.address.city, "address.city")}
            {renderField("Province", companyData.address.state, "address.state")}
            {renderField("Country", companyData.address.country, "address.country")}
            {renderField("Postal Code", companyData.address.postalCode, "address.postalCode")}
          </Row>

          <hr style={{ margin: "24px 0" }} />

          {/* Fiscal & Status Information */}
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>Fiscal Year & Status</h5>
          <Row>
            {renderField("Fiscal Year Start", companyData.fiscalYearStart, "fiscalYearStart", "date")}
            {renderField("Fiscal Year End", companyData.fiscalYearEnd, "fiscalYearEnd", "date")}
            {renderField("Company Status", companyData.status, "status", "select")}
            {renderField("Verification Status", companyData.verified, "verified", "checkbox")}
            {renderField("Last Audit Date", companyData.lastAuditDate, "lastAuditDate", "date")}
          </Row>
          </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

// ============================================
// PAYROLL SETTINGS & PROCESSING TAB (COMPLETE VERSION)
// ============================================

// Mock Data Interfaces for Backend Integration
interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  position: string;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  bankAccount: string;
  taxReference: string;
  uifReference: string;
  joinDate: string;
  status: "active" | "on_leave" | "terminated";
}

interface PayrollRun {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  frequency: "Weekly" | "Bi-Weekly" | "Monthly";
  status: "draft" | "attendance_imported" | "calculated" | "approved" | "reports_generated" | "submitted";
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  submissionReceipt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollCalculation {
  id: string;
  payrollRunId: string;
  employeeId: string;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
    total: number;
  };
  overtime: {
    hours: number;
    rate: number;
    amount: number;
  };
  commissions: number;
  grossEarnings: number;
  deductions: {
    paye: number;
    uif: number;
    sdl: number;
    pension: number;
    medicalAid: number;
    other: number;
    total: number;
  };
  netPay: number;
  employerCosts: {
    uif: number;
    sdl: number;
    skillsLevy: number;
    total: number;
  };
}

// Mock Data
const mockEmployees: Employee[] = [
  {
    id: "EMP001",
    employeeCode: "KHC001",
    name: "John Doe",
    department: "Engineering",
    position: "Senior Developer",
    basicSalary: 35000,
    allowances: { housing: 5000, transport: 2000, medical: 1500, other: 0 },
    bankAccount: "1234567890",
    taxReference: "1234567890",
    uifReference: "UIF001",
    joinDate: "2023-01-15",
    status: "active"
  },
  {
    id: "EMP002",
    employeeCode: "KHC002",
    name: "Jane Smith",
    department: "Sales",
    position: "Sales Manager",
    basicSalary: 45000,
    allowances: { housing: 7000, transport: 3000, medical: 2000, other: 1000 },
    bankAccount: "0987654321",
    taxReference: "0987654321",
    uifReference: "UIF002",
    joinDate: "2022-06-01",
    status: "active"
  },
  {
    id: "EMP003",
    employeeCode: "KHC003",
    name: "Pieter van der Merwe",
    department: "Operations",
    position: "Operations Manager",
    basicSalary: 40000,
    allowances: { housing: 6000, transport: 2500, medical: 1800, other: 500 },
    bankAccount: "1122334455",
    taxReference: "1122334455",
    uifReference: "UIF003",
    joinDate: "2023-03-10",
    status: "active"
  },
  {
    id: "EMP004",
    employeeCode: "KHC004",
    name: "Sarah Williams",
    department: "HR",
    position: "HR Specialist",
    basicSalary: 30000,
    allowances: { housing: 4000, transport: 1500, medical: 1200, other: 0 },
    bankAccount: "5566778899",
    taxReference: "5566778899",
    uifReference: "UIF004",
    joinDate: "2023-08-20",
    status: "active"
  }
];

const PayrollSettingsTab = () => {
  // ========== SETTINGS STATE ==========
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

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState(payrollSettings);

  // ========== PROCESSING STATE ==========
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([
    {
      id: "PR-2025-03",
      period: "March 2025",
      periodStart: "2025-03-01",
      periodEnd: "2025-03-31",
      frequency: "Monthly",
      status: "draft",
      employeeCount: mockEmployees.length,
      totalGross: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      createdAt: "2025-02-28T10:00:00Z",
      updatedAt: "2025-02-28T10:00:00Z"
    }
  ]);
  
  const [activePayrollRun, setActivePayrollRun] = useState<PayrollRun | null>(null);
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showExceptionsModal, setShowExceptionsModal] = useState(false);
  const [exceptionsList, setExceptionsList] = useState<string[]>([]);
  const [showPayrollRunModal, setShowPayrollRunModal] = useState(false);
  const [newRunPeriod, setNewRunPeriod] = useState("");
  const [newRunFrequency, setNewRunFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Monthly");

  // Styles
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

  // ========== SETTINGS HANDLERS ==========
  const handleSaveSettings = () => {
    setPayrollSettings(settingsFormData);
    setIsEditingSettings(false);
  };

  // ========== PROCESSING HANDLERS ==========
  
  const startNewPayrollRun = () => {
    if (!newRunPeriod) {
      alert("Please enter a period name (e.g., April 2025)");
      return;
    }
    
    const newRun: PayrollRun = {
      id: `PR-${Date.now()}`,
      period: newRunPeriod,
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
      frequency: newRunFrequency,
      status: "draft",
      employeeCount: mockEmployees.length,
      totalGross: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setPayrollRuns([newRun, ...payrollRuns]);
    setActivePayrollRun(newRun);
    setShowPayrollRunModal(false);
    setNewRunPeriod("");
  };

  const importAttendanceData = () => {
    if (!activePayrollRun) return;
    setActivePayrollRun({ 
      ...activePayrollRun, 
      status: "attendance_imported",
      updatedAt: new Date().toISOString()
    });
  };

  const calculatePayroll = () => {
    if (!activePayrollRun) return;
    
    const calculatePAYE = (annualTaxable: number): number => {
      if (annualTaxable <= 237100) return annualTaxable * 0.18;
      if (annualTaxable <= 370500) return 42678 + (annualTaxable - 237100) * 0.26;
      if (annualTaxable <= 512800) return 77362 + (annualTaxable - 370500) * 0.31;
      if (annualTaxable <= 673000) return 121475 + (annualTaxable - 512800) * 0.36;
      if (annualTaxable <= 857900) return 179147 + (annualTaxable - 673000) * 0.39;
      if (annualTaxable <= 1817000) return 251258 + (annualTaxable - 857900) * 0.41;
      return 644389 + (annualTaxable - 1817000) * 0.45;
    };

    const overtimeMultiplier = parseFloat(payrollSettings.overtimeRate);
    
    const calculations: PayrollCalculation[] = mockEmployees.map(emp => {
      const totalAllowances = emp.allowances.housing + emp.allowances.transport + emp.allowances.medical + emp.allowances.other;
      const overtimeHours = 5;
      const overtimeAmount = overtimeHours * (emp.basicSalary / 160) * overtimeMultiplier;
      const commissions = emp.department === "Sales" ? emp.basicSalary * 0.02 : 0;
      const grossEarnings = emp.basicSalary + totalAllowances + overtimeAmount + commissions;
      const annualTaxable = grossEarnings * 12;
      const annualPAYE = calculatePAYE(annualTaxable);
      const paye = payrollSettings.payeEnabled ? Math.round(annualPAYE / 12) : 0;
      const uifEmployee = payrollSettings.uifEnabled ? Math.min(grossEarnings * (parseFloat(payrollSettings.uifRate) / 100), 177.12) : 0;
      const sdl = payrollSettings.sdlEnabled ? grossEarnings * (parseFloat(payrollSettings.sdlRate) / 100) : 0;
      const totalDeductions = paye + uifEmployee + sdl;
      const netPay = grossEarnings - totalDeductions;
      
      return {
        id: `CALC-${activePayrollRun.id}-${emp.id}`,
        payrollRunId: activePayrollRun.id,
        employeeId: emp.id,
        basicSalary: emp.basicSalary,
        allowances: {
          housing: emp.allowances.housing,
          transport: emp.allowances.transport,
          medical: emp.allowances.medical,
          other: emp.allowances.other,
          total: totalAllowances
        },
        overtime: {
          hours: overtimeHours,
          rate: overtimeMultiplier,
          amount: overtimeAmount
        },
        commissions: commissions,
        grossEarnings: grossEarnings,
        deductions: {
          paye: paye,
          uif: uifEmployee,
          sdl: sdl,
          pension: 0,
          medicalAid: 0,
          other: 0,
          total: totalDeductions
        },
        netPay: netPay,
        employerCosts: {
          uif: uifEmployee,
          sdl: sdl,
          skillsLevy: grossEarnings * 0.01,
          total: uifEmployee + sdl + (grossEarnings * 0.01)
        }
      };
    });
    
    setPayrollCalculations(calculations);
    
    const totalGross = calculations.reduce((sum, calc) => sum + calc.grossEarnings, 0);
    const totalDeductions = calculations.reduce((sum, calc) => sum + calc.deductions.total, 0);
    const totalNetPay = calculations.reduce((sum, calc) => sum + calc.netPay, 0);
    
    setActivePayrollRun({ 
      ...activePayrollRun, 
      status: "calculated",
      totalGross: totalGross,
      totalDeductions: totalDeductions,
      totalNetPay: totalNetPay,
      updatedAt: new Date().toISOString()
    });
  };

  const detectExceptions = (calculation: PayrollCalculation, employee: Employee): string[] => {
    const exceptions: string[] = [];
    if (calculation.overtime.amount > calculation.basicSalary * 0.5) {
      exceptions.push(`Overtime exceeds 50% of basic salary`);
    }
    if (calculation.netPay < 0) {
      exceptions.push("Negative net pay detected");
    }
    return exceptions;
  };

  const approvePayrollRun = () => {
    if (!activePayrollRun) return;
    
    const allExceptions: string[] = [];
    payrollCalculations.forEach(calc => {
      const employee = mockEmployees.find(emp => emp.id === calc.employeeId);
      if (employee) {
        const ex = detectExceptions(calc, employee);
        if (ex.length) {
          allExceptions.push(`${employee.name}: ${ex.join(", ")}`);
        }
      }
    });
    
    if (allExceptions.length > 0) {
      setExceptionsList(allExceptions);
      setShowExceptionsModal(true);
      return;
    }
    
    setActivePayrollRun({ 
      ...activePayrollRun, 
      status: "approved", 
      approvedBy: "Payroll Officer", 
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const generateStatReports = () => {
    if (!activePayrollRun) return;
    setReportGenerating(true);
    
    setTimeout(() => {
      const totalPAYE = payrollCalculations.reduce((sum, calc) => sum + calc.deductions.paye, 0);
      const totalUIF = payrollCalculations.reduce((sum, calc) => sum + calc.deductions.uif, 0);
      const totalSDL = payrollCalculations.reduce((sum, calc) => sum + calc.deductions.sdl, 0);
      
      const emp201Report = {
        referencePeriod: activePayrollRun.period,
        taxYear: payrollSettings.taxYear,
        submissionDate: new Date().toISOString(),
        amountDue: totalPAYE + totalUIF + totalSDL,
        employeeCount: activePayrollRun.employeeCount,
      };
      
      const blob = new Blob([JSON.stringify(emp201Report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EMP201_${activePayrollRun.period.replace(/ /g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setActivePayrollRun({ 
        ...activePayrollRun, 
        status: "reports_generated",
        updatedAt: new Date().toISOString()
      });
      setReportGenerating(false);
    }, 1500);
  };

  const submitToSARS = () => {
    if (!activePayrollRun) return;
    setSubmitting(true);
    
    setTimeout(() => {
      const receipt = `SARS-RCP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setActivePayrollRun({ 
        ...activePayrollRun, 
        status: "submitted", 
        submittedAt: new Date().toISOString(),
        submissionReceipt: receipt,
        updatedAt: new Date().toISOString()
      });
      setSubmitting(false);
    }, 2000);
  };

  const getStatusBadge = (status: PayrollRun["status"]) => {
    const styles: Record<string, { bg: string; color: string; text: string }> = {
      draft: { bg: "#FEF3C7", color: "#D97706", text: "📋 Draft" },
      attendance_imported: { bg: "#DBEAFE", color: "#2563EB", text: "📊 Attendance Imported" },
      calculated: { bg: "#E0E7FF", color: "#4338CA", text: "💰 Calculated" },
      approved: { bg: "#D1FAE5", color: "#059669", text: "✅ Approved" },
      reports_generated: { bg: "#F3E8FF", color: "#9333EA", text: "📄 Reports Ready" },
      submitted: { bg: "#D1FAE5", color: "#059669", text: "🚀 Submitted to SARS" },
    };
    const s = styles[status] || styles.draft;
    return <span style={{ backgroundColor: s.bg, color: s.color, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 }}>{s.text}</span>;
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* ========== SECTION 1: PAYROLL SETTINGS ========== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Payroll Settings</h3>
        {!isEditingSettings ? (
          <Button color="primary" onClick={() => setIsEditingSettings(true)} style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}>
            <FaEdit size={14} style={{ marginRight: "8px" }} /> Edit Payroll Settings
          </Button>
        ) : (
          <Button color="success" onClick={handleSaveSettings} style={{ borderRadius: "20px" }}>
            <FaSave size={14} style={{ marginRight: "8px" }} /> Save Changes
          </Button>
        )}
      </div>

      {/* Settings Card */}
      <Card style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "32px" }}>
        <CardBody>
          <h5 style={{ marginBottom: "16px", color: "#33A6CD" }}>General Payroll Settings</h5>
          <Row>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Payroll Frequency</Label>
              {isEditingSettings ? (
                <Input type="select" value={settingsFormData.frequency} onChange={(e) => setSettingsFormData({ ...settingsFormData, frequency: e.target.value })}>
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
              {isEditingSettings ? (
                <Input type="select" value={settingsFormData.payDay} onChange={(e) => setSettingsFormData({ ...settingsFormData, payDay: e.target.value })}>
                  {[...Array(31)].map((_, i) => <option key={i+1}>{i+1}</option>)}
                </Input>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.payDay} of each month</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Currency</Label>
              {isEditingSettings ? (
                <Input type="select" value={settingsFormData.currency} onChange={(e) => setSettingsFormData({ ...settingsFormData, currency: e.target.value })}>
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
              {isEditingSettings ? (
                <Input type="select" value={settingsFormData.taxYear} onChange={(e) => setSettingsFormData({ ...settingsFormData, taxYear: e.target.value })}>
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
              {isEditingSettings ? (
                <Input type="number" step="0.1" value={settingsFormData.overtimeRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, overtimeRate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.overtimeRate}x</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Weekend Rate (x)</Label>
              {isEditingSettings ? (
                <Input type="number" step="0.1" value={settingsFormData.weekendRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, weekendRate: e.target.value })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.weekendRate}x</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>Public Holiday Rate (x)</Label>
              {isEditingSettings ? (
                <Input type="number" step="0.1" value={settingsFormData.holidayRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, holidayRate: e.target.value })} />
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
              {isEditingSettings ? (
                <div>
                  <Input type="checkbox" checked={settingsFormData.uifEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, uifEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
                  <span>Enable UIF</span>
                  <Input type="number" step="0.1" value={settingsFormData.uifRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, uifRate: e.target.value })} style={{ marginTop: "8px" }} disabled={!settingsFormData.uifEnabled} />
                </div>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.uifEnabled ? `Enabled (${payrollSettings.uifRate}%)` : "Disabled"}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>SDL (Skills Development Levy)</Label>
              {isEditingSettings ? (
                <div>
                  <Input type="checkbox" checked={settingsFormData.sdlEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, sdlEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
                  <span>Enable SDL</span>
                  <Input type="number" step="0.1" value={settingsFormData.sdlRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, sdlRate: e.target.value })} style={{ marginTop: "8px" }} disabled={!settingsFormData.sdlEnabled} />
                </div>
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.sdlEnabled ? `Enabled (${payrollSettings.sdlRate}%)` : "Disabled"}</p>
              )}
            </Col>
            <Col md={4}>
              <Label style={{ fontWeight: 600 }}>PAYE (Pay As You Earn)</Label>
              {isEditingSettings ? (
                <div>
                  <Input type="checkbox" checked={settingsFormData.payeEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, payeEnabled: e.target.checked })} style={{ width: "auto", marginRight: "8px" }} />
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
              {isEditingSettings ? (
                <Input type="checkbox" checked={settingsFormData.autoGeneratePayslips} onChange={(e) => setSettingsFormData({ ...settingsFormData, autoGeneratePayslips: e.target.checked })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.autoGeneratePayslips ? "Yes" : "No"}</p>
              )}
            </Col>
            <Col md={6}>
              <Label style={{ fontWeight: 600 }}>Allow employee self-service payslips</Label>
              {isEditingSettings ? (
                <Input type="checkbox" checked={settingsFormData.allowSelfServicePayslips} onChange={(e) => setSettingsFormData({ ...settingsFormData, allowSelfServicePayslips: e.target.checked })} />
              ) : (
                <p style={{ marginTop: "8px" }}>{payrollSettings.allowSelfServicePayslips ? "Yes" : "No"}</p>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* ========== SECTION 2: PAYROLL PROCESSING ========== */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Payroll Processing</h3>
            <p style={{ fontSize: "14px", color: "#718096", margin: "4px 0 0 0" }}>
              Run payroll: Import attendance → Calculate earnings → Apply deductions → Review → Generate EMP201 → Submit to SARS
            </p>
          </div>
          <Button onClick={() => setShowPayrollRunModal(true)} style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}>
            <FaPlus size={14} style={{ marginRight: "8px" }} /> Start New Payroll Run
          </Button>
        </div>

        {/* Payroll Runs List */}
        <Card style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
          <CardBody>
            <h5 style={{ marginBottom: "16px", fontWeight: 600 }}>Payroll Periods</h5>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F7FAFC" }}>
                    <th style={thStyle}>Period</th>
                    <th style={thStyle}>Frequency</th>
                    <th style={thStyle}>Start Date</th>
                    <th style={thStyle}>End Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Employees</th>
                    <th style={thStyle}>Total Gross</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.map((run) => (
                    <tr key={run.id}>
                      <td style={tdStyle}><strong>{run.period}</strong></td>
                      <td style={tdStyle}>{run.frequency}</td>
                      <td style={tdStyle}>{run.periodStart}</td>
                      <td style={tdStyle}>{run.periodEnd}</td>
                      <td style={tdStyle}>{getStatusBadge(run.status)}</td>
                      <td style={tdStyle}>{run.employeeCount}</td>
                      <td style={tdStyle}>{run.totalGross > 0 ? `ZAR ${run.totalGross.toLocaleString()}` : "-"}</td>
                      <td style={tdStyle}>
                        <Button bsSize="sm" color="link" onClick={() => setActivePayrollRun(run)} style={{ padding: "4px 8px" }}>Select</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Active Payroll Run Workflow */}
        {activePayrollRun && (
          <Card style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <CardBody>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>{activePayrollRun.period} Payroll Run</h4>
                  <p style={{ fontSize: "12px", color: "#718096", margin: "4px 0 0 0" }}>ID: {activePayrollRun.id} | {activePayrollRun.periodStart} to {activePayrollRun.periodEnd}</p>
                </div>
                {getStatusBadge(activePayrollRun.status)}
              </div>

              {/* Workflow Steps */}
              <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button 
                  disabled={activePayrollRun.status !== "draft"} 
                  onClick={importAttendanceData}
                  style={{ backgroundColor: activePayrollRun.status === "draft" ? "#33A6CD" : "#CBD5E0", border: "none", borderRadius: "20px" }}
                >
                  1️⃣ Import Attendance
                </Button>
                <Button 
                  disabled={activePayrollRun.status !== "attendance_imported"} 
                  onClick={calculatePayroll}
                  style={{ backgroundColor: activePayrollRun.status === "attendance_imported" ? "#33A6CD" : "#CBD5E0", border: "none", borderRadius: "20px" }}
                >
                  2️⃣ Calculate Payroll
                </Button>
                <Button 
                  disabled={activePayrollRun.status !== "calculated"} 
                  onClick={approvePayrollRun}
                  style={{ backgroundColor: activePayrollRun.status === "calculated" ? "#33A6CD" : "#CBD5E0", border: "none", borderRadius: "20px" }}
                >
                  3️⃣ Review & Approve
                </Button>
                <Button 
                  disabled={activePayrollRun.status !== "approved"} 
                  onClick={generateStatReports}
                  style={{ backgroundColor: activePayrollRun.status === "approved" ? "#33A6CD" : "#CBD5E0", border: "none", borderRadius: "20px" }}
                >
                  {reportGenerating ? "⏳ Generating..." : "4️⃣ Generate EMP201"}
                </Button>
                <Button 
                  disabled={activePayrollRun.status !== "reports_generated"} 
                  onClick={submitToSARS}
                  style={{ backgroundColor: activePayrollRun.status === "reports_generated" ? "#33A6CD" : "#CBD5E0", border: "none", borderRadius: "20px" }}
                >
                  {submitting ? "⏳ Submitting..." : "5️⃣ Submit to SARS"}
                </Button>
              </div>

              {/* Summary Stats */}
              {activePayrollRun.status !== "draft" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px", padding: "16px", backgroundColor: "#F7FAFC", borderRadius: "8px" }}>
                  <div><strong>Total Gross:</strong><br />ZAR {activePayrollRun.totalGross.toLocaleString()}</div>
                  <div><strong>Total Deductions:</strong><br />ZAR {activePayrollRun.totalDeductions.toLocaleString()}</div>
                  <div><strong>Total Net Pay:</strong><br />ZAR {activePayrollRun.totalNetPay.toLocaleString()}</div>
                  <div><strong>Employees:</strong><br />{activePayrollRun.employeeCount}</div>
                </div>
              )}

              {/* Employee Payroll Table */}
              {payrollCalculations.length > 0 && (
                <>
                  <h5 style={{ marginBottom: "12px", fontWeight: 600 }}>Employee Payroll Summary</h5>
                  <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead style={{ position: "sticky", top: 0, backgroundColor: "white" }}>
                        <tr style={{ backgroundColor: "#EDF2F7" }}>
                          <th style={thStyle}>Employee</th>
                          <th style={thStyle}>Basic Salary</th>
                          <th style={thStyle}>Allowances</th>
                          <th style={thStyle}>Overtime</th>
                          <th style={thStyle}>Gross</th>
                          <th style={thStyle}>PAYE</th>
                          <th style={thStyle}>UIF</th>
                          <th style={thStyle}>Net Pay</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollCalculations.map((calc) => {
                          const employee = mockEmployees.find(emp => emp.id === calc.employeeId);
                          const exceptions = employee ? detectExceptions(calc, employee) : [];
                          return (
                            <tr key={calc.id} style={{ backgroundColor: exceptions.length > 0 ? "#FEF3C7" : "white" }}>
                              <td style={tdStyle}>{employee?.name || calc.employeeId}</td>
                              <td style={tdStyle}>ZAR {calc.basicSalary.toLocaleString()}</td>
                              <td style={tdStyle}>ZAR {calc.allowances.total.toLocaleString()}</td>
                              <td style={tdStyle}>ZAR {calc.overtime.amount.toLocaleString()}</td>
                              <td style={tdStyle}><strong>ZAR {calc.grossEarnings.toLocaleString()}</strong></td>
                              <td style={tdStyle}>ZAR {calc.deductions.paye.toLocaleString()}</td>
                              <td style={tdStyle}>ZAR {calc.deductions.uif.toLocaleString()}</td>
                              <td style={tdStyle}><strong>ZAR {calc.netPay.toLocaleString()}</strong></td>
                              <td style={tdStyle}>
                                {exceptions.length > 0 && (
                                  <span style={{ color: "#E53E3E", cursor: "help" }} title={exceptions.join(", ")}>⚠️ Exception</span>
                                )}
                                {exceptions.length === 0 && <span style={{ color: "#48BB78" }}>✓ OK</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: "#F7FAFC", fontWeight: 600, borderTop: "2px solid #CBD5E0" }}>
                          <td style={tdStyle} colSpan={4}>TOTALS:</td>
                          <td style={tdStyle}>ZAR {activePayrollRun.totalGross.toLocaleString()}</td>
                          <td style={tdStyle}>ZAR {payrollCalculations.reduce((s, c) => s + c.deductions.paye, 0).toLocaleString()}</td>
                          <td style={tdStyle}>ZAR {payrollCalculations.reduce((s, c) => s + c.deductions.uif, 0).toLocaleString()}</td>
                          <td style={tdStyle}>ZAR {activePayrollRun.totalNetPay.toLocaleString()}</td>
                          <td style={tdStyle}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {/* Submission Receipt */}
              {activePayrollRun.submissionReceipt && (
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#F0FFF4", borderRadius: "8px", borderLeft: "4px solid #48BB78" }}>
                  <strong>✅ SARS Submission Confirmation</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Receipt: {activePayrollRun.submissionReceipt} | Submitted: {activePayrollRun.submittedAt}</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* New Payroll Run Modal */}
      {showPayrollRunModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPayrollRunModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", width: "400px", maxWidth: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ marginBottom: "16px" }}>Start New Payroll Run</h4>
            <Label style={{ fontWeight: 600 }}>Period Name</Label>
            <Input 
              type="text" 
              placeholder="e.g., April 2025" 
              value={newRunPeriod} 
              onChange={(e) => setNewRunPeriod(e.target.value)} 
              style={{ marginBottom: "16px" }}
            />
            <Label style={{ fontWeight: 600 }}>Frequency</Label>
            <Input 
              type="select" 
              value={newRunFrequency} 
              onChange={(e) => setNewRunFrequency(e.target.value as any)}
              style={{ marginBottom: "24px" }}
            >
              <option>Weekly</option>
              <option>Bi-Weekly</option>
              <option>Monthly</option>
            </Input>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button color="secondary" onClick={() => setShowPayrollRunModal(false)} style={{ flex: 1, borderRadius: "20px" }}>Cancel</Button>
              <Button onClick={startNewPayrollRun} style={{ flex: 1, backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}>Create Run</Button>
            </div>
          </div>
        </div>
      )}

      {/* Exceptions Modal */}
      {showExceptionsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowExceptionsModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", width: "500px", maxWidth: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ marginBottom: "12px", color: "#E53E3E" }}>⚠️ Exceptions Detected</h4>
            <ul style={{ marginBottom: "20px", maxHeight: "300px", overflow: "auto" }}>
              {exceptionsList.map((ex, i) => <li key={i} style={{ marginBottom: "8px", fontSize: "13px" }}>{ex}</li>)}
            </ul>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button color="danger" onClick={() => setShowExceptionsModal(false)} style={{ flex: 1, borderRadius: "20px" }}>Return for Correction</Button>
              <Button color="success" onClick={() => {
                if (activePayrollRun) {
                  setActivePayrollRun({ ...activePayrollRun, status: "approved", approvedBy: "Payroll Officer", approvedAt: new Date().toISOString() });
                }
                setShowExceptionsModal(false);
              }} style={{ flex: 1, borderRadius: "20px" }}>Override & Approve</Button>
            </div>
          </div>
        </div>
      )}
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
            {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: "16px" }}>
            <Label style={{ fontSize: "13px", fontWeight: 600, color: "#4A5568" }}>Description</Label>
            <Input type="textarea" rows={2} defaultValue={rule.description} placeholder="Enter leave rule description..." />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Main Leave Settings Tab Component
const LeaveSettingsTab = () => {
  const mockLeaveRules: LeaveRule[] = [
    { id: "1", name: "Annual Leave", description: "Standard annual leave policy per BCEA", cycles: [] },
    { id: "2", name: "Sick Leave", description: "Sick leave policy per BCEA guidelines", cycles: [] },
    { id: "3", name: "Family Leave", description: "Family responsibility leave", cycles: [] },
    { id: "4", name: "Maternity Leave", description: "Maternity leave policy", cycles: [] },
    { id: "5", name: "Study Leave", description: "Study leave policy", cycles: [] },
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

// Export the component as default as well for flexibility
export default OrganizationSettingsPage;
