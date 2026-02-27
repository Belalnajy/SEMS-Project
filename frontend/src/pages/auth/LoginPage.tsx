import { useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(nationalId, password);
      const routes: Record<string, string> = {
        supervisor: '/supervisor',
        manager: '/manager',
        student: '/student'
      };
      navigate(routes[user.role.name] || '/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        className="w-full max-w-[440px] bg-slate-800/50 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-slate-700/50 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}>
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-24 h-24 rounded-2xl shadow-2xl relative z-10 border border-white/10"
                />
              </Link>
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold font-arabic text-white mb-3 tracking-tight">
            منصة التحصيلي
          </h1>
          <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full mb-4" />
          <p className="text-blue-400 font-semibold text-sm">
            الثانوية الحادية والعشرون
          </p>
          <p className="text-slate-400 text-xs mt-1">إشراف أ. ابتسام السلمي</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              رقم الهوية
            </label>
            <input
              type="text"
              dir="rtl"
              className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              placeholder="أدخل الرقم هنا..."
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              كلمة المرور
            </label>
            <input
              type="password"
              dir="rtl"
              className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التحقق...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to="/guest"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 group">
            <HiOutlineSparkles className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 text-blue-400" />
            الدخول كضيف للمنصة
            <HiOutlineSparkles className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 text-blue-400" />
          </Link>

          <div className="w-12 h-px bg-slate-700/50" />

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} <br />
            منصة التحصيلي - الثانوية الحادية والعشرون
          </p>
        </div>
      </motion.div>
    </div>
  );
}
