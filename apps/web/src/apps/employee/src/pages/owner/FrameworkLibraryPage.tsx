// src/pages/owner/FrameworkLibraryPage.tsx
// Route: /owner/frameworks
// Screen 1 from the handoff: list system frameworks (the library), adopt
// into the tenant, show adopted frameworks with a status badge, and hand
// off to the builder for customisation.

import { Library, Layers } from 'lucide-react';
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
  const { systemFrameworks, tenantFrameworks, loading, error, adopt, adoptingId } = useFrameworkLibrary();
  const navigate = useNavigate();

  const isAdopted = (systemFrameworkId: string) =>
    tenantFrameworks.some((tf) => tf.sourceFrameworkId === systemFrameworkId);

  const tenantFrameworkFor = (systemFrameworkId: string) =>
    tenantFrameworks.find((tf) => tf.sourceFrameworkId === systemFrameworkId);

  const handleAdopt = async (sourceId: string) => {
    const cloned = await adopt(sourceId);
    if (cloned) navigate(`/owner/frameworks/${cloned._id}/edit`);
  };

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading frameworks…</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;

  return (
    <PerformancePage>
      <PageHero
        icon={<Library size={24} color="#fff" />}
        title="Framework Library"
        subtitle="Adopt a system framework for your organisation, then customise weights before publishing."
      />

      {systemFrameworks.length === 0 && (
        <EmptyState icon={<Layers size={28} />} message="No system frameworks available." />
      )}

      <div className="row g-3">
        {systemFrameworks.map((fw) => {
          const adopted = isAdopted(fw._id);
          const tenantFw = tenantFrameworkFor(fw._id);

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
                        background: tenantFw.status === 'published' ? C.greenBg : C.surfaceAlt,
                        color: tenantFw.status === 'published' ? C.green : C.muted,
                      }}
                    >
                      {tenantFw.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  )}
                </div>

                <div className="mt-3 d-flex gap-2">
                  {!adopted && (
                    <button
                      type="button"
                      disabled={adoptingId === fw._id}
                      onClick={() => handleAdopt(fw._id)}
                      style={perfBtnPrimary}
                    >
                      {adoptingId === fw._id ? 'Adopting…' : 'Adopt'}
                    </button>
                  )}
                  {adopted && tenantFw && (
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/frameworks/${tenantFw._id}/edit`)}
                      style={perfBtnSecondary}
                    >
                      Customise
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>
          );
        })}
      </div>
    </PerformancePage>
  );
}
