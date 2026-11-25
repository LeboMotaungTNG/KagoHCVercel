// src/pages/owner/FrameworkBuilderPage.tsx
// Route: /owner/frameworks/:id/edit
// Editable categories/criteria, live weight validation, Validate / Publish,
// and assign-to-department control.

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layers, Building2, AlertTriangle } from 'lucide-react';
import { useFrameworkBuilder } from '../../hooks/useFrameworkBuilder';
import {
  AlertBanner,
  PageHero,
  PerformancePage,
  SectionCard,
  StatusBadge,
  perfBtnGhost,
  perfBtnHero,
  perfBtnPrimary,
} from '../../components/PerformanceUI';
import { C, R } from '../../../../../shared/utils/employee';

export default function FrameworkBuilderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const {
    framework,
    loading,
    saving,
    liveErrors,
    validation,
    saveMessage,
    saveError,
    serverErrors,
    updateCriterionMarks,
    updateCategoryMarks,
    updateCategoryName,
    updateCriterionName,
    save,
    validate,
    publish,
    assign,
  } = useFrameworkBuilder(id);

  const [department, setDepartment] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    if (framework?.department && !department) {
      setDepartment(framework.department);
    }
  }, [framework?.department, department]);

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading framework…</div>;
  if (!framework) return <div className="p-4" style={{ color: C.bad }}>Framework not found.</div>;

  const canPublish = liveErrors.length === 0 && framework.status === 'draft';
  const canSave = !saving; // never silently greyed out: clicking explains what to fix
  // Running total of the active categories, shown next to Save.
  const categoryTotal = framework.categories
    .filter((c) => (c as { isActive?: boolean }).isActive !== false)
    .reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
  const targetTotal = framework.totalMaxMarks || 100;
  const totalGap = targetTotal - categoryTotal;
  const isPublished = framework.status === 'published';
  const canAssign = isPublished && Boolean(department.trim()) && !assigning;

  const handleAssign = async () => {
    if (!department.trim()) {
      setAssignError('Enter a department name that matches employee profiles.');
      return;
    }
    setAssigning(true);
    setAssignError(null);
    setAssignMessage(null);
    try {
      await assign({ scope: 'department', department: department.trim() });
      setAssignMessage(
        `Assigned to “${department.trim()}”. Employees in that department use this framework; any of their self-reviews that weren't final are reopened with it so they can be redone (accepted reviews are unchanged). The previous department no longer has access.`
      );
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign framework');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <PerformancePage maxWidth={900}>
      <PageHero
        icon={<Layers size={24} color="#fff" />}
        title={framework.name}
        subtitle="Edit names and marks, then save. Changes to the active framework apply to new reviews; reviews already started keep their version."
        badge={{
          value: `v${framework.version}`,
          label: isPublished ? 'PUBLISHED' : 'DRAFT',
        }}
        actions={
          <>
            <span
              aria-live="polite"
              style={{
                alignSelf: 'center', fontSize: 13, fontWeight: 700, padding: '6px 10px', borderRadius: 8,
                background: totalGap === 0 ? 'rgba(255,255,255,0.18)' : '#fff7ed',
                color: totalGap === 0 ? '#fff' : '#9a3412',
              }}
            >
              Total {categoryTotal} / {targetTotal}
              {totalGap > 0 ? ` · add ${totalGap}` : totalGap < 0 ? ` · remove ${-totalGap}` : ' ✓'}
            </span>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              title={liveErrors.length ? `${liveErrors.length} problem(s) to fix — click Save to see them` : undefined}
              style={{ ...perfBtnHero, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => validate()} style={perfBtnHero}>
              Validate
            </button>
            {isPublished ? (
              // Already active: there's nothing to publish — Save applies changes as the next version.
              <span
                title="This framework is already active. Saving applies your changes as the next version for new reviews."
                style={{ ...perfBtnHero, cursor: 'default', opacity: 0.85 }}
              >
                Active · Save applies changes
              </span>
            ) : (
            <button
              type="button"
              onClick={() => publish()}
              disabled={!canPublish}
              title={canPublish ? 'Make this framework available to employees' : 'Fix the problems listed below, then publish'}
              style={{
                ...perfBtnHero,
                opacity: canPublish ? 1 : 0.5,
                cursor: canPublish ? 'pointer' : 'not-allowed',
              }}
            >
              Publish
            </button>
            )}
          </>
        }
      />

      <div className="mb-3">
        <StatusBadge
          label={isPublished ? 'Published' : 'Draft'}
          bg={isPublished ? C.greenBg : C.surfaceAlt}
          color={isPublished ? C.green : C.muted}
        />
      </div>

      {liveErrors.length > 0 && (
        <AlertBanner tone="warn">
          <div className="d-flex align-items-start gap-2">
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Fix before saving</div>
              <ul className="mb-0 ps-3">
                {liveErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </AlertBanner>
      )}

      {saveMessage && <AlertBanner tone="ok">{saveMessage}</AlertBanner>}
      {saveError && (
        <AlertBanner tone="danger">
          <div style={{ fontWeight: 700 }}>{saveError}</div>
          {serverErrors.length > 0 && (
            <ul className="mb-0 ps-3">{serverErrors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
        </AlertBanner>
      )}

      {validation && validation.errors.length > 0 && (
        <AlertBanner tone="danger">
          <ul className="mb-0 ps-3">
            {validation.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </AlertBanner>
      )}

      {framework.categories.map((cat) => {
        const critSum = cat.criteria.reduce((sum, c) => sum + c.maxMarks, 0);
        const categoryMismatch = critSum !== cat.maxMarks;

        return (
          <SectionCard key={cat._id} title={cat.name?.trim() || 'Untitled category'}>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
              <input
                className="form-control form-control-sm"
                aria-label="Category name"
                placeholder="Category name"
                style={{ flex: '1 1 220px', borderRadius: 8, borderColor: cat.name?.trim() ? C.line : C.bad }}
                value={cat.name}
                maxLength={120}
                onChange={(e) => updateCategoryName(cat._id, e.target.value)}
              />
              {/* A category's marks are always the sum of its criteria (edit the criteria below). */}
              <span
                title="Calculated from the criteria below"
                style={{ fontSize: 13, color: categoryMismatch ? C.bad : C.text, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Category total: {cat.maxMarks} marks
                <span style={{ fontWeight: 500, color: C.muted }}> (sum of its criteria)</span>
              </span>
            </div>

            {cat.criteria.map((crit) => (
              <div
                key={crit._id}
                className="d-flex justify-content-between align-items-center py-2"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <input
                  className="form-control form-control-sm"
                  aria-label="Criterion name"
                  placeholder="Criterion name"
                  style={{ flex: '1 1 auto', marginRight: 12, borderRadius: 8, borderColor: crit.name?.trim() ? C.line : C.bad }}
                  value={crit.name}
                  maxLength={160}
                  onChange={(e) => updateCriterionName(cat._id, crit._id, e.target.value)}
                />
                <input
                  type="number"
                  className="form-control form-control-sm"
                  aria-label="Criterion marks"
                  min={1}
                  step={1}
                  style={{ width: 70, borderRadius: 8, borderColor: Number.isInteger(crit.maxMarks) && crit.maxMarks >= 1 ? C.line : C.bad }}
                  value={crit.maxMarks}
                  onChange={(e) => updateCriterionMarks(cat._id, crit._id, Number(e.target.value))}
                />
              </div>
            ))}

            <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
              Criteria sum: {critSum}{' '}
              {categoryMismatch && (
                <span style={{ color: C.bad, fontWeight: 600 }}>(must equal {cat.maxMarks})</span>
              )}
            </div>
          </SectionCard>
        );
      })}

      <SectionCard icon={<Building2 size={16} />} title="Assign to department">
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
          Defaults to this framework’s department. Change it only if employee profiles use a different name.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <input
            className="form-control"
            style={{ flex: '1 1 240px', borderRadius: R.md, borderColor: C.line }}
            value={department}
            placeholder={framework.department || 'e.g. Customer Support'}
            onChange={(e) => {
              setDepartment(e.target.value);
              setAssignError(null);
              setAssignMessage(null);
            }}
          />
          <button
            type="button"
            onClick={handleAssign}
            disabled={!canAssign}
            style={{
              ...(canAssign ? perfBtnPrimary : perfBtnGhost),
              opacity: canAssign ? 1 : 0.6,
              cursor: canAssign ? 'pointer' : 'not-allowed',
            }}
          >
            {assigning ? 'Assigning…' : 'Assign'}
          </button>
        </div>
        {!isPublished && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            Publish the framework before assigning it.
          </div>
        )}
        {assignError && (
          <div style={{ fontSize: 13, color: C.bad, marginTop: 8, fontWeight: 600 }}>{assignError}</div>
        )}
        {assignMessage && (
          <div style={{ fontSize: 13, color: C.ok, marginTop: 8, fontWeight: 600 }}>{assignMessage}</div>
        )}
      </SectionCard>
    </PerformancePage>
  );
}
