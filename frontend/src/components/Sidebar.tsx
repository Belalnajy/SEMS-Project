import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineClipboardList,
  HiOutlineBookOpen,
} from 'react-icons/hi';

const menuItems = {
  supervisor: [
    { path: '/supervisor', label: 'الرئيسية', icon: HiOutlineHome },
    { path: '/supervisor/students', label: 'الطلاب', icon: HiOutlineUsers },
    {
      path: '/supervisor/sections',
      label: 'الفصول',
      icon: HiOutlineClipboardList,
    },
    {
      path: '/supervisor/subjects',
      label: 'المواد الدراسية',
      icon: HiOutlineBookOpen,
    },
    {
      path: '/supervisor/exams',
      label: 'الامتحانات',
      icon: HiOutlineAcademicCap,
    },
    { path: '/supervisor/reports', label: 'التقارير', icon: HiOutlineChartBar },
  ],
  manager: [
    { path: '/manager', label: 'الرئيسية', icon: HiOutlineHome },
    { path: '/manager/reports', label: 'التقارير', icon: HiOutlineChartBar },
  ],
  student: [
    { path: '/student', label: 'الرئيسية', icon: HiOutlineHome },
    { path: '/student/exams', label: 'الامتحانات', icon: HiOutlineAcademicCap },
    { path: '/student/results', label: 'نتائجي', icon: HiOutlineDocumentText },
  ],
  guest: [],
};

const roleLabels: Record<string, string> = {
  supervisor: 'المشرف',
  manager: 'المدير',
  student: 'طالب',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const roleName = user.role.name;
  const items = menuItems[roleName] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-800 border-l border-slate-700 h-screen flex flex-col fixed inset-y-0 right-0 z-50 transition-transform lg:translate-x-0 shadow-lg shrink-0 print:hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-10 h-10 rounded-lg shadow-blue-500/20 shadow-lg"
          />
          <h2 className="text-lg font-bold text-white">منصة التحصيلي</h2>
        </div>
        <p className="text-sm px-2 text-slate-400">
          {roleLabels[roleName] || roleName} —{' '}
          {user.student?.full_name || user.username}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${roleName}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`
            }>
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10">
          <HiOutlineLogout className="h-5 w-5" />
          تسجيل الخروج
        </button>
        <div className="mt-4 px-3 py-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-3">
          <p className="font-medium text-slate-400">
            {' '}
            الثانوية الحادية والعشرون
          </p>
          <p>إعداد أ. ابتسام السلمي</p>
        </div>
      </div>
    </aside>
  );
}
