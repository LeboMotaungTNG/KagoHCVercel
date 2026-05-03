import React, { useState, useEffect } from "react";
import { Container, Card, CardBody, Spinner, Alert } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch, AiOutlineUser, AiOutlineDownload, AiOutlineUpload, AiOutlineClose } from "react-icons/ai";

const API_URL = 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1';

// ─── Styles ───────────────────────────────────────────────────────────────────

const employeeTblTitle = {
  width: "100%", display: "flex", padding: 5,
  justifyContent: "center", alignItems: "center",
  fontSize: 16, fontWeight: "bolder" as const,
};

const employeeTbl = {
  borderRadius: 10, padding: 5,
  borderWidth: 2, borderStyle: "solid", borderColor: "#D9D9D9",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SearchInput = ({ Title, search, setSearch, radius }: any) => (
  <div style={{ width: 300, height: "3em", display: "flex", alignItems: "center", background: "#ffffff", paddingTop: ".58rem", paddingBottom: ".5rem", paddingLeft: "1rem", paddingRight: "1rem", marginRight: 32, border: "solid", borderWidth: 0.1, borderRadius: radius }}>
    <AiOutlineSearch size={24} />
    <input type="text" placeholder={Title} value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: "none", marginLeft: 8, paddingRight: 24, outline: "none", width: "100%" }} />
  </div>
);

const ButtonBtn = ({ Title, BackgroundColor, ColorText, BorderColor, borderRadius, handleOnclick, pending, type, icon }: any) => (
  <button
    className="btn"
    style={{ fontWeight: "600", color: ColorText, borderColor: BorderColor, borderWidth: "2px", borderStyle: "solid", borderRadius, backgroundColor: BackgroundColor, padding: "10px 20px" }}
    type={type}
    onClick={handleOnclick}
    disabled={pending}
  >
    <div className="d-flex justify-content-center align-items-center gap-2">
      {icon && <span>{icon}</span>}
      {!pending ? <span>{Title}</span> : null}
      {pending && (<><Spinner size="sm" /><span> Processing...</span></>)}
    </div>
  </button>
);

// ─── Add Manager Modal ────────────────────────────────────────────────────────

function AddManagerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    department: "", jobTitle: "", password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    const required = ["firstName", "lastName", "email", "password", "department"];
    const missing = required.filter(k => !(form as any)[k].trim());
    if (missing.length) { setError("Please fill in all required fields."); return; }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/manager/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
          phone:     form.phone.trim(),
          department: form.department.trim(),
          jobTitle:   form.jobTitle.trim(),
          password:   form.password,
          role: "Manager",
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || data.error?.message || "Failed to create manager.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, borderRadius: 8, border: "1px solid #d1d5db",
    padding: "0 12px", fontSize: 14, color: "#344054", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#344054", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 540, borderRadius: 16, background: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1d2939" }}>Add Manager</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#667085" }}>Create a new manager account</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", padding: 4, display: "flex" }}>
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#b42318" }}>{error}</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} placeholder="e.g. James" value={form.firstName} onChange={setField("firstName")} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} placeholder="e.g. Smith" value={form.lastName} onChange={setField("lastName")} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address *</label>
            <input style={inputStyle} type="email" placeholder="james.smith@company.com" value={form.email} onChange={setField("email")} />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} placeholder="+27 11 123 4567" value={form.phone} onChange={setField("phone")} />
          </div>

          <div>
            <label style={labelStyle}>Department *</label>
            <input style={inputStyle} placeholder="e.g. Engineering" value={form.department} onChange={setField("department")} />
          </div>

          <div>
            <label style={labelStyle}>Job Title</label>
            <input style={inputStyle} placeholder="e.g. Engineering Manager" value={form.jobTitle} onChange={setField("jobTitle")} />
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <input style={inputStyle} type="password" placeholder="Temporary password" value={form.password} onChange={setField("password")} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f2f4f7", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#33A6CD", fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving ? <><Spinner size="sm" /> Creating...</> : "Create Manager"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Manager Modal ───────────────────────────────────────────────────────

function ViewManagerModal({ manager, onClose }: { manager: any; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 420, borderRadius: 16, background: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #33A6CD 0%, #1a7fa3 100%)", padding: "28px 24px 36px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex" }}>
            <AiOutlineClose size={18} />
          </button>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            {manager?.photo ? (
              <img src={manager.photo} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <AiOutlineUser color="white" size={30} />
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{manager?.firstName} {manager?.lastName}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{manager?.roles?.[0]?.type || "Manager"}</p>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Email",      value: manager?.email },
            { label: "Department", value: manager?.departmentId?.name || manager?.department },
            { label: "Role",       value: manager?.roles?.[0]?.type },
            { label: "Phone",      value: manager?.phone || "—" },
            { label: "Job Title",  value: manager?.jobTitle || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1d2939", maxWidth: 220, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: 11, borderRadius: 10, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 600, color: "#344054", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ManagersPage = () => {
  const [search, setSearch]               = useState("");
  const [managers, setManagers]           = useState<any[]>([]);
  const [loadingData, setLoadingData]     = useState(true);
  const [fetchError, setFetchError]       = useState("");
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showAddModal, setShowAddModal]   = useState(false);
  const [viewManager, setViewManager]     = useState<any | null>(null);

  // ── Fetch managers ──────────────────────────────────────────────────────────

  const fetchManagers = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/manager`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      const rows: any[] =
        Array.isArray(data)            ? data :
        Array.isArray(data.data)       ? data.data :
        Array.isArray(data.data?.data) ? data.data.data :
        [];
      setManagers(rows);
    } catch (err) {
      console.error(err);
      setFetchError("Failed to load managers. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchManagers(); }, []);

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Manager Name</span>,
      cell: (row: any) => (
        <div className="w-100 d-flex align-items-center gap-2">
          <div className="d-flex justify-content-center align-items-center bg-primary" style={{ width: 35, height: 35, borderRadius: "50%", flexShrink: 0 }}>
            {row?.photo ? (
              <img src={row.photo} alt="manager" style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <AiOutlineUser color="white" size={19} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 400 }}>{row?.firstName} {row?.lastName}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#A7A7A7" }}>
              {row?.email?.length < 27 ? row?.email : `${row?.email?.substring(0, 28)}...`}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: <span className="font-weight-bold fs-13">Department</span>,
      selector: (row: any) => row?.departmentId?.name || row?.department || "—",
    },
    {
      name: <span className="font-weight-bold fs-13">Role</span>,
      selector: (row: any) => row?.roles?.[0]?.type || "Manager",
    },
    {
      name: <span className="font-weight-bold fs-13">Action</span>,
      cell: (row: any) => (
        <AiFillEye size={20} style={{ cursor: "pointer", color: "#33A6CD" }} onClick={() => setViewManager(row)} />
      ),
    },
  ];

  const filtered = managers.filter((item) => {
    if (!search) return true;
    return [item?.firstName, item?.lastName, item?.departmentId?.name, item?.department, item?.email].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ── Template download ───────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const csv = "National ID,Full Name,Department,Job Title,Salary,Bank Account Details\n1234567890123,John Doe,Engineering,Software Engineer,45000,ZAR123456789\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "KagoHC_Employee_Import_Template.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV upload ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadedFileName(file.name);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/employee/import`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setUploadSuccess(true);
        fetchManagers();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Upload failed:", data);
        setUploadSuccess(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">

          {/* Data Migration */}
          <Card style={{ ...employeeTbl, marginBottom: "30px" }}>
            <CardBody>
              <div style={{ fontSize: 18, fontWeight: "bolder", marginBottom: "20px", color: "#1A202C" }}>Data Migration</div>
              <p style={{ color: "#718096", marginBottom: "20px" }}>
                Import employees using the pre-formatted template. Supported fields: National ID, Full Name, Department, Job Title, Salary, Bank Account Details.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <ButtonBtn Title="Download Employee Import Template" BackgroundColor="#33A6CD" ColorText="white" BorderColor="#33A6CD" borderRadius={20} handleOnclick={handleDownloadTemplate} icon={<AiOutlineDownload size={18} />} />
                <label className="btn" style={{ fontWeight: "600", color: "white", backgroundColor: "#33A6CD", borderRadius: 20, padding: "10px 24px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <AiOutlineUpload size={18} />
                  Upload Employee Data (CSV)
                  <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} style={{ display: "none" }} disabled={isUploading} />
                </label>
              </div>
              {isUploading && <div className="mt-3"><Spinner size="sm" /> Processing uploaded file...</div>}
              {uploadSuccess && (
                <Alert color="success" className="mt-3">
                  ✓ Successfully imported employees from <strong>{uploadedFileName}</strong>.
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Managers Table */}
          {fetchError && <Alert color="danger" className="mb-3">{fetchError}</Alert>}

          <div className="w-100 mb-3 d-flex justify-content-between align-items-center">
            <SearchInput Title="Search Managers" search={search} setSearch={setSearch} radius={20} />
            <ButtonBtn Title="Add Manager" BackgroundColor="#33A6CD" ColorText="white" BorderColor="#33A6CD" borderRadius={20} handleOnclick={() => setShowAddModal(true)} />
          </div>

          <Card style={employeeTbl}>
            <CardBody>
              <div style={employeeTblTitle}>Managers</div>
              {loadingData ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner color="primary" /> <span className="ms-2">Loading managers...</span>
                </div>
              ) : (
                <DataTable
                  fixedHeader
                  fixedHeaderScrollHeight="400px"
                  columns={columns}
                  responsive
                  data={filtered}
                  pagination
                  highlightOnHover
                  noDataComponent={<div style={{ padding: 32, color: "#667085" }}>No managers found.</div>}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </Container>

      {showAddModal && (
        <AddManagerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchManagers(); }}
        />
      )}

      {viewManager && (
        <ViewManagerModal manager={viewManager} onClose={() => setViewManager(null)} />
      )}
    </React.Fragment>
  );
};
