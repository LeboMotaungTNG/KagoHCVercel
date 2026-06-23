import React, { useState, useEffect } from "react";
import { Container, Card, CardBody, Spinner } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch, AiOutlineUser, AiOutlineClose } from "react-icons/ai";
import SharedLayout from "./SharedLayout";
import PhoneInput from "../../shared/components/PhoneInput";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

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

const ButtonBtn = ({ Title, BackgroundColor, ColorText, BorderColor, borderRadius, handleOnclick, pending, type }: any) => (
  <button
    className="btn"
    style={{ fontWeight: "600", color: ColorText, borderColor: BorderColor, borderWidth: "2px", borderStyle: "solid", borderRadius, backgroundColor: BackgroundColor }}
    type={type}
    onClick={handleOnclick}
    disabled={pending}
  >
    <div className="d-flex justify-content-center align-items-center">
      {!pending ? <span>{Title}</span> : <><Spinner size="sm" /> <span> Loading</span></>}
    </div>
  </button>
);

// ─── Add Employee Modal ───────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    department: "", jobTitle: "", nationalId: "",
    salary: "", bankAccount: "", password: "",
    role: "user",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    const required = ["firstName", "lastName", "email", "password", "department"];
    const missing = required.filter(k => !(form as any)[k].trim());
    if (missing.length) { setError("Please fill in all required fields (marked with *)."); return; }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName:   form.firstName.trim(),
          lastName:    form.lastName.trim(),
          email:       form.email.trim(),
          phone:       form.phone.trim(),
          department:  form.department.trim(),
          position:    form.jobTitle.trim(),
          nationalId:  form.nationalId.trim(),
          salary:      form.salary ? Number(form.salary) : undefined,
          bankAccount: form.bankAccount.trim(),
          password:    form.password,
          role:        form.role,
          createAccount: true,
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || data.error?.message || "Failed to create employee.");
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
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 580, borderRadius: 16, background: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1d2939" }}>Add Employee</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#667085" }}>Create a new employee account</p>
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
              <input style={inputStyle} placeholder="e.g. Alinah" value={form.firstName} onChange={setField("firstName")} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} placeholder="e.g. Molepo" value={form.lastName} onChange={setField("lastName")} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input style={inputStyle} type="email" placeholder="alinah.m@company.com" value={form.email} onChange={setField("email")} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Department *</label>
              <input style={inputStyle} placeholder="e.g. Design" value={form.department} onChange={setField("department")} />
            </div>
            <div>
              <label style={labelStyle}>Job Title</label>
              <input style={inputStyle} placeholder="e.g. UI Designer" value={form.jobTitle} onChange={setField("jobTitle")} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>National ID</label>
              <input style={inputStyle} placeholder="e.g. 9001015009087" value={form.nationalId} onChange={setField("nationalId")} />
            </div>
            <div>
              <label style={labelStyle}>Salary (ZAR)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 35000" value={form.salary} onChange={setField("salary")} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Bank Account Details</label>
            <input style={inputStyle} placeholder="e.g. FNB 123456789" value={form.bankAccount} onChange={setField("bankAccount")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.role} onChange={setField("role")}>
                <option value="user">Employee</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="password" placeholder="Temporary password" value={form.password} onChange={setField("password")} />
            </div>
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
            {saving ? <><Spinner size="sm" /> Creating...</> : "Create Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Employee Modal ──────────────────────────────────────────────────────

function ViewEmployeeModal({ employee, onClose }: { employee: any; onClose: () => void }) {
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
            {employee?.photo ? (
              <img src={employee.photo} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <AiOutlineUser color="white" size={30} />
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{employee?.firstName} {employee?.lastName}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{employee?.roles?.[0]?.type || "Employee"}</p>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Email",      value: employee?.email },
            { label: "Department", value: employee?.departmentId?.name || employee?.department },
            { label: "Role",       value: employee?.roles?.[0]?.type },
            { label: "Phone",      value: employee?.phone || "—" },
            { label: "Job Title",  value: employee?.jobTitle || "—" },
            { label: "National ID",value: employee?.nationalId || "—" },
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

export const EmployeesPage = () => {
  const [search, setSearch]             = useState("");
  const [employees, setEmployees]       = useState<any[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<any | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchEmployees = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/employees`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      const rows: any[] =
        Array.isArray(data)            ? data :
        Array.isArray(data.data)       ? data.data :
        Array.isArray(data.data?.data) ? data.data.data :
        [];
      setEmployees(rows);
    } catch (err) {
      console.error(err);
      setFetchError("Failed to load employees. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Employee Name</span>,
      cell: (row: any) => (
        <div style={{ width: "100%" }}>
          <div className="w-100 d-flex align-items-center gap-2">
            <div className="d-flex justify-content-center align-items-center bg-primary" style={{ width: 35, height: 35, borderRadius: "50%", flexShrink: 0 }}>
              {row?.photo ? (
                <img src={row.photo} alt="employee" style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }} />
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
        </div>
      ),
    },
    {
      name: <span className="font-weight-bold fs-13">Department</span>,
      selector: (row: any) => row?.departmentId?.name || row?.department || "—",
    },
    {
      name: <span className="font-weight-bold fs-13">Role</span>,
      selector: (row: any) => row?.roles?.[0]?.type || "Employee",
    },
    {
      name: <span className="font-weight-bold fs-13">Action</span>,
      cell: (row: any) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <AiFillEye size={20} className="mx-1" style={{ cursor: "pointer", color: "#33A6CD" }} onClick={() => setViewEmployee(row)} />
        </div>
      ),
    },
  ];

  const filteredEmployees = employees.filter((item) => {
    if (!search) return true;
    return [item?.firstName, item?.lastName, item?.departmentId?.name, item?.department, item?.email].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">

          {fetchError && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, fontSize: 14, color: "#b42318" }}>
              {fetchError}
            </div>
          )}

          <div className="w-100 mb-3 d-flex justify-content-between">
            <SearchInput Title="Search" search={search} setSearch={setSearch} radius={20} />
            <div style={{ fontSize: 18, fontWeight: "bolder" }}>
              <ButtonBtn
                Title="Add Employee"
                type="button"
                BackgroundColor="#33A6CD"
                ColorText="white"
                BorderColor="#33A6CD"
                borderRadius={20}
                handleOnclick={() => setShowAddModal(true)}
                pending={false}
              />
            </div>
          </div>

          <Card style={employeeTbl}>
            <CardBody>
              <div style={employeeTblTitle}>Employees</div>
              {loadingData ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner color="primary" /> <span className="ms-2">Loading employees...</span>
                </div>
              ) : (
                <DataTable
                  fixedHeader
                  fixedHeaderScrollHeight="300px"
                  columns={columns}
                  responsive
                  data={filteredEmployees}
                  pagination
                  highlightOnHover
                  noDataComponent={<div style={{ padding: 32, color: "#667085" }}>No employees found.</div>}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </Container>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchEmployees(); }}
        />
      )}

      {viewEmployee && (
        <ViewEmployeeModal employee={viewEmployee} onClose={() => setViewEmployee(null)} />
      )}
    </React.Fragment>
  );
};

export default () => (
  <SharedLayout>
    <EmployeesPage />
  </SharedLayout>
);
