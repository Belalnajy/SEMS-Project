import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { HiOutlineRocketLaunch } from 'react-icons/hi2';
import { ExamModel, Question } from '../../types/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function ExamTakingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamModel | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(new Date().toISOString());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const startExam = async () => {
    try {
      const res = await api.post(`/exams/${id}/start`);
      setExam(res.data.exam);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.exam.duration_minutes * 60);
      setStarted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل في بدء الامتحان');
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
      const res = await api.post(`/exams/${id}/submit`, {
        answers: submittedAnswers,
        started_at: startedAt,
      });
      setResult(res.data.result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل في تسليم الامتحان');
      setSubmitting(false);
    }
  }, [answers, id, startedAt, submitting]);


  const handleReportQuestion = async (questionId: number) => {
    try {
      await api.post(`/exams/${id}/questions/${questionId}/report`, {
        message: 'تم الإبلاغ عن خطأ في السؤال من شاشة الطالب.',
      });
      toast.success('تم إرسال البلاغ إلى المشرف');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذر إرسال البلاغ');
    }
  };

  // Timer
  useEffect(() => {
    if (!started || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, result, handleSubmit]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (result) {
    const isPass = parseFloat(result.percentage) >= 50;
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10">
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
            {isPass ? 'مبروك، لقد نجحت!' : 'للأسف، لم يحالفك الحظ'}
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            لقد حصلت على{' '}
            <span className="font-bold text-white mx-1">{result.score}</span>{' '}
            درجة من أصل{' '}
            <span className="font-bold text-white mx-1">
              {result.total_questions}
            </span>
          </p>

          <button
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors text-lg"
            onClick={() => navigate('/student')}>
            العودة للوحة التحكم
          </button>
        </motion.div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-10 max-w-lg w-full text-center shadow-xl">
          {/* Modal content */}

          <div className="bg-blue-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
            <HiOutlineClock className="h-12 w-12" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            هل أنت مستعد للبَدء؟
          </h1>
          <p className="text-slate-400 mb-2 leading-relaxed">
            بمجرد النقر على زر البدء، سيبدأ المؤقت التنازلي للامتحان ولن تتمكن
            من إيقافه.
          </p>
          <div className="bg-slate-900/50 rounded-lg p-4 mb-8 border border-slate-700 inline-block text-right text-sm">
            <ul className="text-slate-300 space-y-2 list-inside list-disc">
              <li>تأكد من استقرار اتصالك بالإنترنت</li>
              <li>لا تقم بتحديث الصفحة أثناء أداء الامتحان</li>
              <li>سيتم تسليم الامتحان تلقائياً عند انتهاء الوقت</li>
            </ul>
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-600/25 text-lg"
            onClick={startExam}>
            <div className="flex items-center justify-center gap-2">
              <HiOutlineRocketLaunch className="h-6 w-6" />
              ابدأ الامتحان الآن
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isLowTime = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto pb-20">
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
      {/* Sticky Header */}
      <div
        className={`sticky top-4 z-40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/90 backdrop-blur-md p-4 px-6 rounded-2xl border ${
          isLowTime
            ? 'border-red-500/50 shadow-lg shadow-red-500/10'
            : 'border-slate-700 shadow-sm'
        } mb-8 transition-colors`}>
        <div>
          <h1 className="text-xl font-bold text-white">{exam?.name}</h1>
          <p className="text-sm text-blue-400 mt-1">
            <div className="flex items-center gap-1">
              <HiOutlineBookOpen className="h-4 w-4" />
              {(exam as unknown as any)?.subject_name || exam?.subject?.name}
            </div>
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
          <span>المتبقي: {questions.length - Object.keys(answers).length}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 border border-slate-700">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
            }}></div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, i) => (
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
              <div className="flex-1">
                <p className="text-lg text-white font-medium leading-relaxed pt-0.5">
                  {q.question_text}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                  onClick={() => handleReportQuestion(q.id)}>
                  <HiOutlineExclamationCircle className="h-4 w-4" />
                  الإبلاغ عن خطأ في السؤال
                </button>
              </div>
            </div>

            <div className="space-y-3 pl-12 pr-2">
              {q.answers?.map((a) => {
                const isSelected = answers[q.id] === a.id;
                return (
                  <div
                    key={a.id}
                    className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all group overflow-hidden ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500 text-blue-100'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                    onClick={() => setAnswers({ ...answers, [q.id]: a.id })}>
                    {/* Selected Highlight Background Line */}
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
        <h3 className="text-xl font-bold text-white mb-2">
          هل راجعت جميع إجاباتك؟
        </h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          بمجرد النقر على تسليم، لن تتمكن من تعديل إجاباتك أو إعادة الامتحان إذا
          كان غير مسموح بذلك.
        </p>
        <button
          className={`flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
            submitting || Object.keys(answers).length < questions.length
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 hover:shadow-blue-500/25'
          }`}
          onClick={() => setShowSubmitConfirm(true)}
          disabled={submitting || Object.keys(answers).length < questions.length}>
          {submitting ? (
            <>
              <div className="h-5 w-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
              جاري التسليم...
            </>
          ) : (
            <>
              <HiOutlineCheckCircle className="h-6 w-6" /> تسليم الامتحان
              النهائي
            </>
          )}
        </button>
      </div>
    </div>
  );
}
