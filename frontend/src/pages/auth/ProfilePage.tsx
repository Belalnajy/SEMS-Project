import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineIdentification,
} from 'react-icons/hi';
import { User } from '../../types/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [nationalId, setNationalId] = useState(user?.national_id || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return toast.error('كلمات المرور غير متطابقة');
    }

    setLoading(true);
    try {
      const res = await api.put<{ user: User }>('/auth/update-profile', {
        national_id: nationalId,
        password: password || undefined,
      });

      if (updateUser) updateUser(res.data.user);
      toast.success('تم تحديث البيانات بنجاح');

      // Update local user data if needed (optional since we usually refresh or re-login)
      // But we can update the context if we have a refreshUser method.
      // For now, let's just clear password fields
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
            <HiOutlineUser className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">إعدادات الحساب</h1>
            <p className="text-sm text-slate-400">
              تعديل بيانات الدخول الخاصة بك
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* National ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              رقم الهوية (اسم المستخدم)
            </label>
            <div className="relative">
              <HiOutlineIdentification className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="أدخل رقم الهوية الجديد"
                required
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              هذا هو الرقم الذي ستستخدمه في تسجيل الدخول مستقبلاً.
            </p>
          </div>

          <hr className="border-slate-700" />

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="اتركها فارغة إذا لم تكن تريد تغييرها"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="أعد كتابة كلمة المرور"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20">
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/20 p-4 rounded-lg">
        <p className="text-xs text-amber-500 leading-relaxed">
          <strong>تنبيه:</strong> في حال تغيير رقم الهوية أو كلمة المرور، يرجى
          تذكر البيانات الجديدة جيداً لأنك ستحتاج إليها في المرة القادمة التي
          تقوم فيها بتسجيل الدخول.
        </p>
      </div>
    </div>
  );
}
