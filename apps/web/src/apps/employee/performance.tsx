import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SharedLayout from './SharedLayout';
import { C, R } from '../../shared/utils/employee';
import ResultsPage from './src/pages/employee/ResultsPage';
import SelfReviewPage from './src/pages/employee/SelfReviewPage';
import GoalsPage from './src/pages/employee/GoalsPage';
import AnalyticsInsightsPage from './src/pages/owner/AnalyticsInsightsPage';
import { resolveCurrentEmployee } from './src/utils/resolveEmployee';

const TabLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      style={{
        padding: '10px 18px',
        borderRadius: R.lg,
        fontWeight: 600,
        fontSize: 14,
        textDecoration: 'none',
        background: active ? C.primary : C.surface,
        color: active ? '#fff' : C.text,
        border: `1px solid ${active ? C.primary : C.line}`,
      }}
    >
      {label}
    </Link>
  );
};

const PerformanceShell: React.FC<{ children: React.ReactNode; basePath: string }> = ({ children, basePath }) => (
  <SharedLayout title="Performance">
    <Helmet>
      <title>Performance | Kago HC</title>
    </Helmet>
    <div className="mb-4 d-flex flex-wrap gap-2">
      <TabLink to={`${basePath}/reviews`} label="My reviews" />
      <TabLink to={`${basePath}/self-review`} label="Self-review" />
      <TabLink to={`${basePath}/goals`} label="My goals" />
      <TabLink to={`${basePath}/insights`} label="Development plan" />
    </div>
    {children}
  </SharedLayout>
);

function EmployeeInsights() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveCurrentEmployee()
      .then((emp) => {
        if (cancelled) return;
        if (!emp) {
          setError('Could not find your employee record.');
          return;
        }
        setEmployeeId(emp._id);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your employee profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading your development plan…</div>;
  if (error || !employeeId) {
    return <div className="p-4" style={{ color: C.bad }}>{error || 'Employee record not found.'}</div>;
  }

  return <AnalyticsInsightsPage employeeId={employeeId} mode="employee" />;
}

export default function EmployeePerformance({
  basePath = "/employee/performance",
}: {
  basePath?: string;
}) {
  return (
    <Routes>
      <Route index element={<Navigate to="reviews" replace />} />
      <Route
        path="reviews"
        element={
          <PerformanceShell basePath={basePath}>
            <ResultsPage />
          </PerformanceShell>
        }
      />
      <Route
        path="self-review"
        element={
          <PerformanceShell basePath={basePath}>
            <SelfReviewPage />
          </PerformanceShell>
        }
      />
      <Route
        path="goals"
        element={
          <PerformanceShell basePath={basePath}>
            <GoalsPage />
          </PerformanceShell>
        }
      />
      <Route
        path="insights"
        element={
          <PerformanceShell basePath={basePath}>
            <EmployeeInsights />
          </PerformanceShell>
        }
      />
    </Routes>
  );
}
