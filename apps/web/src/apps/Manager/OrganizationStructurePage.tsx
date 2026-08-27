import React, { useEffect, useMemo, useState , useRef} from "react";
import SharedLayout from "./SharedLayout";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BRAND,
  fetchAllEmployees,
  type EmployeeSummary,
} from "../../shared/utils/manageEmployees";
import {
  type Department,
  type DepartmentManagerInfo,
  fetchCompanySettings,
  fetchDepartments,
  updateDepartment,
} from "../../shared/utils/onboarding";

/* ──────────────────────────────────────────────────────────────────────────
 * Icons
 * ─────────────────────────────────────────────────────────────────────── */
const Ic = {
  Landmark: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 21 7 3 7" /></svg>,
  Building: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  AlertCircle: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Shield: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  CheckCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Pencil: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
  Crown: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" /></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Shared styling
 * ─────────────────────────────────────────────────────────────────────── */
const siblingCard: React.CSSProperties = {
  borderRadius: 10,
  borderWidth: 2, borderStyle: "solid", borderColor: BRAND.cardBorder,
  boxShadow: BRAND.cardShadow,
  background: "#fff",
};
const initials = (a?: string, b?: string) =>
  `${(a?.[0] || "").toUpperCase()}${(b?.[0] || "").toUpperCase()}` || "?";

const Avatar: React.FC<{ first?: string; last?: string; size?: number; tone?: "blue" | "muted" | "dark" }> = ({ first, last, size = 32, tone = "blue" }) => (
  <span style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 800, letterSpacing: 0.3, color: "#fff",
    background: tone === "blue"
      ? `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`
      : tone === "dark"
      ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
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

const LegendDot: React.FC<{ color: string; border?: string; label: string }> = ({ color, border, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: BRAND.textMuted }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: color, border: border ? `1px solid ${border}` : "none", flexShrink: 0 }} />
    {label}
  </span>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Download menu button (PNG / PDF)
 * ─────────────────────────────────────────────────────────────────────── */
const DownloadMenu: React.FC<{
  onPNG: () => void;
  onPDF: () => void;
  busy: boolean;
}> = ({ onPNG, onPDF, busy }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", borderRadius: 10,
          border: `1px solid ${BRAND.border}`, background: "#fff",
          color: BRAND.ink, fontSize: 12.5, fontWeight: 600,
          cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
        }}
      >
        <Ic.Download />
        {busy ? "Preparing…" : "Download"}
        <Ic.ChevronDown />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 20,
          background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 10,
          boxShadow: "0 12px 28px rgba(16,24,40,0.12)", minWidth: 160, overflow: "hidden",
        }}>
          <button
            onClick={() => { setOpen(false); onPNG(); }}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
              border: "none", background: "transparent", fontSize: 12.5, color: BRAND.text,
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f7f8fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Download as PNG
          </button>
          <button
            onClick={() => { setOpen(false); onPDF(); }}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
              border: "none", background: "transparent", fontSize: 12.5, color: BRAND.text,
              cursor: "pointer", borderTop: `1px solid ${BRAND.borderSoft}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f7f8fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Download as PDF
          </button>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Org-chart tree CSS (classic connector-line pattern, scoped with kgo- prefix)
 * ─────────────────────────────────────────────────────────────────────── */
const TreeStyles = () => (
  <style>{`
    .kgo-org-scroll { overflow-x: auto; padding: 28px 16px 44px; }
.kgo-org-tree, .kgo-org-tree ul {
  display: flex; justify-content: safe center; padding-top: 28px; position: relative;
  margin: 0;
}
    .kgo-org-tree { padding-top: 0; }
    .kgo-org-tree li {
      list-style: none; position: relative;
      padding: 28px 14px 0 14px;
      display: flex; flex-direction: column; align-items: center;
    }
    .kgo-org-tree li::before, .kgo-org-tree li::after {
      content: ''; position: absolute; top: 0; right: 50%;
      border-top: 2px solid #d0d5dd; width: 50%; height: 28px;
    }
    .kgo-org-tree li::after { right: auto; left: 50%; border-left: 2px solid #d0d5dd; }
    .kgo-org-tree li:only-child::after, .kgo-org-tree li:only-child::before { display: none; }
    .kgo-org-tree li:only-child { padding-top: 0; }
    .kgo-org-tree li:first-child::before, .kgo-org-tree li:last-child::after { border: 0 none; }
    .kgo-org-tree li:last-child::before { border-right: 2px solid #d0d5dd; border-radius: 0 6px 0 0; }
    .kgo-org-tree li:first-child::after { border-radius: 6px 0 0 0; }
    .kgo-org-tree ul ul::before {
      content: ''; position: absolute; top: 0; left: 50%;
      border-left: 2px solid #d0d5dd; width: 0; height: 28px;
    }
    .kgo-node { cursor: default; transition: box-shadow .15s ease, transform .15s ease, opacity .15s ease; }
    .kgo-node:hover { box-shadow: 0 10px 24px rgba(15,23,42,0.10); }
  `}</style>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Main content
 * ─────────────────────────────────────────────────────────────────────── */
function OrganizationStructureContent() {
  const chartRef = useRef<HTMLDivElement>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [exporting, setExporting] = useState(false);

  // html2canvas only captures what's within an element's current box —
  // if the chart is wider than its scrollable viewport, anything scrolled
  // out of view gets clipped. To capture the FULL chart, we briefly expand
  // the scrollable container to its true content size, render it, then put
  // the original styles back so the on-screen layout is untouched.
  const captureChart = async (): Promise<HTMLCanvasElement | null> => {
    const outer = chartRef.current;
    if (!outer) return null;
    const scrollEl = outer.querySelector<HTMLElement>(".kgo-org-scroll") || outer;

    const prev = {
      width: scrollEl.style.width,
      overflowX: scrollEl.style.overflowX,
      overflowY: scrollEl.style.overflowY,
    };

    try {
      // Force the container to lay out at its full natural size.
      scrollEl.style.overflowX = "visible";
      scrollEl.style.overflowY = "visible";
      scrollEl.style.width = `${scrollEl.scrollWidth}px`;

      const fullWidth = scrollEl.scrollWidth;
      const fullHeight = scrollEl.scrollHeight;

      const canvas = await html2canvas(outer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
      });

      return canvas;
    } finally {
      // Always restore, even if capture throws.
      scrollEl.style.width = prev.width;
      scrollEl.style.overflowX = prev.overflowX;
      scrollEl.style.overflowY = prev.overflowY;
    }
  };

  const exportPNG = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const canvas = await captureChart();
      if (!canvas) return;

      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = "organization-structure.png";
      link.click();
      showToast("Organization chart downloaded as PNG.", "success");
    } catch (error) {
      console.error("PNG export failed:", error);
      showToast("Couldn't export the chart. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const canvas = await captureChart();
      if (!canvas) return;

      const image = canvas.toDataURL("image/png");

      // Size the PDF page to match the chart's own proportions (mm, at
      // roughly 96dpi-equivalent scale) instead of forcing a fixed A4 page.
      // A very wide org chart otherwise gets squeezed down to fit A4 and
      // becomes unreadable. We cap the longest side so the file stays a
      // sane physical page size.
      const margin = 10;
      const maxDimension = 1200; // mm, generous ceiling for very large charts
      const pxToMm = 0.264583 / 2; // canvas was rendered at scale: 2

      let imageWidth = canvas.width * pxToMm;
      let imageHeight = canvas.height * pxToMm;

      if (imageWidth > maxDimension || imageHeight > maxDimension) {
        const shrink = maxDimension / Math.max(imageWidth, imageHeight);
        imageWidth *= shrink;
        imageHeight *= shrink;
      }

      const pageWidth = imageWidth + margin * 2;
      const pageHeight = imageHeight + margin * 2;

      const pdf = new jsPDF({
        orientation: pageWidth >= pageHeight ? "landscape" : "portrait",
        unit: "mm",
        format: [pageWidth, pageHeight],
      });

      pdf.addImage(image, "PNG", margin, margin, imageWidth, imageHeight);
      pdf.save("organization-structure.pdf");
      showToast("Organization chart downloaded as PDF.", "success");
    } catch (error) {
      console.error("PDF export failed:", error);
      showToast("Couldn't export the chart. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

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

    // Company name/logo are cosmetic for the root node — fetch separately
    // so a failure here never blocks the chart itself from rendering.
    try {
      const company = await fetchCompanySettings();
      console.log("[org-chart] fetchCompanySettings() returned:", company); // TEMP DEBUG — remove after checking
      setCompanyName(company?.name || "");
      setCompanyLogoUrl(company?.logoUrl || company?.logoDataUrl || "");
    } catch (e) {
      console.warn("Failed to load company settings for org chart header:", e);
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

  // Auto-populate department managers: if the owner hasn't manually
  // assigned a manager to a department, fall back to the first employee
  // in that department who was onboarded/flagged as a manager. A manual
  // assignment (via the pencil icon, which persists to the backend as
  // dept.manager) always takes priority over this inference.
  const effectiveManagers = useMemo(() => {
    const map = new Map<string, DepartmentManagerInfo>();
    leafDepartments.forEach(d => {
      if (d.manager) {
        if (d.id) map.set(d.id, d.manager);
        return;
      }
      const teamMembers = employeesByDeptName.get(d.name.trim()) || [];
      const inferred = teamMembers.find(e => e.isManager && e.userId);
      if (inferred && d.id) {
        map.set(d.id, {
          id: inferred.userId as string,
          firstName: inferred.firstName,
          lastName: inferred.lastName,
        } as DepartmentManagerInfo);
      }
    });
    return map;
  }, [leafDepartments, employeesByDeptName]);

  const unassignedCount = useMemo(
    () => leafDepartments.filter(d => !(d.id && effectiveManagers.has(d.id))).length,
    [leafDepartments, effectiveManagers],
  );

  // Search-and-highlight within the tree: matching a unit, department, or
  // employee also lights up its ancestors so the match's place in the
  // hierarchy stays visible, while everything unrelated dims out.
  const matchSet = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const unitIds = new Set<string>();
    const deptIds = new Set<string>();
    const employeeIds = new Set<string>();

    employees.forEach(e => {
      const full = `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase();
      if (!full.includes(q)) return;
      employeeIds.add(e.id);
      const dept = deptByName.get((e.department || "").trim());
      if (dept?.id) {
        deptIds.add(dept.id);
        if (dept.parentDepartment) unitIds.add(dept.parentDepartment);
      }
    });

    departments.forEach(d => {
      if (!d.name.toLowerCase().includes(q)) return;
      if (d.parentDepartment) {
        if (d.id) deptIds.add(d.id);
        unitIds.add(d.parentDepartment);
      } else if (d.id) {
        unitIds.add(d.id);
      }
    });

    return { unitIds, deptIds, employeeIds };
  }, [query, employees, departments, deptByName]);

  const dimStyle = (matched: boolean): React.CSSProperties =>
    matchSet ? { opacity: matched ? 1 : 0.28 } : {};
  const ringStyle = (matched: boolean): React.CSSProperties =>
    matchSet && matched ? { boxShadow: `${BRAND.cardShadow}, 0 0 0 2px ${BRAND.primary}` } : {};

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAssignManager = async (deptId: string | undefined, userId: string) => {
    if (!deptId) return;
    setAssigning(deptId);
    try {
      const updated = await updateDepartment(deptId, { manager: userId || null });
      setDepartments(prev => prev.map(d => (d.id === deptId ? updated : d)));
      showToast(userId ? "Manager assigned." : "Manager unassigned.", "success");
      setEditingDept(null);
    } catch (e: any) {
      showToast(e?.message || "Failed to update manager.", "error");
    } finally {
      setAssigning(null);
    }
  };

  // ── Node renderers ──────────────────────────────────────────────────────
  const RootNode = () => (
    <div className="kgo-node" style={{
      ...siblingCard, padding: "14px 26px", display: "flex", alignItems: "center", gap: 12,
      background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", borderColor: "#111827",
    }}>
      {companyLogoUrl ? (
        <img
          src={companyLogoUrl}
          alt={companyName || "Company logo"}
          style={{
            width: 36, height: 36, borderRadius: 9, objectFit: "cover",
            background: "rgba(255,255,255,0.12)", flexShrink: 0,
          }}
        />
      ) : (
        <span style={{
          width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.12)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}><Ic.Crown /></span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 800, color: "#fff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260,
        }}>
          {companyName || "Organization"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          {companyName ? "Organization · " : ""}{employees.length} people · {businessUnits.length} business units
        </div>
      </div>
    </div>
  );

  const UnitNode: React.FC<{ unit: Department }> = ({ unit }) => {
    const depts = departmentsByUnit.get(unit.id || "") || [];
    const unitEmployeeCount = depts.reduce((sum, d) => sum + (employeesByDeptName.get(d.name.trim())?.length || 0), 0);
    const matched = !matchSet || (unit.id ? matchSet.unitIds.has(unit.id) : false);
    return (
      <div className="kgo-node" style={{
        ...siblingCard, padding: "12px 18px", minWidth: 190,
        background: "linear-gradient(135deg, #805AD5 0%, #6b46c1 100%)", borderColor: "#6b46c1",
        display: "flex", alignItems: "center", gap: 10,
        ...dimStyle(matched), ...ringStyle(matched),
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.18)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}><Ic.Landmark /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{unit.name}</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>
            {depts.length} dept{depts.length === 1 ? "" : "s"} · {unitEmployeeCount} people
          </div>
        </div>
      </div>
    );
  };

  const DeptNode: React.FC<{ dept: Department }> = ({ dept }) => {
    const isEditing = editingDept === dept.id;
    const matched = !matchSet || (dept.id ? matchSet.deptIds.has(dept.id) : false);
    // Manually-assigned manager (dept.manager) wins; otherwise fall back
    // to the auto-detected manager from onboarding.
    const manager = dept.manager || (dept.id ? effectiveManagers.get(dept.id) : undefined);
    const isAutoAssigned = !dept.manager && !!manager;
    return (
      <div className="kgo-node" style={{
        ...siblingCard, padding: "12px 14px", minWidth: 200,
        borderColor: manager ? BRAND.cardBorder : "#fedf89",
        background: manager ? "#fff" : "#fffdf5",
        ...dimStyle(matched), ...ringStyle(matched),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <span style={{ color: BRAND.primary }}><Ic.Building /></span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.ink }}>{dept.name}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {manager ? (
            <Avatar first={manager.firstName} last={manager.lastName} size={30} tone="dark" />
          ) : (
            <span style={{
              width: 30, height: 30, borderRadius: "50%", background: "#fef3c7",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#b54708", flexShrink: 0,
            }}><Ic.AlertCircle /></span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {manager ? `${manager.firstName} ${manager.lastName}` : "No manager"}
            </div>
            <div style={{ fontSize: 10, color: BRAND.textFaint }}>
              {isAutoAssigned ? "Department Manager · Auto-assigned" : "Department Manager"}
            </div>
          </div>
          <button
            onClick={() => setEditingDept(isEditing ? null : (dept.id || null))}
            title="Change manager"
            style={{
              border: "none", background: BRAND.tint100, color: BRAND.primary,
              width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          ><Ic.Pencil /></button>
        </div>

        {isEditing && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${BRAND.borderSoft}` }}>
            {managerPool.length === 0 ? (
              <p style={{ margin: 0, fontSize: 11, color: BRAND.textFaint }}>No promoted managers yet.</p>
            ) : (
              <select
                value={manager?.id || ""}
                disabled={assigning === dept.id}
                onChange={e => handleAssignManager(dept.id, e.target.value)}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 7,
                  border: `1px solid ${BRAND.border}`, fontSize: 11.5, background: "#fff", cursor: "pointer",
                }}
              >
                <option value="">— Unassigned —</option>
                {managerPool.map(m => (
                  <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  const EmployeeNode: React.FC<{ e: EmployeeSummary }> = ({ e }) => {
    const matched = !matchSet || matchSet.employeeIds.has(e.id);
    return (
      <div className="kgo-node" style={{
        ...siblingCard, padding: "8px 12px", minWidth: 150,
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: matchSet && matched ? `0 0 0 2px ${BRAND.primary}` : "none",
        ...dimStyle(matched),
      }}>
        <Avatar first={e.firstName} last={e.lastName} size={24} tone="muted" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: BRAND.text, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.firstName} {e.lastName}
            {e.isManager && <span style={{ color: BRAND.primary }}><Ic.Shield /></span>}
          </div>
          <div style={{ fontSize: 9.5, color: BRAND.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.position || "—"}</div>
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid mt-3 mb-5 w-100" style={{ padding: "0 12px" }}>
      <TreeStyles />
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

        {/* Legend + in-chart search + download */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LegendDot color="#805AD5" label="Business Unit" />
            <LegendDot color="#fff" border={BRAND.cardBorder} label="Department" />
            <LegendDot color="#fef3c7" border="#fedf89" label="Needs manager" />
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: BRAND.textFaint }}><Ic.Search /></span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find a person or department…"
              style={{
                width: 240, padding: "9px 12px 9px 34px", borderRadius: 20,
                border: `1px solid ${BRAND.border}`, fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <DownloadMenu onPNG={exportPNG} onPDF={exportPDF} busy={exporting} />
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
      ) : (
        /* ── ORG CHART — real connector-line tree ────────────────────────── */
        <div ref={chartRef} style={{ ...siblingCard, background: "#fbfbfd" }}>
          <div className="kgo-org-scroll">
            <ul className="kgo-org-tree">
              <li>
                <RootNode />
                <ul>
                  {businessUnits.map(unit => {
                    const depts = departmentsByUnit.get(unit.id || "") || [];
                    return (
                      <li key={unit.id || unit.name}>
                        <UnitNode unit={unit} />
                        {depts.length > 0 && (
                          <ul>
                            {depts.map(dept => {
                              const teamMembers = (employeesByDeptName.get(dept.name.trim()) || [])
                                .filter(e => e.userId !== dept.manager?.id);
                              return (
                                <li key={dept.id || dept.name}>
                                  <DeptNode dept={dept} />
                                  {teamMembers.length > 0 && (
                                    <ul>
                                      {teamMembers.map(e => (
                                        <li key={e.id}><EmployeeNode e={e} /></li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </div>
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