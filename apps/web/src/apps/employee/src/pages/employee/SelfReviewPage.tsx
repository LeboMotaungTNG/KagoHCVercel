import EvaluationForm from '../../components/EvaluationForm';
import { getCurrentUserId, getSessionUser } from '../../utils/session';

export default function SelfReviewPage() {
  const employeeId = getCurrentUserId();
  const user = getSessionUser();

  if (!employeeId) {
    return <div className="p-4 text-danger">Could not determine your employee record. Please log in again.</div>;
  }

  return (
    <EvaluationForm
      employeeId={employeeId}
      employeeName={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined}
      department={(user?.department as string) || undefined}
      designation={(user?.position as string) || undefined}
      period="Q2 2026"
      purpose="annual"
      type="self_review"
    />
  );
}
