import { useEffect, useState } from 'react';
import EvaluationForm from '../../components/EvaluationForm';
import { getSessionUser } from '../../utils/session';
import { resolveCurrentEmployee, type ResolvedEmployee } from '../../utils/resolveEmployee';
import { C } from '../../../../../shared/utils/employee';


export default function SelfReviewPage() {
  const sessionUser = getSessionUser();
  const [employee, setEmployee] = useState<ResolvedEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resolveCurrentEmployee()
      .then((emp) => {
        if (cancelled) return;
        if (!emp) {
          setError(
            'Could not find your employee record. Ask HR to link your login to an employee profile.'
          );
          return;
        }
        setEmployee(emp);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load your employee record');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true; 
    };
  }, []);

  if (loading) {
    return <div className="p-4" style={{ color: C.muted }}>Loading your review…</div>;
  }

  if (error || !employee) {
    return <div className="p-4 text-danger">{error || 'Employee record not found.'}</div>;
  }

  const displayName =
    [employee.firstName, employee.lastName].filter(Boolean).join(' ') ||
    [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ') ||
    undefined;

  return (
    <EvaluationForm
      employeeId={employee._id}
      employeeName={displayName}
      department={employee.department || (sessionUser?.department as string) || undefined}
      designation={
        employee.designation ||
        employee.position ||
        (sessionUser?.position as string) ||
        undefined
      }
      period="Q2 2026"
      purpose="annual"
      type="self_review"
    />
  );
}
