import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineDownload,
  HiOutlineLightBulb,
} from 'react-icons/hi';
import { ExamModel, Subject, Question } from '../../types/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamModel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('');

  const [showExamModal, setShowExamModal] = useState(false);
  const [showQModal, setShowQModal] = useState(false);

  const [editExam, setEditExam] = useState<ExamModel | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamModel | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  const [examForm, setExamForm] = useState({
    subject_id: '',
    name: '',
    duration_minutes: 30,
    allow_reattempt: false,
    is_active: true,
  });

  const [qForm, setQForm] = useState({
    question_text: '',
    sort_order: 0,
    answers: [
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
    ],
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState<{
    type: 'exam' | 'question';
    id: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExams = async () => {
    try {
      const params = subjectFilter ? { subject_id: subjectFilter } : {};
      const res = await api.get<ExamModel[]>('/exams', { params });
      setExams(res.data);
    } catch {}
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get<Subject[]>('/subjects');
      setSubjects(res.data);
    } catch {}
  };

  const fetchQuestions = async (examId: number) => {
    try {
      const res = await api.get<Question[]>(`/exams/${examId}/questions`);
      setQuestions(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editExam) {
        await api.put(`/exams/${editExam.id}`, examForm);
        toast.success('تم تحديث نموذج الامتحان');
      } else {
        await api.post('/exams', examForm);
        toast.success('تم إنشاء نموذج الامتحان');
      }
      setShowExamModal(false);
      setEditExam(null);
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const confirmDeleteExam = async () => {
    if (!showConfirmDelete || showConfirmDelete.type !== 'exam') return;
    setIsDeleting(true);
    try {
      await api.delete(`/exams/${showConfirmDelete.id}`);
      toast.success('تم الحذف بنجاح');
      if (selectedExam?.id === showConfirmDelete.id) {
        setSelectedExam(null);
        setQuestions([]);
      }
      fetchExams();
      setShowConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    const filteredAnswers = qForm.answers.filter(
      (ans) => ans.answer_text.trim() !== '',
    );

    if (filteredAnswers.length < 2) {
      toast.error('يجب إضافة خيارين على الأقل');
      return;
    }

    const hasCorrect = filteredAnswers.some((ans) => ans.is_correct);
    if (!hasCorrect) {
      toast.error('يرجى تحديد إجابة صحيحة واحدة على الأقل');
      return;
    }

    try {
      if (editQuestion) {
        await api.put(
          `/exams/${selectedExam.id}/questions/${editQuestion.id}`,
          {
            question_text: qForm.question_text,
            sort_order: qForm.sort_order,
            answers: filteredAnswers,
          },
        );
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        await api.post(`/exams/${selectedExam.id}/questions`, {
          question_text: qForm.question_text,
          sort_order: qForm.sort_order,
          answers: filteredAnswers,
        });
        toast.success('تم إضافة السؤال بنجاح');
      }

      setShowQModal(false);
      setEditQuestion(null);
      setQForm({
        question_text: '',
        sort_order: 0,
        answers: [
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
        ],
      });
      fetchQuestions(selectedExam.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ في معالجة السؤال');
    }
  };

  const confirmDeleteQuestion = async () => {
    if (
      !showConfirmDelete ||
      showConfirmDelete.type !== 'question' ||
      !selectedExam
    )
      return;
    setIsDeleting(true);
    try {
      await api.delete(
        `/exams/${selectedExam.id}/questions/${showConfirmDelete.id}`,
      );
      toast.success('تم حذف السؤال');
      fetchQuestions(selectedExam.id);
      setShowConfirmDelete(null);
    } catch (err: any) {
      toast.error('فشل حذف السؤال');
    } finally {
      setIsDeleting(false);
    }
  };

  const openExam = (exam: ExamModel) => {
    setSelectedExam(exam);
    fetchQuestions(exam.id);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedExam) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/exams/${selectedExam.id}/import-questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('تم استيراد الأسئلة بنجاح');
      fetchQuestions(selectedExam.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل استيراد الملف');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            إدارة الامتحانات
          </h1>
          <p className="text-sm text-slate-400">
            إنشاء نماذج الامتحانات وإدارة الأسئلة
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => {
            setEditExam(null);
            setExamForm({
              subject_id: subjects[0]?.id?.toString() || '',
              name: '',
              duration_minutes: 30,
              allow_reattempt: false,
              is_active: true,
            });
            setShowExamModal(true);
          }}>
          <HiOutlinePlus className="h-5 w-5" /> نموذج جديد
        </button>
      </div>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={
          showConfirmDelete?.type === 'exam'
            ? confirmDeleteExam
            : confirmDeleteQuestion
        }
        title="تأكيد الحذف"
        message={
          showConfirmDelete?.type === 'exam'
            ? 'حذف نموذج الامتحان وجميع الأسئلة والنتائج المرتبطة به؟'
            : 'حذف السؤال وإجاباته؟'
        }
        isDanger={true}
        loading={isDeleting}
      />

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex items-center">
        <select
          className="w-full sm:w-64 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setTimeout(fetchExams, 100);
          }}>
          <option value="">كل المواد</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Exams list */}
        <div
          className={`${selectedExam ? 'w-full lg:w-1/3 xl:w-1/4' : 'w-full'}`}>
          <div
            className={`grid gap-4 ${!selectedExam ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {exams.map((exam) => (
              <div
                key={exam.id}
                className={`bg-slate-800 rounded-xl p-5 border shadow-sm transition-all cursor-pointer ${
                  selectedExam?.id === exam.id
                    ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-800/80'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
                onClick={() => openExam(exam)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {exam.name}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                      exam.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}>
                    {exam.is_active ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
                  {(exam as any).subject_name || exam.subject?.name} —{' '}
                  {exam.duration_minutes} دقيقة
                </p>
                <div className="flex gap-2 mt-auto">
                  <button
                    className="flex-1 flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditExam(exam);
                      setExamForm({
                        subject_id:
                          (exam as any).subject_id?.toString() ||
                          exam.subject?.id?.toString() ||
                          '',
                        name: exam.name,
                        duration_minutes: exam.duration_minutes,
                        allow_reattempt: exam.allow_reattempt,
                        is_active: exam.is_active,
                      });
                      setShowExamModal(true);
                    }}>
                    <HiOutlinePencil className="h-4 w-4" /> تعديل
                  </button>
                  <button
                    className="flex-none flex justify-center items-center bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmDelete({ type: 'exam', id: exam.id });
                    }}>
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {exams.length === 0 && (
              <div className="col-span-full bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 border-dashed text-center text-slate-400">
                لا توجد امتحانات، يرجى إنشاء نموذج جديد للبدء
              </div>
            )}
          </div>
        </div>

        {/* Questions panel */}
        {selectedExam && (
          <div className="w-full lg:w-2/3 xl:w-3/4 bg-slate-800 rounded-xl border border-slate-700 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  أسئلة:{' '}
                  <span className="text-blue-400">{selectedExam.name}</span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  إجمالي الأسئلة: {questions.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="group relative flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap">
                  <HiOutlineDownload className="h-5 w-5 rotate-180" /> استيراد
                  Excel
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                  />
                  <div className="hidden group-hover:block absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl z-50 text-xs text-slate-300 w-72 leading-relaxed whitespace-normal pointer-events-none">
                    <p className="font-bold border-b border-slate-700 pb-2 mb-2 text-blue-400">
                      نسق الملف المطلوب (Excel):
                    </p>
                    <ul className="space-y-1">
                      <li>
                        • <code className="text-white">السؤال</code>: نص السؤال
                      </li>
                      <li>
                        • <code className="text-white">A, B, C, D</code>:
                        الخيارات الأربعة
                      </li>
                      <li>
                        • <code className="text-white">الإجابة الصحيحه</code>:
                        حرف الخيار (A, B, C, D)
                      </li>
                    </ul>
                    <p className="mt-2 text-[10px] text-slate-500 italic">
                      يدعم النظام أيضاً النسخ باللغة الإنجليزية (question,
                      answer1-4, correct_answer)
                    </p>
                  </div>
                </label>
                <button
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                  onClick={() => {
                    setEditQuestion(null);
                    setQForm({
                      question_text: '',
                      sort_order: 0,
                      answers: [
                        { answer_text: '', is_correct: false },
                        { answer_text: '', is_correct: false },
                        { answer_text: '', is_correct: false },
                        { answer_text: '', is_correct: false },
                      ],
                    });
                    setShowQModal(true);
                  }}>
                  <HiOutlinePlus className="h-5 w-5" /> إضافة سؤال
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="bg-slate-900/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <HiOutlinePlus className="h-8 w-8 text-slate-500" />
                  </div>
                  <p>لا توجد أسئلة مضافة حتى الآن في هذا النموذج.</p>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex gap-3">
                        <span className="flex-none bg-blue-600 text-white h-7 w-7 rounded-md flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </span>
                        <p className="text-white font-medium text-base pt-0.5 leading-relaxed">
                          {q.question_text}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-none text-slate-500 hover:text-blue-500 transition-colors p-1 bg-slate-800 rounded hover:bg-blue-500/10"
                          title="تعديل السؤال"
                          onClick={() => {
                            setEditQuestion(q);
                            setQForm({
                              question_text: q.question_text,
                              sort_order: q.sort_order || 0,
                              answers:
                                q.answers?.map((a) => ({
                                  answer_text: a.answer_text,
                                  is_correct: !!a.is_correct,
                                })) || [],
                            });
                            // Ensure there are at least 4 answer slots for the UI
                            if (q.answers && q.answers.length < 4) {
                              const extra = 4 - q.answers.length;
                              setQForm((prev) => ({
                                ...prev,
                                answers: [
                                  ...prev.answers,
                                  ...Array(extra).fill({
                                    answer_text: '',
                                    is_correct: false,
                                  }),
                                ],
                              }));
                            }
                            setShowQModal(true);
                          }}>
                          <HiOutlinePencil className="h-5 w-5" />
                        </button>
                        <button
                          className="flex-none text-slate-500 hover:text-red-500 transition-colors p-1 bg-slate-800 rounded hover:bg-red-500/10"
                          title="حذف السؤال"
                          onClick={() =>
                            setShowConfirmDelete({ type: 'question', id: q.id })
                          }>
                          <HiOutlineTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10 pr-2">
                      {q.answers?.map((a) => (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                            a.is_correct
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div
                              className={`h-3 w-3 rounded-full flex-none ${a.is_correct ? 'bg-green-500' : 'bg-slate-600'}`}
                            />
                            <span className="truncate">{a.answer_text}</span>
                          </div>
                          {a.is_correct && (
                            <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded flex-none mr-2">
                              ✓ صحيحة
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exam Modal */}
      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title={editExam ? 'تعديل النموذج' : 'نموذج امتحان جديد'}
        maxWidth="max-w-md">
        <form onSubmit={handleExamSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              المادة
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={examForm.subject_id}
              onChange={(e) =>
                setExamForm({ ...examForm, subject_id: e.target.value })
              }
              required>
              <option value="" disabled>
                اختر المادة
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              اسم النموذج
            </label>
            <input
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={examForm.name}
              onChange={(e) =>
                setExamForm({ ...examForm, name: e.target.value })
              }
              placeholder="مثال: الاختبار النصفي الأول"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              المدة (دقائق)
            </label>
            <input
              type="number"
              min="1"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={examForm.duration_minutes}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  duration_minutes: parseInt(e.target.value) || 30,
                })
              }
              required
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={examForm.allow_reattempt}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      allow_reattempt: e.target.checked,
                    })
                  }
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${examForm.allow_reattempt ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${examForm.allow_reattempt ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-white transition-colors">
                السماح بإعادة المحاولة للطالب
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={examForm.is_active}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      is_active: e.target.checked,
                    })
                  }
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${examForm.is_active ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${examForm.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-white transition-colors">
                نموذج مفعل ويظهر للطلاب
              </span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              {editExam ? 'تحديث نموذج الامتحان' : 'إنشاء نموذج امتحان'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Question Modal */}
      <Modal
        isOpen={showQModal && !!selectedExam}
        onClose={() => setShowQModal(false)}
        title={editQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
        maxWidth="max-w-2xl">
        <form onSubmit={handleQSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              نص السؤال
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-y min-h-[100px]"
              placeholder="اكتب نص السؤال هنا..."
              value={qForm.question_text}
              onChange={(e) =>
                setQForm({ ...qForm, question_text: e.target.value })
              }
              required
            />
          </div>

          <div>
            <p className="font-semibold text-slate-300 mb-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2 text-sm">
              <HiOutlineLightBulb className="text-yellow-500 h-5 w-5 shrink-0" />
              <span>
                أضف خيارات الإجابات وحدد الإجابة{' '}
                <span className="text-green-400 font-bold">الصحيحة</span> بالنقر
                على الزر الدائري.
              </span>
            </p>
            <div className="space-y-3">
              {qForm.answers.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                    a.is_correct
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-slate-900 border-slate-700'
                  }`}>
                  <label className="relative flex items-center justify-center cursor-pointer p-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      className="peer sr-only"
                      checked={a.is_correct}
                      onChange={() => {
                        const newAnswers = qForm.answers.map((ans, j) => ({
                          ...ans,
                          is_correct: j === i,
                        }));
                        setQForm({ ...qForm, answers: newAnswers });
                      }}
                    />
                    <div className="h-6 w-6 rounded-full border-2 border-slate-500 peer-checked:border-green-500 peer-checked:bg-green-500 flex items-center justify-center transition-all">
                      {a.is_correct && (
                        <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                      )}
                    </div>
                  </label>
                  <input
                    className={`flex-1 py-2 px-3 bg-transparent text-white focus:outline-none placeholder-slate-500 ${
                      a.is_correct ? 'font-medium' : ''
                    }`}
                    placeholder={`خيار الإجابة رقم ${i + 1}`}
                    value={a.answer_text}
                    onChange={(e) => {
                      const newAnswers = [...qForm.answers];
                      newAnswers[i].answer_text = e.target.value;
                      setQForm({ ...qForm, answers: newAnswers });
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
              {editQuestion ? 'تحديث السؤال' : 'إضافة وإرسال السؤال'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
