import { useState, useEffect } from 'react';
import api from '../../api/client';
import StatsOverview from '../../components/StatsOverview';

interface Stats {
  students: number;
  subjects: number;
  exams: number;
  sections: number;
  visitors: number;
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/stats')
      .then((res) => {
        setStats(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <StatsOverview initialData={stats || undefined} />;
}
