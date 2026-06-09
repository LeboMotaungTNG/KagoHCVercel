import React, { useState, useEffect, useCallback } from "react";
import { Users, Building2, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModernEmployeeTable } from "./ModernEmployeeTable";
import { ModernAnalyticsSection } from "./ModernAnalyticsSection";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgAnalytics {
  employeeCount: number;
  departmentCount: number;
  mostPerformingDept: string;
  leastPerformingDept: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: { name: string } | string;
  roles: { type: string }[];
  department?: string;
  role?: string;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 20, radius = 8 }: { width?: string | number; height?: number; radius?: number }) => (
  <div style={{
    width, height, borderRadius: radius,
    background: "linear-gradient(90deg, #e8eaed 25%, #f4f5f7 50%, #e8eaed 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  }} />
);

// ─── Metric Card ──────────────────────────────────────────────────────────────

const MetricCard = ({
  title, value, sub, icon, color, loading,
}: {
  title: string; value: string | number; sub: string;
  icon: React.ReactNode; color: string; loading: boolean;
}) => (
  <div
    style={{
      backgroundColor: color, borderRadius: 16, padding: 24, color: "white",
      boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "default",
    }}
    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.15)"; }}
    onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)"; }}
  >
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 10px", opacity: 0.9 }}>{title}</h3>
        {loading
          ? <Skeleton width={80} height={36} radius={6} />
          : <p style={{ fontSize: 36, fontWeight: 700, margin: 0, lineHeight: 1 }}>{value}</p>
        }
      </div>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
    </div>
    <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: 16, fontSize: 13, fontWeight: 500, display: "inline-block" }}>
      {sub}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const OwnerOverview = () => {
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [orgAnalytics, setOrgAnalytics] = useState<OrgAnalytics>({
    employeeCount: 0,
    departmentCount: 0,
    mostPerformingDept: "—",
    leastPerformingDept: "—",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);

  const token = localStorage.getItem("token");
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch employees + departments in parallel
      const [empRes, deptRes] = await Promise.allSettled([
        fetch(`${API_URL}/employee`, { headers: H }),
        fetch(`${API_URL}/department`, { headers: H }),
      ]);

      // ── Employees ──
      let empRows: any[] = [];
      if (empRes.status === "fulfilled" && empRes.value.ok) {
        const d = await empRes.value.json();
        empRows =
          Array.isArray(d) ? d :
          Array.isArray(d.data) ? d.data :
          Array.isArray(d.data?.data) ? d.data.data : [];
      }

      // ── Departments ──
      let deptRows: any[] = [];
      if (deptRes.status === "fulfilled" && deptRes.value.ok) {
        const d = await deptRes.value.json();
        deptRows =
          Array.isArray(d) ? d :
          Array.isArray(d.data) ? d.data :
          Array.isArray(d.data?.data) ? d.data.data : [];
      }

      // ── Map employees for the table ──
      const mappedEmployees: Employee[] = empRows.map((e: any, i: number) => ({
        id: e._id || e.id || String(i),
        firstName: e.firstName || "",
        lastName: e.lastName || "",
        email: e.email || "",
        departmentId: typeof e.departmentId === "object" && e.departmentId?.name
          ? e.departmentId
          : { name: e.department || e.departmentId || "—" },
        roles: Array.isArray(e.roles) && e.roles.length > 0
          ? e.roles
          : [{ type: e.role || "Employee" }],
      }));

      setEmployees(mappedEmployees);

      // ── Compute department performance from employee count ──
      // Group employees per department
      const deptCounts: Record<string, number> = {};
      empRows.forEach((e: any) => {
        const deptName =
          (typeof e.departmentId === "object" ? e.departmentId?.name : null) ||
          e.department || "Unknown";
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });

      // Merge with department list (so empty depts show up too)
      deptRows.forEach((d: any) => {
        const name = d.name || "Unknown";
        if (!(name in deptCounts)) deptCounts[name] = 0;
      });

      const deptEntries = Object.entries(deptCounts);
      const sortedDepts = deptEntries.sort((a, b) => b[1] - a[1]);
      const topDept    = sortedDepts[0]?.[0] || "—";
      const bottomDept = sortedDepts[sortedDepts.length - 1]?.[0] || "—";

      setOrgAnalytics({
        employeeCount:       empRows.length,
        departmentCount:     Math.max(deptRows.length, deptEntries.length),
        mostPerformingDept:  topDept,
        leastPerformingDept: bottomDept !== topDept ? bottomDept : (sortedDepts[1]?.[0] || "—"),
      });

      setLastRefresh(new Date());
    } catch (err: any) {
      console.error("OwnerOverview fetch error:", err);
      setError("Some data failed to load. Showing partial results.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "inherit", padding: 32, backgroundColor: "#f9f7f5", maxWidth: 1400, margin: "0 auto", borderRadius: 8 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 32, margin: "0 0 8px", fontWeight: 700, color: "#2D3748", letterSpacing: "-0.5px" }}>
            Owner Overview
          </h1>
          <p style={{ fontSize: 15, color: "#718096", margin: 0 }}>
            Comprehensive view of your organisation's structure and performance
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && !loading && (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Updated {lastRefresh.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 20, border: "1px solid #e2e8f0",
              background: "#fff", fontSize: 13, fontWeight: 600, color: "#4a5568",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, marginBottom: 24 }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ fontSize: 13, color: "#b42318" }}>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        <MetricCard
          title="Total Employees"
          value={orgAnalytics.employeeCount}
          sub="Across all departments"
          icon={<Users size={24} />}
          color="#3182CE"
          loading={loading}
        />
        <MetricCard
          title="Departments"
          value={orgAnalytics.departmentCount}
          sub="Organisation structure"
          icon={<Building2 size={24} />}
          color="#805AD5"
          loading={loading}
        />
        <MetricCard
          title="Top Department"
          value={loading ? "—" : orgAnalytics.mostPerformingDept}
          sub="Most headcount"
          icon={<TrendingUp size={24} />}
          color="#48BB78"
          loading={loading}
        />
        <MetricCard
          title="Needs Attention"
          value={loading ? "—" : orgAnalytics.leastPerformingDept}
          sub="Least headcount"
          icon={<TrendingDown size={24} />}
          color="#F687B3"
          loading={loading}
        />
      </div>

      {/* Employee Table */}
      {loading ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 24 }}>
          <Skeleton width={180} height={22} radius={6} />
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} radius={8} />)}
          </div>
        </div>
      ) : (
        <ModernEmployeeTable
          Navigate={navigate}
          filteredEmployeesData={employees}
        />
      )}

      {/* Analytics Section */}
      <ModernAnalyticsSection orgAnalytics={orgAnalytics} />
    </div>
  );
};
