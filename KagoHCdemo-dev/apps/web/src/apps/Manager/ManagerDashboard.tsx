import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
const token = () => localStorage.getItem("token") || "";

function getMonthYear(d: Date) {
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ employees: 0, pendingLeave: 0, presentToday: 0, onPayroll: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState<any>(null);

  useEffect(() => {
    const t = token(); const u = localStorage.getItem("user");
    if (!t || !u) { navigate("/"); return; }
    try { setUser(JSON.parse(u)); } catch { navigate("/"); return; }
  }, [navigate]);

  useEffect(() => {
    if (!token()) return;
    const headers = { Authorization: `Bearer ${token()}` };
    const today   = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch(`${API_URL}/employees`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/leave/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/attendance`, { headers }).then(r => r.json()),
    ]).then(([empData, leaveData, attData]) => {
      const emps = Array.isArray(empData?.data?.data) ? empData.data.data : Array.isArray(empData?.data) ? empData.data : [];
      const att  = Array.isArray(attData?.data) ? attData.data : [];
      const todayAtt = att.filter((r: any) => String(r.date || "").split("T")[0] === today);
      setCounts({
        employees:    emps.length,
        pendingLeave: leaveData?.data?.pending || 0,
        presentToday: todayAtt.filter((r: any) => ["present","late","half_day"].includes(r.status)).length,
        onPayroll:    emps.filter((e: any) => e.onPayroll === true).length,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const firstName = user?.firstName || "Manager";
  const cards = [
    { label: "Total Employees",    value: loading ? "…" : counts.employees,    color: "#3182CE", link: "/manager/employees" },
    { label: "Present Today",      value: loading ? "…" : counts.presentToday, color: "#48BB78", link: "/manager/attendance" },
    { label: "Pending Leave",      value: loading ? "…" : counts.pendingLeave, color: "#ED8936", link: "/manager/leave-requests" },
    { label: "On Payroll",         value: loading ? "…" : counts.onPayroll,    color: "#805AD5", link: "/manager/payroll" },
  ];

  return (
    <SharedLayout title="Dashboard">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1d2939", margin: 0 }}>
            Welcome back, {firstName} 👋
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>{getMonthYear(new Date())}</p>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
          {cards.map(c => (
            <div key={c.label} onClick={() => navigate(c.link)} style={{ borderRadius: 16, border: "1px solid #e4e7ec", background: "#fff", padding: 20, cursor: "pointer", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: c.color }}>{c.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 700, color: "#1d2939" }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: "#1d2939" }}>Quick Navigation</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              { label: "Add Employee",       path: "/manager/manage-employees", color: "#E6A79E" },
              { label: "All Employees",      path: "/manager/employees",        color: "#3182CE" },
              { label: "Attendance",         path: "/manager/attendance",       color: "#48BB78" },
              { label: "Leave Requests",     path: "/manager/leave-requests",   color: "#ED8936" },
              { label: "Payroll",            path: "/manager/payroll",          color: "#805AD5" },
              { label: "Employee Profile",   path: "/manager/profile",          color: "#667085" },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: a.color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                onMouseOver={e => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseOut={e =>  { e.currentTarget.style.opacity = "1"; }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default ManagerDashboard;
