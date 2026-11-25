// src/pages/owner/FrameworkLibraryPage.tsx
// Route: /owner/frameworks
// Primary path: one-click Activate (adopt → publish → assign) using the
// framework's own department label. Optional override if employee records
// use a different spelling. No Organisation-settings dependency.

import { Library, Layers, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pickTenantCopy, useFrameworkLibrary } from '../../hooks/useFrameworks';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  perfBtnPrimary,
  perfBtnSecondary,
} from '../../components/PerformanceUI';
import { C, R } from '../../../../../shared/utils/employee';
import { API_BASE } from '../../../../../shared/utils/apiBase';

/** Same rule as the server: capitals and spaces don't matter. */
const normDept = (d: unknown) => String(d ?? '').replace(/\s+/g, '').toLowerCase();
const INACTIVE = ['terminated', 'resigned', 'inactive'];

export default function FrameworkLibraryPage() {
  const {
    systemFrameworks,
    tenantFrameworks,
    loading,
    error,
    activate,
    activatingId,
  } = useFrameworkLibrary();
  const navigate = useNavigate();

  const [deptByFramework, setDeptByFramework] = useState<Record<string, string>>({});
  // Departments on active employees' profiles (name → headcount), suggested in the
  // department box so the framework is assigned to a name employees actually have.
  const [departmentsInUse, setDepartmentsInUse] = useState<Record<string, number>>({});
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/employees`, { headers }).then((r) => (r.ok ? r.json() : null)),
      // Departments set up under Structure — new ones included, even with nobody in them yet.
      fetch(`${API_BASE}/department`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([body, deptBody]) => {
        const list: any[] = Array.isArray(body?.data) ? body.data : body?.data?.employees || body?.employees || [];
        const counts: Record<string, number> = {};
        list.forEach((e) => {
          if (INACTIVE.includes(e?.employmentStatus)) return;
          const d = typeof e?.department === 'object' ? e?.department?.name : e?.department;
          if (d) counts[String(d).trim()] = (counts[String(d).trim()] || 0) + 1;
        });
        // Structure departments with nobody in them yet (skip ones already listed under another spelling).
        const depts: any[] = Array.isArray(deptBody?.data) ? deptBody.data : deptBody?.data?.departments || deptBody?.departments || [];
        depts.forEach((d) => {
          const name = String(d?.name || '').trim();
          if (name && !Object.keys(counts).some((k) => normDept(k) === normDept(name))) counts[name] = 0;
        });
        setDepartmentsInUse(counts);
      })
      .catch(() => setDepartmentsInUse({}));
  }, []);
  /** Employees whose department matches (any capitals/spacing), and the spelling on their profiles. */
  const coverage = (department: string) => {
    const names = Object.keys(departmentsInUse).filter((d) => normDept(d) === normDept(department));
    return { name: names[0] || department, count: names.reduce((n, d) => n + departmentsInUse[d], 0) };
  };
  const [actionError, setActionError] = useState<string | null>(null);
  const [successById, setSuccessById] = useState<Record<string, string>>({});

  // Default each card to the system framework's department label.
  useEffect(() => {
    if (!systemFrameworks.length) return;
    setDeptByFramework((prev) => {
      const next = { ...prev };
      for (const fw of systemFrameworks) {
        if (!next[fw._id]?.trim()) {
          next[fw._id] = fw.department || '';
        }
      }
      return next;
    });
  }, [systemFrameworks]);

  const isAdopted = (systemFrameworkId: string) =>
    tenantFrameworks.some((tf) => tf.sourceFrameworkId === systemFrameworkId);

  const tenantFrameworkFor = (systemFrameworkId: string) =>
    // The company's current copy: active first, then a draft — never an archived version.
    pickTenantCopy(tenantFrameworks, systemFrameworkId);

  const busy = Boolean(activatingId);

  const resolveDepartment = (fwId: string, fallback: string) =>
    (deptByFramework[fwId] || fallback || '').trim();

  const handleActivate = async (sourceId: string, fallbackDept: string) => {
    const department = resolveDepartment(sourceId, fallbackDept);
    if (!department) {
      setActionError('Enter a department name that matches your employees’ profiles.');
      return;
    }
    setActionError(null);
    try {
      await activate(sourceId, department);
      const { name, count } = coverage(department);
      setSuccessById((prev) => ({
        ...prev,
        [sourceId]: count
          ? `Active for “${name}”: ${count} employee${count === 1 ? '' : 's'} will use it. Any of their self-reviews that weren't final are reopened with this framework so they can be redone; accepted reviews are unchanged.`
          : `Active for “${name}”. Nobody is in this department yet — employees added to it will use this framework.`,
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Activation failed');
    }
  };

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading frameworks…</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;

  return (
    <PerformancePage>
      <PageHero
        icon={<Library size={24} color="#fff" />}
        title="Framework Library"
        subtitle="Activate a scorecard in one click. Uses this framework’s department — change it only if employee profiles use a different name."
      />

      {actionError && (
        <div
          className="mb-3"
          style={{
            background: C.badBg,
            color: C.bad,
            borderRadius: R.md,
            padding: '10px 14px',
            fontSize: 14,
          }}
        >
          {actionError}
        </div>
      )}

      {systemFrameworks.length === 0 && (
        <EmptyState icon={<Layers size={28} />} message="No system frameworks available." />
      )}

      <div className="row g-3">
        {systemFrameworks.map((fw) => {
          const adopted = isAdopted(fw._id);
          const tenantFw = tenantFrameworkFor(fw._id);
          const isActive = tenantFw?.status === 'published';
          const isBusy = activatingId === fw._id;
          const departmentValue = resolveDepartment(fw._id, fw.department);

          return (
            <div className="col-12 col-md-6 col-lg-4" key={fw._id}>
              <SectionCard fill noMargin>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: C.primaryBg,
                      color: C.primaryDark,
                      marginBottom: 10,
                    }}
                  >
                    {fw.department}
                  </span>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 16, marginBottom: 6 }}>{fw.name}</div>
                  <p style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                    {fw.categories.length} categories · {fw.totalMaxMarks} marks total
                  </p>
                  {adopted && tenantFw && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: isActive ? C.greenBg : C.surfaceAlt,
                        color: isActive ? C.green : C.muted,
                      }}
                    >
                      {isActive ? 'Active' : 'Draft'}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <label className="form-label small fw-semibold mb-1" style={{ color: C.muted }}>
                    Department
                  </label>
                  {/* Every department — from Structure (new ones included) and employee profiles. */}
                  {(() => {
                    const current = deptByFramework[fw._id] ?? fw.department;
                    const known = Object.keys(departmentsInUse).sort((a, b) => a.localeCompare(b));
                    const currentKnown = !current || known.some((d) => normDept(d) === normDept(current));
                    return (
                      <select
                        className="form-select form-select-sm mb-2"
                        style={{ borderRadius: R.md, borderColor: currentKnown ? C.line : C.bad }}
                        value={currentKnown ? (known.find((d) => normDept(d) === normDept(current)) ?? '') : current}
                        disabled={busy}
                        onChange={(e) =>
                          setDeptByFramework((prev) => ({ ...prev, [fw._id]: e.target.value }))
                        }
                      >
                        {!current && <option value="">Select a department</option>}
                        {/* The library's suggested name, when the company has no such department. */}
                        {!currentKnown && <option value={current}>{current} (not one of your departments)</option>}
                        {known.map((d) => (
                          <option key={d} value={d}>
                            {d} ({departmentsInUse[d]} employee{departmentsInUse[d] === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !departmentValue}
                    onClick={() => handleActivate(fw._id, fw.department)}
                    style={{
                      ...perfBtnPrimary,
                      opacity: busy || !departmentValue ? 0.65 : 1,
                    }}
                  >
                    {isBusy ? 'Activating…' : isActive ? 'Re-assign' : 'Activate'}
                  </button>
                  {adopted && tenantFw && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => navigate(`/owner/frameworks/${tenantFw._id}/edit`)}
                      style={perfBtnSecondary}
                    >
                      Customise
                    </button>
                  )}
                </div>

                {successById[fw._id] && (
                  <div
                    className="d-flex align-items-start gap-2 mt-2"
                    style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}
                  >
                    <CheckCircle2 size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{successById[fw._id]}</span>
                  </div>
                )}
              </SectionCard>
            </div>
          );
        })}
      </div>
    </PerformancePage>
  );
}
