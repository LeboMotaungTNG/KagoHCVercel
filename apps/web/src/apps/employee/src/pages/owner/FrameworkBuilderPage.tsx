// src/pages/owner/FrameworkBuilderPage.tsx
// Route: /owner/frameworks/:id/edit
// Editable categories/criteria, live weight validation, Validate / Publish,
// and assign-to-department control.

import { useParams } from 'react-router-dom';
import { useState } from 'react';
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
    updateCriterionMarks,
    updateCategoryMarks,
    save,
    validate,
    publish,
    assign,
  } = useFrameworkBuilder(id);

  const [department, setDepartment] = useState('');
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading framework…</div>;
  if (!framework) return <div className="p-4" style={{ color: C.bad }}>Framework not found.</div>;

  const canPublish = liveErrors.length === 0 && framework.status === 'draft';
  const isPublished = framework.status === 'published';

  const handleAssign = async () => {
    if (!department) return;
    await assign({ scope: 'department', department });
    setAssignMessage(`Assigned to ${department}.`);
  };

  return (
    <PerformancePage maxWidth={900}>
      <PageHero
        icon={<Layers size={24} color="#fff" />}
        title={framework.name}
        subtitle="Adjust category and criterion weights, validate the framework, then publish and assign it."
        badge={{
          value: `v${framework.version}`,
          label: isPublished ? 'PUBLISHED' : 'DRAFT',
        }}
        actions={
          <>
            <button type="button" onClick={() => save()} disabled={saving} style={perfBtnHero}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => validate()} style={perfBtnHero}>
              Validate
            </button>
            <button
              type="button"
              onClick={() => publish()}
              disabled={!canPublish}
              style={{
                ...perfBtnHero,
                opacity: canPublish ? 1 : 0.5,
                cursor: canPublish ? 'pointer' : 'not-allowed',
              }}
            >
              Publish
            </button>
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
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Fix before publishing</div>
              <ul className="mb-0 ps-3">
                {liveErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
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
          <SectionCard key={cat._id} title={cat.name}>
            <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
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
                onChange={(e) => updateCategoryMarks(cat._id, Number(e.target.value))}
              />
            </div>

            {cat.criteria.map((crit) => (
              <div
                key={crit._id}
                className="d-flex justify-content-between align-items-center py-2"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <span style={{ fontSize: 13, color: C.text }}>{crit.name}</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 70, borderRadius: 8, borderColor: C.line }}
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
        <div className="d-flex flex-wrap gap-2">
          <input
            className="form-control"
            style={{ flex: '1 1 200px', borderRadius: R.md, borderColor: C.line }}
            placeholder="e.g. IT / Engineering"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAssign}
            disabled={!isPublished}
            style={{
              ...(isPublished ? perfBtnPrimary : perfBtnGhost),
              opacity: isPublished ? 1 : 0.6,
              cursor: isPublished ? 'pointer' : 'not-allowed',
            }}
          >
            Assign
          </button>
        </div>
        {!isPublished && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            Publish the framework before assigning it.
          </div>
        )}
        {assignMessage && (
          <div style={{ fontSize: 13, color: C.ok, marginTop: 8, fontWeight: 600 }}>{assignMessage}</div>
        )}
      </SectionCard>
    </PerformancePage>
  );
}
