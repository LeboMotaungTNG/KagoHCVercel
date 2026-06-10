import React, { useState, useEffect } from "react";
import { Container, Card, CardBody, Button, Spinner, Alert } from "reactstrap";
import DataTable from "react-data-table-component";
import { 
  AiFillEye, AiOutlineSearch, AiOutlineUser, AiOutlineDownload, 
  AiOutlineUpload, AiOutlineClose, AiOutlineArrowUp, AiOutlineArrowDown,
  AiOutlineWarning, AiOutlineCheckCircle
} from "react-icons/ai";
import { refreshUserData, handleRoleChangeRedirect } from "../../shared/utils/employee";

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

// ─── PROMOTE TO MANAGER MODAL (Select from existing employees) ────────────────
function PromoteToManagerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [managerLevel, setManagerLevel] = useState("manager");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchEligibleEmployees();
    return () => { document.body.style.overflow = ""; };
  }, []);

  const fetchEligibleEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/employees?isManager=false`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      let employeesList = [];
      if (data.success && Array.isArray(data.data)) {
        employeesList = data.data;
      } else if (Array.isArray(data)) {
        employeesList = data;
      }
      setEmployees(employeesList);
    } catch (err) {
      console.error(err);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const isCurrentUser = currentUser?._id === selectedEmployee._id || currentUser?.email === selectedEmployee.email;

      const response = await fetch(`${API_URL}/employees/${selectedEmployee._id}/promote-to-manager`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          managerLevel: managerLevel,
          reason: reason || `Promoted to ${managerLevel}`
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        console.log("✅ Promotion successful!");
        
        // If the promoted user is the current logged-in user, handle role change
        if (isCurrentUser) {
          console.log("🔄 Current user was promoted - refreshing session...");
          await handleRoleChangeRedirect();
        }
        
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to promote employee");
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
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1d2939" }}>Promote to Manager</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#667085" }}>Select an existing employee to promote</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", padding: 4, display: "flex" }}>
            <AiOutlineClose size={20} />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#b42318", display: "flex", alignItems: "center", gap: 8 }}>
              <AiOutlineWarning /> {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Select Employee *</label>
            {loading ? (
              <div style={{ textAlign: "center", padding: 20 }}><Spinner size="sm" /> Loading employees...</div>
            ) : employees.length === 0 ? (
              <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center", color: "#667085" }}>
                No eligible employees found. All employees are already managers.
              </div>
            ) : (
              <select 
                style={inputStyle} 
                value={selectedEmployee?._id || ""} 
                onChange={(e) => {
                  const emp = employees.find(e2 => e2._id === e.target.value);
                  setSelectedEmployee(emp);
                }}
              >
                <option value="">-- Select an employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.position || "No position"} ({emp.department || "No department"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedEmployee && (
            <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 12, color: "#166534", marginBottom: 4 }}>Selected Employee:</div>
              <div style={{ fontWeight: 600, color: "#14532d" }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
              <div style={{ fontSize: 12, color: "#15803d" }}>Department: {selectedEmployee.department || "—"} | Joined: {selectedEmployee.start_date || "—"}</div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Manager Level</label>
            <select style={inputStyle} value={managerLevel} onChange={(e) => setManagerLevel(e.target.value)}>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="senior_manager">Senior Manager</option>
              <option value="director">Director</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Reason for Promotion (Optional)</label>
            <textarea 
              style={{ ...inputStyle, height: 80, resize: "vertical", paddingTop: 8 }}
              placeholder="e.g., Performance excellence, team expansion, restructuring..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f2f4f7", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={handlePromote}
            disabled={saving || !selectedEmployee}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#10b981", fontSize: 14, fontWeight: 600, color: "#fff", cursor: (saving || !selectedEmployee) ? "not-allowed" : "pointer", opacity: (saving || !selectedEmployee) ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving ? <><Spinner size="sm" /> Promoting...</> : <><AiOutlineArrowUp /> Promote to Manager</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DEMOTE MANAGER MODAL ────────────────────────────────────────────────────
function DemoteManagerModal({ manager, onClose, onSuccess }: { manager: any; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleDemote = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const isCurrentUser = currentUser?._id === manager._id || currentUser?.email === manager.email;

      const response = await fetch(`${API_URL}/employees/${manager._id}/demote-from-manager`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Demoted from manager role" }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        console.log("✅ Demotion successful!");
        
        // If the demoted user is the current logged-in user, handle role change
        if (isCurrentUser) {
          console.log("🔄 Current user was demoted - refreshing session...");
          await handleRoleChangeRedirect();
        }
        
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to demote manager");
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
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: 16, background: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1d2939" }}>Demote Manager</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#667085" }}>This will revert to employee role</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", padding: 4, display: "flex" }}>
            <AiOutlineClose size={20} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#b42318", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 4 }}>⚠️ Warning: This action will:</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#7f1d1d" }}>
              <li>Remove all manager permissions</li>
              <li>Convert {manager?.firstName} {manager?.lastName} back to employee</li>
              <li>Remove from manager hierarchy</li>
            </ul>
          </div>

          <div>
            <label style={labelStyle}>Reason for Demotion (Optional)</label>
            <textarea 
              style={{ ...inputStyle, height: 80, resize: "vertical", paddingTop: 8 }}
              placeholder="e.g., Role change, performance issues, restructuring..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f2f4f7", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={handleDemote}
            disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#ef4444", fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving ? <><Spinner size="sm" /> Demoting...</> : <><AiOutlineArrowDown /> Demote to Employee</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MANAGER MODAL (with Demote button) ─────────────────────────────────
function ViewManagerModal({ manager, onClose, onDemote }: { manager: any; onClose: () => void; onDemote: () => void }) {
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
            <AiOutlineUser color="white" size={30} />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{manager?.firstName} {manager?.lastName}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{manager?.managerLevel || "Manager"}</p>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Email", value: manager?.email },
            { label: "Department", value: manager?.department },
            { label: "Role", value: manager?.role === "admin" ? "Manager" : "Admin" },
            { label: "Manager Level", value: manager?.managerLevel || "Manager" },
            { label: "Since", value: manager?.managerSince ? new Date(manager.managerSince).toLocaleDateString() : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1d2939", maxWidth: 220, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 600, color: "#344054", cursor: "pointer" }}>Close</button>
          <button onClick={onDemote} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#ef4444", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <AiOutlineArrowDown /> Demote
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const ManagersPage = () => {
  const [search, setSearch] = useState("");
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [viewManager, setViewManager] = useState<any | null>(null);
  const [demoteManager, setDemoteManager] = useState<any | null>(null);

  // Fetch managers (users with isManager = true)
  const fetchManagers = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/employees?isManager=true`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      
      let rows: any[] = [];
      if (data.success && Array.isArray(data.data)) {
        rows = data.data;
      } else if (Array.isArray(data)) {
        rows = data;
      }
      
      setManagers(rows);
    } catch (err) {
      console.error(err);
      setFetchError("Failed to load managers. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchManagers(); }, []);

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Manager Name</span>,
      cell: (row: any) => (
        <div className="w-100 d-flex align-items-center gap-2">
          <div className="d-flex justify-content-center align-items-center" style={{ width: 35, height: 35, borderRadius: "50%", background: "#33A6CD", flexShrink: 0 }}>
            <AiOutlineUser color="white" size={19} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{row?.firstName} {row?.lastName}</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: "#A7A7A7" }}>
              {row?.email?.length < 27 ? row?.email : `${row?.email?.substring(0, 28)}...`}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: <span className="font-weight-bold fs-13">Department</span>,
      selector: (row: any) => row?.department || "—",
    },
    {
      name: <span className="font-weight-bold fs-13">Manager Level</span>,
      cell: (row: any) => {
        const level = row?.managerLevel || "manager";
        const colors: Record<string, string> = {
          team_lead: "#8b5cf6",
          manager: "#10b981",
          senior_manager: "#3b82f6",
          director: "#f59e0b",
        };
        const labels: Record<string, string> = {
          team_lead: "Team Lead",
          manager: "Manager",
          senior_manager: "Senior Manager",
          director: "Director",
        };
        return <span style={{ background: `${colors[level]}20`, color: colors[level], padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{labels[level] || "Manager"}</span>;
      },
    },
    {
      name: <span className="font-weight-bold fs-13">Since</span>,
      selector: (row: any) => row?.managerSince ? new Date(row.managerSince).toLocaleDateString() : "—",
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
    return [item?.firstName, item?.lastName, item?.department, item?.email].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">
          <div className="w-100 mb-3 d-flex justify-content-between align-items-center">
            <SearchInput Title="Search Managers" search={search} setSearch={setSearch} radius={20} />
            <ButtonBtn 
              Title="Promote to Manager" 
              BackgroundColor="#10b981" 
              ColorText="white" 
              BorderColor="#10b981" 
              borderRadius={20} 
              handleOnclick={() => setShowPromoteModal(true)} 
              icon={<AiOutlineArrowUp size={18} />}
            />
          </div>

          <Card style={employeeTbl}>
            <CardBody>
              <div style={employeeTblTitle}>Managers</div>
              {fetchError && <Alert color="danger" className="mb-3">{fetchError}</Alert>}
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
                  noDataComponent={<div style={{ padding: 32, color: "#667085" }}>No managers found. Promote employees to create managers.</div>}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </Container>

      {showPromoteModal && (
        <PromoteToManagerModal
          onClose={() => setShowPromoteModal(false)}
          onSuccess={() => { fetchManagers(); }}
        />
      )}

      {viewManager && (
        <ViewManagerModal 
          manager={viewManager} 
          onClose={() => setViewManager(null)} 
          onDemote={() => {
            setViewManager(null);
            setDemoteManager(viewManager);
          }}
        />
      )}

      {demoteManager && (
        <DemoteManagerModal
          manager={demoteManager}
          onClose={() => setDemoteManager(null)}
          onSuccess={() => { fetchManagers(); setDemoteManager(null); }}
        />
      )}
    </React.Fragment>
  );
};
