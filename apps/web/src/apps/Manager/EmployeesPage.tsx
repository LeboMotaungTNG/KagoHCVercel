import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";
import { API_URL, C } from "../../shared/utils/employee";
import { Users } from "lucide-react";
import { PageHero, PerformancePage, SectionCard, StatTile, perfBtnHero, mgrSearch, mgrInput } from "./managerUi";

const getToken = () => localStorage.getItem("token") || "";

const AVATAR_COLORS = [C.coral,"#12b76a","#f79009","#ee46bc","#7a5af8","#f04438","#0891b2","#059669"];

function initials(first: string, last: string) {
  return `${first?.[0]||""}${last?.[0]||""}`.toUpperCase();
}

interface Employee {
  _id: string; employeeId: string; firstName: string; lastName: string;
  email: string; department: any; position: string; status: string; onPayroll: boolean;
}

export interface EmployeesContentProps {
  departmentOnly?: string;
  readOnly?: boolean;
}

export function EmployeesContent({ departmentOnly, readOnly = false }: EmployeesContentProps = {}) {
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

  const departmentEmployees = departmentOnly
    ? employees.filter(e => getDept(e).toLowerCase() === departmentOnly.toLowerCase())
    : employees;

  const filtered = departmentEmployees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.firstName, e.lastName, e.employeeId, e.email, getDept(e), e.position].some(f => f?.toLowerCase().includes(q));
  });

  const stats = {
    total:    departmentEmployees.length,
    depts:    new Set(departmentEmployees.map(getDept)).size,
    active:   departmentEmployees.filter(e => e.status === "active").length,
    onPayroll:departmentEmployees.filter(e => e.onPayroll === true).length,
  };

  return (
    <PerformancePage maxWidth={1200}>
      <PageHero
        icon={<Users size={24} color="#fff" />}
        title={departmentOnly ? "My Department" : "All Employees"}
        subtitle={departmentOnly ? `Employees in ${departmentOnly}` : "Search the team directory and open profiles."}
        actions={
          <>
            <button type="button" onClick={fetchEmployees} style={perfBtnHero}>Refresh</button>
            {!readOnly && (
              <button type="button" onClick={() => navigate("/manager/manage-employees")} style={perfBtnHero}>
                + Add
              </button>
            )}
          </>
        }
      />

      <div className="row g-3 mb-4">
        {[
          { label: "Total Employees", value: String(stats.total), color: C.primary, bg: C.primaryBg, icon: <Users size={16} /> },
          { label: "Departments", value: String(stats.depts), color: C.green, bg: C.greenBg, icon: <Users size={16} /> },
          { label: "Active", value: String(stats.active), color: C.amber, bg: C.amberBg, icon: <Users size={16} /> },
          { label: "On Payroll", value: String(stats.onPayroll), color: C.purple, bg: C.purpleBg, icon: <Users size={16} /> },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <StatTile label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} />
          </div>
        ))}
      </div>

      <SectionCard title="Employee Directory" actions={
        <div style={mgrSearch}>
          <input type="text" placeholder="Search employees" value={search} onChange={e => setSearch(e.target.value)} style={mgrInput} />
        </div>
      }>
        <p className="small mb-3" style={{ color: C.muted }}>Showing {filtered.length} of {departmentEmployees.length}</p>
        {error && <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 14 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{ display: "inline-block", width: 36, height: 36, border: "3px solid #f3f4f6", borderTopColor: C.coral, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ marginTop: 12, color: "#9ca3af" }}>Loading employees?</p>
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
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{emp.position || "?"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: emp.status === "active" ? "#ecfdf3" : "#fef3c7",
                        color: emp.status === "active" ? "#027a48" : "#d97706" }}>
                        {emp.status || "inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {!readOnly && <button onClick={() => navigate(`/manager/profile?id=${emp._id}`)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #d0d5dd", background: "#fff", color: "#344054" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                        View Profile
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PerformancePage>
  );
}

const EmployeesPage: React.FC = () => (
  <SharedLayout title="All Employees"><EmployeesContent /></SharedLayout>
);
export default EmployeesPage;
