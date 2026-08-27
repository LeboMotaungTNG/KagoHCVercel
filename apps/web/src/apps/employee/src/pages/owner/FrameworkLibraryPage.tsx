// src/pages/owner/FrameworkLibraryPage.tsx
// Route: /owner/frameworks
// Primary path: one-click Activate (adopt → publish → assign) using the
// framework's own department label. Optional override if employee records
// use a different spelling. No Organisation-settings dependency.

import { Library, Layers, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrameworkLibrary } from '../../hooks/useFrameworks';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  perfBtnPrimary,
  perfBtnSecondary,
} from '../../components/PerformanceUI';
import { C, R } from '../../../../../shared/utils/employee';

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
    tenantFrameworks.find((tf) => tf.sourceFrameworkId === systemFrameworkId);

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
      setSuccessById((prev) => ({
        ...prev,
        [sourceId]: `Active for “${department}”. Employees with that department can start reviews.`,
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
                    Department (must match employee profiles)
                  </label>
                  <input
                    className="form-control form-control-sm mb-2"
                    style={{ borderRadius: R.md, borderColor: C.line }}
                    value={deptByFramework[fw._id] ?? fw.department}
                    disabled={busy}
                    onChange={(e) =>
                      setDeptByFramework((prev) => ({ ...prev, [fw._id]: e.target.value }))
                    }
                    placeholder={fw.department}
                  />
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
