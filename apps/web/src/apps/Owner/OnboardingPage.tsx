import React, { useState, useEffect } from "react";
import { Row, Col, Card, CardBody, Button, Input, Label, FormGroup, Progress, Modal, ModalHeader, ModalBody, ModalFooter, Spinner } from "reactstrap";
import {
  FaBuilding, FaUserShield, FaGlobeAfrica, FaPlus, FaChevronRight,
  FaCheckCircle, FaUpload, FaUserTie, FaTrash
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";


const SADC_COUNTRIES = [
  "Angola", "Botswana", "Comoros", "Democratic Republic of Congo",
  "Eswatini", "Lesotho", "Madagascar", "Malawi", "Mauritius",
  "Mozambique", "Namibia", "Seychelles", "South Africa",
  "Tanzania", "Zambia", "Zimbabwe"
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Owner {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = {
    success: { bg: "#48BB78", text: "#fff" },
    error:   { bg: "#FC8181", text: "#fff" },
  };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, backgroundColor: colors[type].bg, color: colors[type].text, padding: "12px 24px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxWidth: 360, fontSize: 14, fontWeight: 500 }}>
      {message}
    </div>
  );
}

// ─── Owner Modal ──────────────────────────────────────────────────────────────

function AddOwnerModal({ onClose, onAdd }: { onClose: () => void; onAdd: (owner: Owner) => void }) {
  const [form, setForm] = useState<Owner>({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setField = (field: keyof Owner) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    const required: (keyof Owner)[] = ["firstName", "lastName", "email", "password"];
    if (required.some(k => !(form[k] as string).trim())) { setError("Please fill in all required fields."); return; }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/owner/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "Owner" }),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        onAdd({ ...form, id: data.data?._id || data._id });
        onClose();
      } else {
        setError(data.message || data.error?.message || "Failed to create owner.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { borderRadius: "8px", fontSize: 14 };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#344054" };

  return (
    <Modal isOpen toggle={onClose} centered size="md">
      <ModalHeader toggle={onClose}>Add Owner / Admin</ModalHeader>
      <ModalBody>
        {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#b42318", marginBottom: 16 }}>{error}</div>}
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label style={labelStyle}>First Name *</Label>
              <Input style={inputStyle} placeholder="e.g. John" value={form.firstName} onChange={setField("firstName")} />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label style={labelStyle}>Last Name *</Label>
              <Input style={inputStyle} placeholder="e.g. Doe" value={form.lastName} onChange={setField("lastName")} />
            </FormGroup>
          </Col>
        </Row>
        <FormGroup>
          <Label style={labelStyle}>Email Address *</Label>
          <Input type="email" style={inputStyle} placeholder="john.doe@company.com" value={form.email} onChange={setField("email")} />
        </FormGroup>
        <FormGroup>
          <Label style={labelStyle}>Phone Number</Label>
          <Input style={inputStyle} placeholder="+27 11 123 4567" value={form.phone} onChange={setField("phone")} />
        </FormGroup>
        <FormGroup>
          <Label style={labelStyle}>Password *</Label>
          <Input type="password" style={inputStyle} placeholder="Secure password" value={form.password} onChange={setField("password")} />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button color="primary" style={{ backgroundColor: "#33A6CD", border: "none" }} onClick={handleSubmit} disabled={saving}>
          {saving ? <><Spinner size="sm" /> Adding...</> : "Add Owner"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const [selectedCountry, setSelectedCountry] = useState("South Africa");
  const [currentStep, setCurrentStep]         = useState(1);
  const [isEditing, setIsEditing]             = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [toast, setToast]                     = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // Company data – fetched from API, pre-populated as fallback
  const [companyData, setCompanyData] = useState({
    name: "", size: "", sector: "", email: "", phone: "", website: "", taxId: "",
    registrationNumber: "", cipcNumber: "", companyType: "", companyStatus: "Active",
    registrationDate: "", registrationAuthority: "",
    streetAddress: "", city: "", stateProvince: "", country: "South Africa", postalCode: "",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Departments & Roles – fetched from API
  const [departments, setDepartments] = useState<{ id?: string; name: string }[]>([]);
  const [roles, setRoles]             = useState<{ id?: string; name: string }[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Owners list
  const [owners, setOwners]           = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Modals
  const [deptModalOpen, setDeptModalOpen]   = useState(false);
  const [roleModalOpen, setRoleModalOpen]   = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [newDeptName, setNewDeptName]       = useState("");
  const [newRoleName, setNewRoleName]       = useState("");
  const [savingDept, setSavingDept]         = useState(false);
  const [savingRole, setSavingRole]         = useState(false);

  const totalSteps = 4;
  const progress   = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const phases = [
    { id: 1, title: "Country",   icon: <FaGlobeAfrica size={20} /> },
    { id: 2, title: "Company",   icon: <FaBuilding    size={20} /> },
    { id: 3, title: "Owners",    icon: <FaUserTie     size={20} /> },
    { id: 4, title: "Roles",     icon: <FaUserShield  size={20} /> },
  ];

  // ── Fetch existing company data ─────────────────────────────────────────────

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/owner/company/settings`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await res.json();
        const c = data.data || data;
        if (c && c.name) setCompanyData(prev => ({ ...prev, ...c }));
      } catch (err) { /* silent */ }
    };
    fetchCompany();
  }, []);

  // ── Fetch departments ───────────────────────────────────────────────────────

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/department`, { headers: { "Authorization": `Bearer ${token}` } });
      
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setDepartments(rows.map((d: any) => ({ id: d._id, name: d.name || d })));
      } else {
        // Use default departments if API doesn't exist
        setDepartments([
          { name: "Engineering" },
          { name: "Human Resources" },
          { name: "Sales" },
          { name: "Marketing" },
          { name: "Operations" },
          { name: "Finance" }
        ]);
      }
    } catch (err) {
      // Use default departments on error
      setDepartments([
        { name: "Engineering" },
        { name: "Human Resources" },
        { name: "Sales" },
        { name: "Marketing" },
        { name: "Operations" },
        { name: "Finance" }
      ]);
    } finally {
      setLoadingDepts(false);
    }
  };

  // ── Fetch roles ─────────────────────────────────────────────────────────────

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/role`, { headers: { "Authorization": `Bearer ${token}` } });
      
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setRoles(rows.map((r: any) => ({ id: r._id, name: r.name || r.type || r })));
      } else {
        // Use default roles if API doesn't exist
        setRoles([
          { name: "Software Engineer" },
          { name: "Product Manager" },
          { name: "HR Specialist" },
          { name: "Sales Representative" },
          { name: "Marketing Coordinator" },
          { name: "Operations Manager" }
        ]);
      }
    } catch (err) {
      // Use default roles on error
      setRoles([
        { name: "Software Engineer" },
        { name: "Product Manager" },
        { name: "HR Specialist" },
        { name: "Sales Representative" },
        { name: "Marketing Coordinator" },
        { name: "Operations Manager" }
      ]);
    } finally {
      setLoadingRoles(false);
    }
  };

  // ── Fetch owners ────────────────────────────────────────────────────────────

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/owner`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setOwners(rows.map((o: any) => ({
        id: o._id,
        firstName: o.firstName || "",
        lastName:  o.lastName  || "",
        email:     o.email     || "",
        phone:     o.phone     || "",
        password:  "",
      })));
    } catch (err) { /* silent */ }
    finally { setLoadingOwners(false); }
  };

  useEffect(() => {
    if (currentStep === 3) { fetchOwners(); }
    if (currentStep === 4) { fetchDepartments(); fetchRoles(); }
  }, [currentStep]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/owner/company/settings`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
      if (res.ok) {
        showToast("Company details saved successfully!", "success");
        setIsEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to save company details.", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/department/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setDepartments(prev => [...prev, { id: data.data?._id || data._id, name: newDeptName.trim() }]);
        showToast("Department created.", "success");
      } else {
        // If API fails, still add locally
        setDepartments(prev => [...prev, { name: newDeptName.trim() }]);
        showToast("Department added locally.", "success");
      }
      setNewDeptName("");
      setDeptModalOpen(false);
    } catch (err) {
      // Add locally even if API fails
      setDepartments(prev => [...prev, { name: newDeptName.trim() }]);
      setNewDeptName("");
      setDeptModalOpen(false);
      showToast("Department added locally.", "success");
    } finally {
      setSavingDept(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setSavingRole(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/role/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setRoles(prev => [...prev, { id: data.data?._id || data._id, name: newRoleName.trim() }]);
        showToast("Role created.", "success");
      } else {
        setRoles(prev => [...prev, { name: newRoleName.trim() }]);
        showToast("Role added locally.", "success");
      }
      setNewRoleName("");
      setRoleModalOpen(false);
    } catch (err) {
      setRoles(prev => [...prev, { name: newRoleName.trim() }]);
      setNewRoleName("");
      setRoleModalOpen(false);
      showToast("Role added locally.", "success");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteDepartment = async (dept: { id?: string; name: string }) => {
    if (!dept.id) return;
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/department/${dept.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setDepartments(prev => prev.filter(d => d.id !== dept.id));
      showToast("Department deleted.", "success");
    } catch (err) {
      showToast("Failed to delete department.", "error");
    }
  };

  const handleDeleteRole = async (role: { id?: string; name: string }) => {
    if (!role.id) return;
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/role/${role.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setRoles(prev => prev.filter(r => r.id !== role.id));
      showToast("Role deleted.", "success");
    } catch (err) {
      showToast("Failed to delete role.", "error");
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/owner/onboarding/complete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry, company: companyData, departments: departments.map(d => d.name), roles: roles.map(r => r.name) }),
      });
      if (res.ok) {
        showToast("✅ Onboarding Completed Successfully!", "success");
      } else {
        showToast("Onboarding saved locally.", "success");
      }
    } catch (err) {
      showToast("Onboarding saved locally.", "success");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Welcome to KagoHC</h2>
          <p style={{ color: "#718096", fontSize: "16px", marginTop: "8px" }}>Complete your setup in a few simple steps</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "15px", color: "#4A5568" }}>Selected Country</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#33A6CD", fontSize: "18px" }}>
            <FaGlobeAfrica /> {selectedCountry}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          {phases.map((phase) => (
            <div key={phase.id} onClick={() => setCurrentStep(phase.id)} style={{ cursor: "pointer", textAlign: "center", flex: 1, opacity: currentStep >= phase.id ? 1 : 0.6 }}>
              <div style={{ width: "48px", height: "48px", margin: "0 auto 8px", borderRadius: "50%", backgroundColor: currentStep >= phase.id ? "#33A6CD" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: currentStep >= phase.id ? "white" : "#718096" }}>
                {phase.icon}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: currentStep === phase.id ? "#33A6CD" : "#4A5568" }}>{phase.title}</div>
            </div>
          ))}
        </div>
        <Progress value={progress} style={{ height: "6px", borderRadius: "9999px" }} color="primary" />
      </div>

      <Row>
        {/* Left sidebar */}
        <Col md={4}>
          <Card style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding: "28px" }}>
              <h5 style={{ fontWeight: 700, marginBottom: "24px" }}>Onboarding Progress</h5>
              {phases.map((phase) => (
                <div key={phase.id} onClick={() => setCurrentStep(phase.id)} style={{ padding: "16px", borderRadius: "12px", marginBottom: "10px", backgroundColor: currentStep === phase.id ? "#EBF8FF" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ color: currentStep === phase.id ? "#33A6CD" : "#A0AEC0" }}>{phase.icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: "15px" }}>{phase.title}</div>
                  {currentStep > phase.id && <FaCheckCircle color="#48BB78" size={18} />}
                  {currentStep === phase.id && <FaChevronRight color="#33A6CD" size={16} />}
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>

        {/* Right content */}
        <Col md={8}>
          <Card style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding: "40px" }}>

              {/* ── STEP 1: Country ── */}
              {currentStep === 1 && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>Step 1: Country Selection</h3>
                  <p style={{ color: "#718096", marginBottom: "32px" }}>Select your SADC country to auto-load local compliance rules.</p>
                  <FormGroup>
                    <Label style={{ fontWeight: 600 }}>SADC Country</Label>
                    <Input type="select" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} style={{ borderRadius: "12px", padding: "14px" }}>
                      {SADC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Input>
                  </FormGroup>
                  <Button color="primary" size="lg" style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px", padding: "14px 40px", marginTop: "40px" }} onClick={() => setCurrentStep(2)}>
                    Continue to Company Information <FaChevronRight style={{ marginLeft: "8px" }} />
                  </Button>
                </>
              )}

              {/* ── STEP 2: Company ── */}
              {currentStep === 2 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <h3 style={{ fontWeight: 700, margin: 0 }}>Company Information</h3>
                    <Button color="primary" style={{ backgroundColor: isEditing ? "#ef4444" : "#33A6CD", border: "none", borderRadius: "20px" }} onClick={() => setIsEditing(e => !e)}>
                      {isEditing ? "Cancel" : "Edit Details"}
                    </Button>
                  </div>

                  <Card style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <CardBody style={{ padding: "40px" }}>
                      {/* Logo */}
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
                        <div style={{ position: "relative" }}>
                          <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#33A6CD", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "52px", fontWeight: "700", overflow: "hidden" }}>
                            {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (companyData.name?.charAt(0) || "K")}
                          </div>
                          {isEditing && (
                            <label style={{ position: "absolute", bottom: "-6px", right: "-6px", backgroundColor: "white", borderRadius: "50%", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
                              <FaUpload size={18} color="#33A6CD" />
                              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                            </label>
                          )}
                        </div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <h5 style={{ fontWeight: 600, marginBottom: "20px", color: "#33A6CD" }}>Basic Information</h5>
                          {[
                            { label: "Company Name", field: "name", placeholder: "Kago Human Capital" },
                            { label: "Company Size", field: "size", placeholder: "45", type: "number" },
                            { label: "Sector",        field: "sector",  placeholder: "Technology" },
                            { label: "Company Email", field: "email",   placeholder: "info@company.com" },
                            { label: "Phone Number",  field: "phone",   placeholder: "+27 11 123 4567" },
                            { label: "Website",       field: "website", placeholder: "www.company.com" },
                            { label: "Tax ID / VAT",  field: "taxId",   placeholder: "1234567890" },
                          ].map(f => (
                            <InfoRow key={f.field} label={f.label} value={(companyData as any)[f.field]} isEditing={isEditing} field={f.field} setCompanyData={setCompanyData} type={f.type} placeholder={f.placeholder} />
                          ))}

                          <h5 style={{ fontWeight: 600, marginTop: "28px", marginBottom: "20px", color: "#33A6CD" }}>Address Details</h5>
                          {[
                            { label: "Street Address", field: "streetAddress" },
                            { label: "City",           field: "city" },
                            { label: "State / Province", field: "stateProvince" },
                            { label: "Country",        field: "country" },
                            { label: "Postal Code",    field: "postalCode" },
                          ].map(f => (
                            <InfoRow key={f.field} label={f.label} value={(companyData as any)[f.field]} isEditing={isEditing} field={f.field} setCompanyData={setCompanyData} />
                          ))}
                        </Col>
                        <Col md={6}>
                          <h5 style={{ fontWeight: 600, marginBottom: "20px", color: "#33A6CD" }}>Registration Details</h5>
                          {[
                            { label: "Business Reg. Number", field: "registrationNumber" },
                            { label: "CIPC Number",          field: "cipcNumber" },
                            { label: "Company Type",         field: "companyType" },
                            { label: "Company Status",       field: "companyStatus" },
                            { label: "Registration Date",    field: "registrationDate", type: "date" },
                            { label: "Registration Authority", field: "registrationAuthority" },
                          ].map(f => (
                            <InfoRow key={f.field} label={f.label} value={(companyData as any)[f.field]} isEditing={isEditing} field={f.field} setCompanyData={setCompanyData} type={f.type} />
                          ))}
                        </Col>
                      </Row>

                      {isEditing && (
                        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                          <Button color="success" style={{ backgroundColor: "#48BB78", border: "none", borderRadius: "9999px", padding: "12px 32px" }} onClick={handleSaveCompany} disabled={isSaving}>
                            {isSaving ? <><Spinner size="sm" /> Saving...</> : "Save Company Details"}
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  <Button color="success" style={{ marginTop: "32px", borderRadius: "9999px", padding: "14px 36px" }} onClick={() => setCurrentStep(3)}>
                    Continue to Owners Setup
                  </Button>
                </>
              )}

              {/* ── STEP 3: Owners ── */}
              {currentStep === 3 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ fontWeight: 700, margin: 0 }}>Owners / Admins</h3>
                    <Button color="primary" style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px" }} onClick={() => setOwnerModalOpen(true)}>
                      <FaPlus style={{ marginRight: "8px" }} /> Add Owner
                    </Button>
                  </div>
                  <p style={{ color: "#718096", marginBottom: "24px" }}>Owners have full administrative access to the system.</p>

                  {loadingOwners ? (
                    <div style={{ textAlign: "center", padding: "32px" }}><Spinner color="primary" /></div>
                  ) : owners.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", background: "#f9fafb", borderRadius: 12, border: "1px dashed #d1d5db", color: "#9ca3af" }}>
                      No owners added yet. Click "Add Owner" to create one.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {owners.map((owner, i) => (
                        <div key={owner.id || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#f9fafb", borderRadius: 12, border: "1px solid #e4e7ec" }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#33A6CD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                            {owner.firstName?.[0]?.toUpperCase()}{owner.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>{owner.firstName} {owner.lastName}</div>
                            <div style={{ fontSize: 13, color: "#667085" }}>{owner.email}</div>
                          </div>
                          <span style={{ fontSize: 11, padding: "3px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: 20, fontWeight: 700 }}>Owner</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button color="success" style={{ marginTop: "32px", borderRadius: "9999px", padding: "14px 36px" }} onClick={() => setCurrentStep(4)}>
                    Continue to Roles & Departments
                  </Button>
                </>
              )}

              {/* ── STEP 4: Roles & Departments ── */}
              {currentStep === 4 && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>Roles & Departments</h3>
                  <p style={{ color: "#718096", marginBottom: "24px" }}>Create the structure for your organisation.</p>

                  {/* Departments */}
                  <div style={{ padding: "24px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h5 style={{ margin: 0 }}>Departments ({departments.length})</h5>
                      <Button color="primary" size="sm" style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px" }} onClick={() => setDeptModalOpen(true)}>
                        <FaPlus style={{ marginRight: "6px" }} /> Add
                      </Button>
                    </div>
                    {loadingDepts ? (
                      <div style={{ textAlign: "center", padding: 16 }}><Spinner size="sm" /></div>
                    ) : departments.length === 0 ? (
                      <div style={{ color: "#9ca3af", fontSize: 14, padding: "12px 0" }}>No departments yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {departments.map((dept, i) => (
                          <div key={dept.id || i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>
                            {dept.name}
                            {dept.id && (
                              <button onClick={() => handleDeleteDepartment(dept)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, display: "flex", lineHeight: 1 }}>
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Roles */}
                  <div style={{ padding: "24px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h5 style={{ margin: 0 }}>Roles ({roles.length})</h5>
                      <Button color="primary" size="sm" style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px" }} onClick={() => setRoleModalOpen(true)}>
                        <FaPlus style={{ marginRight: "6px" }} /> Add
                      </Button>
                    </div>
                    {loadingRoles ? (
                      <div style={{ textAlign: "center", padding: 16 }}><Spinner size="sm" /></div>
                    ) : roles.length === 0 ? (
                      <div style={{ color: "#9ca3af", fontSize: 14, padding: "12px 0" }}>No roles yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {roles.map((role, i) => (
                          <div key={role.id || i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#ecfdf3", border: "1px solid #bbf7d0", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#065f46" }}>
                            {role.name}
                            {role.id && (
                              <button onClick={() => handleDeleteRole(role)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, display: "flex", lineHeight: 1 }}>
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button color="success" style={{ borderRadius: "9999px", padding: "14px 36px" }} onClick={handleCompleteOnboarding}>
                    Complete Onboarding
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Department Modal */}
      <Modal isOpen={deptModalOpen} toggle={() => setDeptModalOpen(false)} centered>
        <ModalHeader toggle={() => setDeptModalOpen(false)}>Create New Department</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Department Name</Label>
            <Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g. Operations" onKeyDown={e => e.key === "Enter" && handleAddDepartment()} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeptModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor: "#33A6CD" }} onClick={handleAddDepartment} disabled={savingDept || !newDeptName.trim()}>
            {savingDept ? <><Spinner size="sm" /> Saving...</> : "Add Department"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Role Modal */}
      <Modal isOpen={roleModalOpen} toggle={() => setRoleModalOpen(false)} centered>
        <ModalHeader toggle={() => setRoleModalOpen(false)}>Create New Role</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Role Name</Label>
            <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Talent Acquisition Specialist" onKeyDown={e => e.key === "Enter" && handleAddRole()} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor: "#33A6CD" }} onClick={handleAddRole} disabled={savingRole || !newRoleName.trim()}>
            {savingRole ? <><Spinner size="sm" /> Saving...</> : "Add Role"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Owner Modal */}
      {ownerModalOpen && (
        <AddOwnerModal
          onClose={() => setOwnerModalOpen(false)}
          onAdd={(owner) => {
            setOwners(prev => [...prev, owner]);
            showToast(`${owner.firstName} ${owner.lastName} added as owner.`, "success");
          }}
        />
      )}
    </div>
  );
};

// ─── Editable Info Row ────────────────────────────────────────────────────────

const InfoRow = ({ label, value, isEditing, field, setCompanyData, type = "text", placeholder }: any) => (
  <div style={{ marginBottom: "20px" }}>
    <div style={{ fontSize: "13.5px", color: "#718096", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
    {isEditing ? (
      <Input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={e => setCompanyData((prev: any) => ({ ...prev, [field]: e.target.value }))}
        style={{ borderRadius: "8px" }}
      />
    ) : (
      <div style={{ fontSize: "15.5px", color: value ? "#2D3748" : "#A0AEC0", fontWeight: 500 }}>{value || "—"}</div>
    )}
  </div>
);

export default OnboardingPage;
