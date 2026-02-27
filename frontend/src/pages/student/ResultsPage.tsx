import { useState, useEffect } from 'react';
import api from '../../api/client';

import { HiOutlineDocumentText } from 'react-icons/hi';

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/exams/my/results')
      .then((res) => {
        setResults(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">نتائجي</h1>
          <p className="text-sm text-slate-400">
            سجل جميع نتائج امتحاناتك السابقة
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400 shadow-sm">
          جاري تحميل النتائج...
        </div>
      ) : results.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="bg-slate-900/50 p-4 rounded-full border border-slate-700">
              <HiOutlineDocumentText className="h-8 w-8 text-slate-500" />
            </div>
            <p>لا توجد نتائج بعد. ابدأ بأداء الامتحانات المتاحة لك.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {results.map((r, i) => (
              <div
                key={r.id || i}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">#{i + 1}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      parseFloat(r.percentage) >= 50
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    {r.percentage}%
                  </span>
                </div>
                <div>
                  <p className="text-blue-400 font-semibold">{r.subject_name}</p>
                  <p className="text-white text-sm mt-1">{r.exam_name}</p>
                </div>
                <div className="text-sm text-slate-300">
                  الدرجة: <span className="font-bold text-white">{r.score}</span>
                  <span className="text-slate-500">/{r.total_questions}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(r.completed_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">#</th>
                    <th className="px-6 py-4 font-medium">المادة</th>
                    <th className="px-6 py-4 font-medium">النموذج</th>
                    <th className="px-6 py-4 font-medium text-center">الدرجة</th>
                    <th className="px-6 py-4 font-medium text-center">النسبة المئوية</th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {results.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-400 font-medium">{r.subject_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{r.exam_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-bold">{r.score}</span>
                        <span className="text-slate-500">/{r.total_questions}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            parseFloat(r.percentage) >= 50
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(r.completed_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
