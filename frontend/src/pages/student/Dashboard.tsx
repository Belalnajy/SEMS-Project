import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineAcademicCap, HiCheckCircle, HiClock } from 'react-icons/hi';
import { ExamModel, Result, Subject } from '../../types/api';

export default function StudentDashboard() {
  const [exams, setExams] = useState<ExamModel[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          api.get<ExamModel[]>('/exams'),
          api.get<Result[]>('/exams/my/results'),
        ]);

        const activeExams = (examsRes.data || []).filter((e) => e.is_active);
        setExams(activeExams);

        // Safely set results (backend returns array directly or inside reports)
        const resultsArray = Array.isArray(resultsRes.data)
          ? resultsRes.data
          : (resultsRes.data as any).reports || [];
        setResults(resultsArray);

        if (activeExams.length > 0) {
          // Set initial tab to the first subject available
          const firstSubjectId = activeExams[0].subject?.id;
          setActiveSubjectId(firstSubjectId);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigate = useNavigate();

  // Unique subjects that have exams
  const subjectsMap = new Map<number, Subject>();
  exams.forEach((exam) => {
    if (exam.subject) {
      subjectsMap.set(exam.subject.id, exam.subject);
    }
  });
  const availableSubjects = Array.from(subjectsMap.values());

  const filteredExams = activeSubjectId
    ? exams.filter((e) => e.subject?.id === activeSubjectId)
    : [];

  const getResultForExam = (examId: number) => {
    return results.find((r) => r.exam_id === examId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">مرحباً بك</h1>
          <p className="text-slate-400 text-lg">
            منصة الاختبارات الذكية - اختر المادة وابدأ الامتحان
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </motion.div>

      {/* Subjects Tabs */}
      {availableSubjects.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HiOutlineAcademicCap className="text-blue-500 h-6 w-6" />
              المواد الدراسية
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {availableSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setActiveSubjectId(subject.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeSubjectId === subject.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}>
                {subject.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubjectId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam, i) => {
                const result = getResultForExam(exam.id);
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/student/exam/${exam.id}`)}
                    className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-500 group-hover:scale-110 transition-transform">
                          <HiOutlineAcademicCap className="h-6 w-6" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-700">
                          <HiClock className="h-3.5 w-3.5" />
                          {exam.duration_minutes} دقيقة
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {exam.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {exam.subject?.name}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      {result ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1 text-xs">
                              <span className="text-slate-400">آخر درجة:</span>
                              <span className="font-bold text-green-400">
                                {result.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${result.percentage}%` }}
                                className={`h-full ${
                                  result.percentage >= 50
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="text-green-500 ml-2">
                            <HiCheckCircle className="h-6 w-6" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex items-center justify-center py-2 px-4 rounded-xl bg-blue-600 font-bold text-white group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                            ابدأ الآن
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 border-dashed text-center">
          <p className="text-slate-400 text-lg">
            لا توجد امتحانات متاحة حالياً.
          </p>
        </div>
      )}

      {/* Stats Section (Optional but nice) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-1">الامتحانات المكتملة</p>
          <p className="text-3xl font-bold text-white">{results.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-1">متوسط الدرجات</p>
          <p className="text-3xl font-bold text-white">
            {results.length > 0
              ? Math.round(
                  results.reduce((acc, r) => acc + r.percentage, 0) /
                    results.length,
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-1">المواد المتاحة</p>
          <p className="text-3xl font-bold text-white">
            {availableSubjects.length}
          </p>
        </div>
      </div>
    </div>
  );
}
