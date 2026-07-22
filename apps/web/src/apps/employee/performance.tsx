import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SharedLayout from './SharedLayout';
import { C, R } from '../../shared/utils/employee';
import ResultsPage from './src/pages/employee/ResultsPage';
import SelfReviewPage from './src/pages/employee/SelfReviewPage';
import GoalsPage from './src/pages/employee/GoalsPage';
import AnalyticsInsightsPage from './src/pages/owner/AnalyticsInsightsPage';
import { getCurrentUserId } from './src/utils/session';

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

const PerformanceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SharedLayout title="Performance">
    <Helmet>
      <title>Performance | Kago HC</title>
    </Helmet>
    <div className="mb-4 d-flex flex-wrap gap-2">
      <TabLink to="/employee/performance/reviews" label="My reviews" />
      <TabLink to="/employee/performance/self-review" label="Self-review" />
      <TabLink to="/employee/performance/goals" label="My goals" />
      <TabLink to="/employee/performance/insights" label="Development plan" />
    </div>
    {children}
  </SharedLayout>
);

function EmployeeInsights() {
  return <AnalyticsInsightsPage employeeId={getCurrentUserId()} mode="employee" />;
}

export default function EmployeePerformance() {
  return (
    <Routes>
      <Route index element={<Navigate to="reviews" replace />} />
      <Route
        path="reviews"
        element={
          <PerformanceShell>
            <ResultsPage />
          </PerformanceShell>
        }
      />
      <Route
        path="self-review"
        element={
          <PerformanceShell>
            <SelfReviewPage />
          </PerformanceShell>
        }
      />
      <Route
        path="goals"
        element={
          <PerformanceShell>
            <GoalsPage />
          </PerformanceShell>
        }
      />
      <Route
        path="insights"
        element={
          <PerformanceShell>
            <EmployeeInsights />
          </PerformanceShell>
        }
      />
    </Routes>
  );
}
