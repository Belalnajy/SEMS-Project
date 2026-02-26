import { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  HiOutlineDownload,
  HiOutlinePrinter,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Section, Subject } from '../../types/api';

const COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

interface PerformanceReport {
  subject_id: number;
  subject_name: string;
  avg_percentage: string;
  total_attempts: string;
}

interface SectionRank {
  section_id: number;
  section_name: string;
  avg_percentage: string;
  total_students: string;
  total_exams: string;
}

export default function ReportsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const [overall, setOverall] = useState<PerformanceReport[]>([]);
  const [studentPerf, setStudentPerf] = useState<any[]>([]);
  const [sectionRanking, setSectionRanking] = useState<SectionRank[]>([]);
  const [tab, setTab] = useState<'overall' | 'students' | 'sections'>(
    'overall',
  );

  const fetchFilters = async () => {
    try {
      const [secRes, subRes] = await Promise.all([
        api.get('/sections'),
        api.get('/subjects'),
      ]);
      setSections(secRes.data);
      setSubjects(subRes.data);
    } catch {}
  };

  const fetchData = async () => {
    const params: any = {};
    if (sectionFilter) params.section_id = sectionFilter;
    if (subjectFilter) params.subject_id = subjectFilter;
    try {
      const [oRes, spRes, srRes] = await Promise.all([
        api.get('/reports/performance', { params }),
        api.get('/reports/students', { params }),
        api.get('/reports/sections', { params }),
      ]);
      setOverall(oRes.data.stats || oRes.data || []);
      setStudentPerf(spRes.data.reports || spRes.data || []);
      setSectionRanking(srRes.data.ranking || srRes.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchData();
  }, [sectionFilter, subjectFilter]);

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (sectionFilter) params.set('section_id', sectionFilter);
    if (subjectFilter) params.set('subject_id', subjectFilter);

    const token = localStorage.getItem('sems_token');
    if (token) params.set('token', token);

    // Use dynamic API URL
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(
      `${API_BASE_URL}/reports/export/excel?${params.toString()}`,
      '_blank',
    );
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();
    if (sectionFilter) params.set('section_id', sectionFilter);
    if (subjectFilter) params.set('subject_id', subjectFilter);

    const token = localStorage.getItem('sems_token');
    if (token) params.set('token', token);

    // Use dynamic API URL
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(
      `${API_BASE_URL}/reports/export/pdf?${params.toString()}`,
      '_blank',
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            التقارير والإحصائيات
          </h1>
          <p className="text-sm text-slate-400">
            عرض أداء الطلاب وتصدير التقارير
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={handleExportExcel}>
            <HiOutlineDownload className="h-4 w-4" /> تصدير Excel
          </button>
          <button
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={handleExportPdf}>
            <HiOutlineDocumentText className="h-4 w-4" /> تصدير PDF
          </button>
          <button
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={() => window.print()}>
            <HiOutlinePrinter className="h-4 w-4" /> طباعة
          </button>
        </div>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm print:hidden">
        <select
          className="w-full sm:w-48 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}>
          <option value="">كل الفصول (للتصفية)</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="w-full sm:w-48 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">كل المواد (للتصفية)</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 pb-2 print:hidden">
        {[
          { key: 'overall', label: 'الأداء العام (رسوم بيانية)' },
          { key: 'students', label: 'أداء وتفاصيل الطلاب' },
          { key: 'sections', label: 'ترتيب الفصول' },
        ].map((t) => (
          <button
            key={t.key}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            onClick={() => setTab(t.key as any)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="print-content">
        {/* Overall Performance */}
        {tab === 'overall' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm print:shadow-none print:border-slate-300 print:break-inside-avoid">
              <h3 className="text-lg font-bold text-white mb-6 print:text-black">
                متوسط الأداء للطلاب حسب المادة
              </h3>
              <div className="h-[300px] w-full origin-top-right">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={overall.map((o) => ({
                      name: o.subject_name,
                      avg: parseFloat(o.avg_percentage || '0').toFixed(1),
                    }))}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#94a3b8',
                        fontSize: 13,
                        fontFamily: 'Tajawal, sans-serif',
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 13 }}
                      domain={[0, 100]}
                      dx={-20}
                    />
                    <Tooltip
                      cursor={{ fill: '#334155', opacity: 0.4 }}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar
                      dataKey="avg"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      name="المتوسط %"
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm print:shadow-none print:border-slate-300">
              <h3 className="text-lg font-bold text-white mb-6">
                توزيع محاولات الاختبارات حسب المادة
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overall.map((o) => ({
                        name: o.subject_name,
                        value: parseInt(o.total_attempts),
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={false}>
                      {overall.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Student Performance */}
        {tab === 'students' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">اسم الطالب</th>
                    <th className="px-6 py-4 font-medium">رقم الطالب</th>
                    <th className="px-6 py-4 font-medium">الفصل</th>
                    <th className="px-6 py-4 font-medium">المادة</th>
                    <th className="px-6 py-4 font-medium">النموذج</th>
                    <th className="px-6 py-4 font-medium text-center">
                      الدرجة
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      النسبة
                    </th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {studentPerf.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-slate-400">
                        لا توجد نتائج مطابقة
                      </td>
                    </tr>
                  ) : (
                    studentPerf.map((r, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {r.student_name || r.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slate-400 font-mono text-xs">
                            {r.student_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {r.section_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-blue-400">
                          {r.subject_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {r.exam_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-bold">{r.score}</span>
                          <span className="text-slate-500">
                            /{r.total_questions}
                          </span>
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
                          {r.completed_at
                            ? new Date(r.completed_at).toLocaleDateString(
                                'ar-EG',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                },
                              )
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section Ranking */}
        {tab === 'sections' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionRanking.map((s, i) => (
              <div
                className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-sm text-center relative overflow-hidden group hover:border-blue-500/50 transition-colors"
                key={s.section_id}>
                <div className="absolute top-0 right-0 w-2 h-full bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                <div className="flex justify-center mb-4 pb-2">
                  {i === 0 ? (
                    <div className="bg-yellow-500/20 p-3 rounded-full border border-yellow-500/50">
                      <HiTrophy className="h-10 w-10 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    </div>
                  ) : i === 1 ? (
                    <div className="bg-slate-300/20 p-3 rounded-full border border-slate-300/50">
                      <HiTrophy className="h-10 w-10 text-slate-300" />
                    </div>
                  ) : i === 2 ? (
                    <div className="bg-amber-600/20 p-3 rounded-full border border-amber-600/50">
                      <HiTrophy className="h-10 w-10 text-amber-600" />
                    </div>
                  ) : (
                    <div className="bg-slate-700/50 h-16 w-16 flex items-center justify-center rounded-full border border-slate-600">
                      <span className="text-2xl text-slate-400 font-bold">
                        #{i + 1}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {s.section_name}
                </h3>

                <div className="bg-slate-900/50 rounded-lg p-4 mt-6 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">متوسط الدرجات</p>
                  <p className="text-3xl font-bold text-green-400">
                    {parseFloat(s.avg_percentage).toFixed(1)}%
                  </p>
                </div>

                <div className="flex justify-between mt-6 px-4 text-sm text-slate-400">
                  <div className="text-center">
                    <span className="block font-bold text-white mb-1">
                      {s.total_students}
                    </span>
                    طالب
                  </div>
                  <div className="w-px bg-slate-700"></div>
                  <div className="text-center">
                    <span className="block font-bold text-white mb-1">
                      {s.total_exams}
                    </span>
                    امتحان
                  </div>
                </div>
              </div>
            ))}
            {sectionRanking.length === 0 && (
              <div className="col-span-full bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 border-dashed text-center text-slate-400">
                لا توجد بيانات متاحة لترتيب الفصول.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
