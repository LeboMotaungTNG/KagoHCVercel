import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";

const API_URL  = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
const getToken = () => localStorage.getItem("token") || "";

const AVATAR_COLORS = ["#E6A79E","#12b76a","#f79009","#ee46bc","#7a5af8","#f04438","#0891b2","#059669"];

function initials(first: string, last: string) {
  return `${first?.[0]||""}${last?.[0]||""}`.toUpperCase();
}

interface Employee {
  _id: string; employeeId: string; firstName: string; lastName: string;
  email: string; department: any; position: string; status: string; onPayroll: boolean;
}

function EmployeesContent() {
  const navigate  = useNavigate();
  const [search, setSearch]       = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string|null>(null);

  useEffect(() => {
    const t = getToken(); const u = localStorage.getItem("user");
    if (!t || !u) { navigate("/"); return; }
  }, [navigate]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `${res.status}`);
      const arr = Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : [];
      setEmployees(arr);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const getDept = (emp: Employee) => emp.department?.name || emp.department || "Unassigned";

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.firstName, e.lastName, e.employeeId, e.email, getDept(e), e.position].some(f => f?.toLowerCase().includes(q));
  });

  const stats = {
    total:    employees.length,
    depts:    new Set(employees.map(getDept)).size,
    active:   employees.filter(e => e.status === "active").length,
    onPayroll:employees.filter(e => e.onPayroll === true).length,
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1d2939", margin: 0 }}>All Employees</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>Home � All Employees</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Employees", value: stats.total,     color: "#E6A79E" },
          { label: "Departments",     value: stats.depts,     color: "#12b76a" },
          { label: "Active",          value: stats.active,    color: "#f79009" },
          { label: "On Payroll",      value: stats.onPayroll, color: "#7a5af8" },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 16, border: "1px solid #e4e7ec", padding: 20, background: "#fff" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: s.color }}>{s.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, color: "#1d2939" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec", padding: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1d2939" }}>Employee Directory</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>Showing {filtered.length} of {employees.length}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="text" placeholder="Search employees�" value={search} onChange={e => setSearch(e.target.value)}
              style={{ height: 40, width: 260, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 12px", fontSize: 14, outline: "none" }} />
            <button onClick={fetchEmployees} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#E6A79E", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Refresh</button>
            <button onClick={() => navigate("/manager/manage-employees")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1d2939", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>+ Add</button>
          </div>
        </div>

        {error && <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 14 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{ display: "inline-block", width: 36, height: 36, border: "3px solid #f3f4f6", borderTopColor: "#E6A79E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ marginTop: 12, color: "#9ca3af" }}>Loading employees�</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
            <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                  {["Employee","Department","Position","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>No employees found</td></tr>
                ) : filtered.map((emp, idx) => (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f2f4f7" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                          {initials(emp.firstName, emp.lastName)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1d2939" }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 12, color: "#98a2b3" }}>{emp.email}</div>
                          <div style={{ fontSize: 11, color: "#98a2b3" }}>ID: {emp.employeeId || emp._id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{getDept(emp)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{emp.position || "�"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: emp.status === "active" ? "#ecfdf3" : "#fef3c7",
                        color: emp.status === "active" ? "#027a48" : "#d97706" }}>
                        {emp.status || "inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => navigate(`/manager/profile?id=${emp._id}`)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #d0d5dd", background: "#fff", color: "#344054" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const EmployeesPage: React.FC = () => (
  <SharedLayout title="All Employees"><EmployeesContent /></SharedLayout>
);
export default EmployeesPage;
