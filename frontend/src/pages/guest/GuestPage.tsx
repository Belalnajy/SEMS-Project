import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineAcademicCap } from 'react-icons/hi';
import ConfirmModal from '../../components/ConfirmModal';

export default function GuestPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [guestName, setGuestName] = useState('');

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<'select' | 'exam' | 'result'>('select');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${baseURL}/guest/exams`)
      .then((r) => r.json())
      .then(setExams)
      .catch(() => {});
    fetch(`${baseURL}/subjects`).catch(() => {});
  }, []);

  const startExam = async () => {
    if (!guestName.trim()) {
      toast.error('يرجى إدخال اسمك للبدء');
      return;
    }
    if (!selectedExam) {
      toast.error('يرجى اختيار امتحان');
      return;
    }
    try {
      const baseURL =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(
        `${baseURL}/guest/exams/${selectedExam.id}/start`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل البدء');

      setQuestions(data.questions || []);
      setTimeLeft(data.exam?.duration_minutes * 60 || 1800);
      setStarted(true);
      setPhase('exam');
    } catch (err: any) {
      toast.error(err.message || 'فشل في بدء الامتحان');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const submittedAnswers = Object.entries(answers).map(([qId, aId]) => ({
        question_id: parseInt(qId),
        answer_id: aId as number,
      }));
      const baseURL =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(
        `${baseURL}/guest/exams/${selectedExam.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: submittedAnswers,
            guest_name: guestName,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPhase('result');
    } catch (err: any) {
      toast.error(err.message || 'فشل في تسليم الامتحان');
    } finally {
      setSubmitting(false);
    }
  }, [answers, selectedExam, guestName, submitting]);

  // Timer logic
  useEffect(() => {
    if (!started || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, result, handleSubmit]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (phase === 'result' && result) {
    const isPass = parseFloat(result.percentage) >= 50;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="bg-slate-800 border border-slate-700 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-full h-2 ${isPass ? 'bg-green-500' : 'bg-red-500'}`}
          />

          <div className="flex justify-center mb-8">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center ring-8 ${
                isPass
                  ? 'bg-green-500/10 ring-green-500/20 text-green-500'
                  : 'bg-red-500/10 ring-red-500/20 text-red-500'
              }`}>
              <span className="text-4xl font-bold">
                {parseFloat(result.percentage).toFixed(0)}%
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            {isPass ? `🎉 أحسنت يا ${guestName}!` : '😔 حاول مرة أخرى'}
          </h2>
          <p className="text-slate-400 text-lg mb-6">
            لقد حصلت على{' '}
            <span className="font-bold text-white mx-1">{result.score}</span>{' '}
            درجة من أصل{' '}
            <span className="font-bold text-white mx-1">
              {result.total_questions}
            </span>
          </p>

          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm mb-8">
            ملاحظة: نتائج الضيف لا تُحفظ في التقارير الرسمية للنظام
          </div>

          <button
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors text-lg mb-4"
            onClick={() => {
              setPhase('select');
              setSelectedExam(null);
              setResult(null);
              setAnswers({});
              setStarted(false);
            }}>
            العودة للقائمة
          </button>

          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors">
            إنشاء حساب رسمي وتسجيل الدخول
          </Link>
        </motion.div>
      </div>
    );
  }

  if (phase === 'exam' && started) {
    const isLowTime = timeLeft < 60;
    return (
      <div className="min-h-screen bg-slate-900 pb-20 pt-8 px-4">
        <ConfirmModal
          isOpen={showSubmitConfirm}
          onClose={() => setShowSubmitConfirm(false)}
          onConfirm={() => {
            setShowSubmitConfirm(false);
            handleSubmit();
          }}
          title="تسليم الامتحان"
          message={
            Object.keys(answers).length < questions.length
              ? 'لم تقم بالإجابة على جميع الأسئلة. هل أنت متأكد من رغبتك في التسليم؟'
              : 'هل أنت متأكد من تسليم الامتحان النهائي؟'
          }
          confirmText="نعم، تسليم"
          loading={submitting}
        />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div
            className={`sticky top-4 z-40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/90 backdrop-blur-md p-4 px-6 rounded-2xl border ${
              isLowTime
                ? 'border-red-500/50 shadow-lg shadow-red-500/10'
                : 'border-slate-700 shadow-sm'
            } mb-8 transition-colors`}>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                {selectedExam?.name}
              </h1>
              <p className="text-sm text-slate-400">
                الضيف: <span className="text-blue-400">{guestName}</span>
              </p>
            </div>
            <div
              className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-mono text-xl font-bold transition-colors ${
                isLowTime
                  ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'
                  : 'bg-slate-900 text-slate-200 border border-slate-700'
              }`}>
              <HiOutlineClock
                className={isLowTime ? 'text-red-500' : 'text-slate-400'}
              />
              <span className="tracking-widest">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 px-2">
            <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">
              <span>تمت الإجابة: {Object.keys(answers).length}</span>
              <span>
                المتبقي: {questions.length - Object.keys(answers).length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 border border-slate-700">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%`,
                }}></div>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q: any, i: number) => (
              <motion.div
                key={q.id}
                className={`bg-slate-800 rounded-2xl p-6 border transition-colors ${
                  answers[q.id]
                    ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                    : 'border-slate-700 shadow-sm'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <div className="flex gap-4 mb-6">
                  <span
                    className={`flex-none h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                      answers[q.id]
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                    {i + 1}
                  </span>
                  <p className="text-lg text-white font-medium leading-relaxed pt-0.5">
                    {q.question_text}
                  </p>
                </div>

                <div className="space-y-3 pl-12 pr-2">
                  {q.answers?.map((a: any) => {
                    const isSelected = answers[q.id] === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all group overflow-hidden ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-blue-100'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                        }`}
                        onClick={() =>
                          setAnswers({ ...answers, [q.id]: a.id })
                        }>
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
                        )}
                        <div className="flex items-center gap-4 w-full relative z-10">
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors flex-none ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-500 group-hover:border-slate-400'
                            }`}>
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                            )}
                          </div>
                          <span
                            className={`text-base flex-1 ${isSelected ? 'font-medium' : ''}`}>
                            {a.answer_text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center bg-slate-800/50 p-8 rounded-2xl border border-slate-700 border-dashed">
            <button
              className={`flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                submitting || Object.keys(answers).length === 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 hover:shadow-blue-500/25'
              }`}
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}>
              {submitting ? 'جاري التسليم...' : '📤 تسليم الامتحان النهائي'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Select phase
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 w-full max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 text-blue-500 mb-6 border border-blue-500/20">
          <HiOutlineAcademicCap className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">منصة التحصيلي</h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          الثانوية الحادية والعشرون - إعداد أ. ابتسام السلمي
          <br />
          يمكنك أداء الامتحان كزائر لتقييم مستواك.
          <br className="hidden sm:block" />
          ملاحظة: النتائج لن تُحفظ في التقارير الرسمية للنظام.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              الاسم <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="الاسم الثلاثي للاختبار..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              اختر امتحاناً <span className="text-red-400">*</span>
            </label>

            {exams.length === 0 ? (
              <div className="bg-slate-900/50 rounded-xl p-6 text-center border border-slate-700 border-dashed">
                <p className="text-slate-400 text-sm">
                  جاري تحميل الامتحانات المتاحة...
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all group overflow-hidden ${
                      selectedExam?.id === exam.id
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                    onClick={() => setSelectedExam(exam)}>
                    {selectedExam?.id === exam.id && (
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
                    )}

                    <div className="flex items-center gap-4 w-full relative z-10">
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors flex-none ${
                          selectedExam?.id === exam.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-500 group-hover:border-slate-400'
                        }`}>
                        {selectedExam?.id === exam.id && (
                          <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1">
                        <strong
                          className={`block text-base mb-1 ${selectedExam?.id === exam.id ? 'text-blue-400 font-bold' : 'text-white'}`}>
                          {exam.name}
                        </strong>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            📘 {exam.subject_name || exam.subject?.name}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="flex items-center gap-1">
                            <HiOutlineClock /> {exam.duration_minutes} دقيقة
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg text-lg ${
                guestName.trim() && selectedExam
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              onClick={startExam}
              disabled={!guestName.trim() || !selectedExam}>
              🚀 ابدأ الامتحان الآن
            </button>
          </div>
        </div>

        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <Link
            to="/login"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
            هل أنت طالب مسجل؟ تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
