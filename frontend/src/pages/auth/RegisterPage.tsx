import { useState, ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function RegisterPage(): ReactElement {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_name: 'student' as 'student' | 'supervisor' | 'manager',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      const routes: Record<string, string> = {
        supervisor: '/supervisor',
        manager: '/manager',
        student: '/student',
      };
      navigate(routes[user.role.name] || '/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <motion.div
        className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">📝 إنشاء حساب</h1>
          <p className="text-slate-400">سجّل حسابك الجديد</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الاسم الكامل
            </label>
            <input
              type="text"
              name="full_name"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="أدخل اسمك الكامل"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              اسم المستخدم
            </label>
            <input
              type="text"
              name="username"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="أدخل اسم المستخدم"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="أدخل بريدك الإلكتروني"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="أدخل كلمة المرور"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors mt-4">
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center text-sm text-slate-400">
          لديك حساب؟{' '}
          <Link
            to="/login"
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            سجّل دخولك
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
