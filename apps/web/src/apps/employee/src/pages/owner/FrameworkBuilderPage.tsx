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
  const canSave = liveErrors.length === 0 && !saving;
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
        `Assigned to “${department.trim()}”. Employees in that department use this framework for new reviews; the previous department no longer has access.`
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
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              title={liveErrors.length ? 'Fix the problems listed below before saving' : undefined}
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
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Category max</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{
                  width: 80,
                  borderRadius: 8,
                  borderColor: categoryMismatch ? C.bad : C.line,
                }}
                value={cat.maxMarks}
                min={1}
                step={1}
                onChange={(e) => updateCategoryMarks(cat._id, Number(e.target.value))}
              />
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
