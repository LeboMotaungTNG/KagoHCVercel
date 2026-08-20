import React, { useEffect, useMemo, useState } from "react";
import SharedLayout from "./SharedLayout";
import {
  BRAND,
  fetchAllEmployees,
  type EmployeeSummary,
} from "../../shared/utils/manageEmployees";
import {
  type Department,
  fetchDepartments,
  updateDepartment,
} from "../../shared/utils/onboarding";

/* ──────────────────────────────────────────────────────────────────────────
 * Icons — small, self-contained, matching the stroke style used elsewhere
 * in the Owner Human Capital pages.
 * ─────────────────────────────────────────────────────────────────────── */
const Ic = {
  Landmark: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 21 7 3 7" /></svg>,
  Building: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  User: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  AlertCircle: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Shield: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Grid: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  List: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  CheckCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Shared styling — matches sibling Owner Human Capital pages (ManagersPage /
 * EmployeesPage / ManageEmployees): bordered #D9D9D9 cards, radius 10.
 * ─────────────────────────────────────────────────────────────────────── */
const siblingCard: React.CSSProperties = {
  borderRadius: 10,
  borderWidth: 2, borderStyle: "solid", borderColor: BRAND.cardBorder,
  boxShadow: BRAND.cardShadow,
  background: "#fff",
};
const initials = (a?: string, b?: string) =>
  `${(a?.[0] || "").toUpperCase()}${(b?.[0] || "").toUpperCase()}` || "?";

const Avatar: React.FC<{ first?: string; last?: string; size?: number; tone?: "blue" | "muted" }> = ({ first, last, size = 32, tone = "blue" }) => (
  <span style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 800, letterSpacing: 0.3, color: "#fff",
    background: tone === "blue"
      ? `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`
      : "#c1c8d1",
  }}>{initials(first, last)}</span>
);

const Toast: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => (
  <div style={{
    position: "fixed", top: 84, right: 24, zIndex: 9999,
    padding: "12px 18px", borderRadius: 12,
    background: type === "success" ? BRAND.successBg : "#fef2f2",
    color: type === "success" ? "#027a48" : "#b42318",
    border: `1px solid ${type === "success" ? BRAND.successLine : "#fecaca"}`,
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
    boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
  }}>
    {type === "success" ? <Ic.CheckCircle /> : <Ic.X />}
    {message}
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Main content
 * ─────────────────────────────────────────────────────────────────────── */
function OrganizationStructureContent() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"chart" | "directory">("chart");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    setLoadError(null);
    try {
      const [depts, emps] = await Promise.all([
        fetchDepartments(),
        fetchAllEmployees(token),
      ]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load organization structure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived data ─────────────────────────────────────────────────────────
  const businessUnits = useMemo(() => departments.filter(d => !d.parentDepartment), [departments]);
  const departmentsByUnit = useMemo(() => {
    const map = new Map<string, Department[]>();
    departments.filter(d => d.parentDepartment).forEach(d => {
      const key = d.parentDepartment as string;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [departments]);

  const employeesByDeptName = useMemo(() => {
    const map = new Map<string, EmployeeSummary[]>();
    employees.forEach(e => {
      const key = (e.department || "").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [employees]);

  const deptByName = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach(d => map.set(d.name.trim(), d));
    return map;
  }, [departments]);

  const managerPool = useMemo(
    () => employees.filter(e => e.isManager && e.userId),
    [employees],
  );

  const leafDepartments = useMemo(() => departments.filter(d => d.parentDepartment), [departments]);
  const unassignedCount = useMemo(() => leafDepartments.filter(d => !d.manager).length, [leafDepartments]);

  const directoryRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter(e => !deptFilter || e.department === deptFilter)
      .filter(e => {
        if (!q) return true;
        const full = `${e.firstName} ${e.lastName} ${e.position} ${e.department}`.toLowerCase();
        return full.includes(q);
      })
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [employees, search, deptFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleExpand = (id?: string) => {
    if (!id) return;
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssignManager = async (deptId: string | undefined, userId: string) => {
    if (!deptId) return;
    setAssigning(deptId);
    try {
      const updated = await updateDepartment(deptId, { manager: userId || null });
      setDepartments(prev => prev.map(d => (d.id === deptId ? updated : d)));
      showToast(userId ? "Manager assigned." : "Manager unassigned.", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to update manager.", "error");
    } finally {
      setAssigning(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid mt-3 mb-5 w-100" style={{ padding: "0 12px" }}>
      <style>{`
        .os-card { transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease; }
        .os-card:hover { box-shadow: 0 8px 20px rgba(15,23,42,0.08); }
        .os-tab { transition: background .15s ease, color .15s ease; }
        .os-row:hover { background: ${BRAND.tint50}; }
        .os-select { transition: border-color .15s ease; }
      `}</style>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="mt-3 mb-3" style={{
        width: "100%", display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", border: "1px solid #e4e7ec", borderRadius: 20,
          padding: "10px 18px 10px 14px",
        }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%", background: BRAND.primary,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}><Ic.Landmark /></span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.ink, lineHeight: 1.2 }}>Organization Structure</div>
            <div style={{ fontSize: 11.5, color: BRAND.textMuted }}>Business units, departments, and who manages whom</div>
          </div>
        </div>

        {/* View toggle */}
        <div style={{
          display: "inline-flex", padding: 4, borderRadius: 12,
          background: BRAND.surfaceAlt, border: `1px solid ${BRAND.border}`, gap: 3,
        }}>
          {([
            { id: "chart", label: "Org Chart", icon: <Ic.Grid /> },
            { id: "directory", label: "Employees & Managers", icon: <Ic.List /> },
          ] as const).map(opt => {
            const active = view === opt.id;
            return (
              <button key={opt.id} className="os-tab" onClick={() => setView(opt.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                background: active ? BRAND.primary : "transparent",
                color: active ? "#fff" : BRAND.textMuted,
              }}>{opt.icon}{opt.label}</button>
            );
          })}
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12, marginBottom: 16,
      }}>
        {[
          { label: "Employees", value: employees.length, accent: BRAND.primary },
          { label: "Business Units", value: businessUnits.length, accent: "#805AD5" },
          { label: "Departments", value: leafDepartments.length, accent: "#0d9488" },
          { label: "Unmanaged Departments", value: unassignedCount, accent: unassignedCount > 0 ? "#f59e0b" : BRAND.success },
        ].map(t => (
          <div key={t.label} style={{ ...siblingCard, padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: 0.3 }}>{t.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: t.accent }}>{loading ? "—" : t.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ ...siblingCard, padding: 48, textAlign: "center", color: BRAND.textMuted, fontSize: 13 }}>
          Loading organization structure…
        </div>
      ) : loadError ? (
        <div style={{ ...siblingCard, padding: 32, textAlign: "center" }}>
          <div style={{ color: "#b42318", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{loadError}</div>
          <button onClick={load} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${BRAND.border}`,
            background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
          }}>Retry</button>
        </div>
      ) : businessUnits.length === 0 ? (
        <div style={{ ...siblingCard, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ color: BRAND.textFaint, marginBottom: 10 }}><Ic.Landmark /></div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: BRAND.ink }}>No structure set up yet</p>
          <p style={{ margin: "6px auto 0", maxWidth: 380, fontSize: 12.5, color: BRAND.textMuted }}>
            Add Business Units and Departments under Owner ▸ Onboarding ▸ Structure to see your organization chart here.
          </p>
        </div>
      ) : view === "chart" ? (
        /* ── ORG CHART VIEW ────────────────────────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {businessUnits.map(unit => {
            const depts = departmentsByUnit.get(unit.id || "") || [];
            const unitEmployeeCount = depts.reduce((sum, d) => sum + (employeesByDeptName.get(d.name.trim())?.length || 0), 0);
            return (
              <div key={unit.id || unit.name} style={{ ...siblingCard, overflow: "hidden" }}>
                {/* Business unit header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px",
                  background: `linear-gradient(90deg, #f3f0ff 0%, #ffffff 100%)`,
                  borderBottom: `1px solid ${BRAND.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: "#805AD5", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Ic.Landmark /></span>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 800, color: "#4c3a8f" }}>{unit.name}</div>
                      <div style={{ fontSize: 12, color: BRAND.textMuted }}>
                        {depts.length} department{depts.length === 1 ? "" : "s"} · {unitEmployeeCount} employee{unitEmployeeCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department grid */}
                <div style={{
                  padding: 18,
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 14,
                }}>
                  {depts.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: BRAND.textFaint, padding: "8px 4px" }}>
                      No departments under this business unit yet.
                    </div>
                  ) : depts.map(dept => {
                    const deptEmployees = employeesByDeptName.get(dept.name.trim()) || [];
                    const isOpen = expanded.has(dept.id || "");
                    return (
                      <div key={dept.id || dept.name} className="os-card" style={{
                        border: `1px solid ${BRAND.border}`, borderRadius: 12, overflow: "hidden",
                        background: "#fff",
                      }}>
                        <button
                          onClick={() => toggleExpand(dept.id)}
                          style={{
                            width: "100%", textAlign: "left", cursor: "pointer",
                            border: "none", background: "transparent", padding: "14px 16px",
                            display: "flex", flexDirection: "column", gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <span style={{ color: BRAND.primary, flexShrink: 0 }}><Ic.Building /></span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: BRAND.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dept.name}</span>
                            </div>
                            <span style={{ color: BRAND.textFaint, flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>
                              <Ic.ChevronDown />
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {dept.manager ? (
                              <>
                                <Avatar first={dept.manager.firstName} last={dept.manager.lastName} size={26} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {dept.manager.firstName} {dept.manager.lastName}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: BRAND.textFaint }}>Manager</div>
                                </div>
                              </>
                            ) : (
                              <div style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                fontSize: 11.5, fontWeight: 600, color: "#b54708",
                                background: "#fffaeb", border: "1px solid #fedf89",
                                padding: "3px 9px", borderRadius: 999,
                              }}>
                                <Ic.AlertCircle /> No manager assigned
                              </div>
                            )}
                          </div>

                          <div style={{
                            display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 600, color: BRAND.textMuted,
                            background: BRAND.tint100, padding: "3px 9px", borderRadius: 999,
                          }}>
                            <Ic.Users /> {deptEmployees.length} employee{deptEmployees.length === 1 ? "" : "s"}
                          </div>
                        </button>

                        {isOpen && (
                          <div style={{ borderTop: `1px solid ${BRAND.borderSoft}`, padding: "12px 16px", background: BRAND.surfaceAlt }}>
                            {/* Manager assignment control */}
                            <div style={{ marginBottom: deptEmployees.length > 0 ? 12 : 0 }}>
                              <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: BRAND.textFaint, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 5 }}>
                                Department Manager
                              </label>
                              {managerPool.length === 0 ? (
                                <p style={{ margin: 0, fontSize: 11.5, color: BRAND.textFaint }}>
                                  No promoted managers yet — promote an employee to manager first.
                                </p>
                              ) : (
                                <select
                                  className="os-select"
                                  value={dept.manager?.id || ""}
                                  disabled={assigning === dept.id}
                                  onChange={e => handleAssignManager(dept.id, e.target.value)}
                                  style={{
                                    width: "100%", padding: "7px 10px", borderRadius: 8,
                                    border: `1px solid ${BRAND.border}`, fontSize: 12.5,
                                    background: "#fff", cursor: "pointer",
                                  }}
                                >
                                  <option value="">— Unassigned —</option>
                                  {managerPool.map(m => (
                                    <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {deptEmployees.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {deptEmployees.map(e => (
                                  <span key={e.id} style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    fontSize: 11.5, fontWeight: 500, color: BRAND.text,
                                    background: "#fff", border: `1px solid ${BRAND.border}`,
                                    padding: "4px 10px 4px 6px", borderRadius: 999,
                                  }}>
                                    <Avatar first={e.firstName} last={e.lastName} size={18} tone="muted" />
                                    {e.firstName} {e.lastName}
                                    {e.isManager && <span style={{ color: BRAND.primary }}><Ic.Shield /></span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── EMPLOYEE / MANAGER DIRECTORY VIEW ─────────────────────────── */
        <div style={{ ...siblingCard, overflow: "hidden" }}>
          <div style={{
            padding: 16, borderBottom: `1px solid ${BRAND.border}`,
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          }}>
            <div style={{ position: "relative", flex: "1 1 240px", minWidth: 220 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: BRAND.textFaint }}><Ic.Search /></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, position, or department…"
                style={{
                  width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8,
                  border: `1px solid ${BRAND.border}`, fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={{
                padding: "9px 12px", borderRadius: 8, border: `1px solid ${BRAND.border}`,
                fontSize: 13, background: "#fff", cursor: "pointer",
              }}
            >
              <option value="">All departments</option>
              {leafDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <span style={{ fontSize: 12, color: BRAND.textMuted, marginLeft: "auto" }}>
              {directoryRows.length} of {employees.length}
            </span>
          </div>

          {directoryRows.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: BRAND.textFaint, fontSize: 13 }}>
              No employees match your search.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: BRAND.surfaceAlt }}>
                    {["Employee", "Position", "Business Unit", "Department", "Manager"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 16px", fontSize: 11,
                        fontWeight: 700, color: BRAND.textMuted, textTransform: "uppercase",
                        letterSpacing: 0.3, borderBottom: `1px solid ${BRAND.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {directoryRows.map(e => {
                    const dept = deptByName.get((e.department || "").trim());
                    const unit = dept?.parentDepartment
                      ? departments.find(d => d.id === dept.parentDepartment)
                      : undefined;
                    const isSelfManaged = dept?.manager?.id && dept.manager.id === e.userId;
                    return (
                      <tr key={e.id} className="os-row" style={{ borderBottom: `1px solid ${BRAND.borderSoft}` }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar first={e.firstName} last={e.lastName} size={30} />
                            <div>
                              <div style={{ fontWeight: 600, color: BRAND.ink, display: "flex", alignItems: "center", gap: 6 }}>
                                {e.firstName} {e.lastName}
                                {e.isManager && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    fontSize: 10, fontWeight: 700, color: BRAND.primaryDeep,
                                    background: BRAND.tint100, padding: "1px 7px", borderRadius: 999,
                                  }}><Ic.Shield /> MANAGER</span>
                                )}
                              </div>
                              <div style={{ fontSize: 11.5, color: BRAND.textFaint }}>{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", color: BRAND.text }}>{e.position || "—"}</td>
                        <td style={{ padding: "10px 16px", color: BRAND.textMuted }}>{unit?.name || "—"}</td>
                        <td style={{ padding: "10px 16px", color: BRAND.text }}>{e.department || "—"}</td>
                        <td style={{ padding: "10px 16px" }}>
                          {isSelfManaged ? (
                            <span style={{ fontSize: 12, color: BRAND.textFaint, fontStyle: "italic" }}>Self (department manager)</span>
                          ) : dept?.manager ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar first={dept.manager.firstName} last={dept.manager.lastName} size={24} tone="muted" />
                              <span style={{ fontSize: 12.5, color: BRAND.text }}>{dept.manager.firstName} {dept.manager.lastName}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: BRAND.textFaint }}>Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Export
 * ─────────────────────────────────────────────────────────────────────── */
const OrganizationStructurePage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) =>
  embedded ? (
    <OrganizationStructureContent />
  ) : (
    <SharedLayout title="Organization Structure">
      <OrganizationStructureContent />
    </SharedLayout>
  );

export default OrganizationStructurePage;
