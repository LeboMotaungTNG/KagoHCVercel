import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import SharedLayout from './SharedLayout';
import AnalyticsInsightsPage from '../employee/src/pages/owner/AnalyticsInsightsPage';
import { perfBtnPrimary, perfBtnSecondary } from '../employee/src/components/PerformanceUI';

export default function ManagerAnalyticsPage() {
  return (
    <SharedLayout title="Team Insights">
      <Helmet>
        <title>Team Insights | Kago HC</title>
      </Helmet>
      <div className="mb-3 d-flex flex-wrap gap-2">
        <Link to="/manager/performance" style={{ ...perfBtnSecondary, textDecoration: 'none' }}>
          Team evaluations
        </Link>
        <Link to="/manager/team-goals" style={{ ...perfBtnSecondary, textDecoration: 'none' }}>
          Team goals
        </Link>
        <span style={{ ...perfBtnPrimary, display: 'inline-flex', alignItems: 'center' }}>
          Insights & interventions
        </span>
      </div>
      <AnalyticsInsightsPage mode="manager" />
    </SharedLayout>
  );
}
