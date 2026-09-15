import { useCallback, useState } from 'react';
import { API_URL } from '../shared/utils/employee';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_URL}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      const list = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      setEmployees(list);
      return list;
    } catch (err: any) {
      const message = err?.message || 'Failed to load employees';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { employees, loading, error, fetchEmployees };
};
