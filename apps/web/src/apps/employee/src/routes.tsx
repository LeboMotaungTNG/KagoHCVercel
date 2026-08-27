// Reference route map for the performance module (wired in App.tsx / OwnerDashboard).

import { Route } from 'react-router-dom';
import FrameworkLibraryPage from './pages/owner/FrameworkLibraryPage';
import FrameworkBuilderPage from './pages/owner/FrameworkBuilderPage';
import ReviewsDashboardPage from './pages/owner/ReviewsDashboardPage';
import ObjectivesPage from './pages/owner/ObjectivesPage';
import AnalyticsInsightsPage from './pages/owner/AnalyticsInsightsPage';
import SelfReviewPage from './pages/employee/SelfReviewPage';
import ResultsPage from './pages/employee/ResultsPage';
import GoalsPage from './pages/employee/GoalsPage';

export const performanceReviewRoutes = (
  <>
    <Route path="/owner/frameworks" element={<FrameworkLibraryPage />} />
    <Route path="/owner/frameworks/:id/edit" element={<FrameworkBuilderPage />} />
    <Route path="/owner/reviews" element={<ReviewsDashboardPage />} />
    <Route path="/owner/objectives" element={<ObjectivesPage />} />
    <Route path="/owner/analytics" element={<AnalyticsInsightsPage />} />
    <Route path="/employee/self-review" element={<SelfReviewPage />} />
    <Route path="/employee/reviews" element={<ResultsPage />} />
    <Route path="/employee/goals" element={<GoalsPage />} />
  </>
);
