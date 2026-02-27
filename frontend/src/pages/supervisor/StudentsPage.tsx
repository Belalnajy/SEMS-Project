import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineUpload,
  HiOutlineSearch,
} from 'react-icons/hi';
import { StudentProfile, Section } from '../../types/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

interface PaginatedStudents {
  students: StudentProfile[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [pagination, setPagination] = useState({ pages: 1, page: 1 });
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Form State
  const [editStudent, setEditStudent] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    student_number: '',
    national_id: '',
    password: 'student123',
    section_id: '',
  });

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSection, setImportSection] = useState('');

  // Feedback Status
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async (page = 1) => {
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (sectionFilter) params.section_id = sectionFilter;
      const res = await api.get<PaginatedStudents>('/students', { params });
      setStudents(res.data.students);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('فشل في تحميل الطلاب.');
    }
  };

  const fetchSections = async () => {
    try {
      const res = await api.get<Section[]>('/sections');
      setSections(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchStudents();
    fetchSections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent.id}`, form);
        toast.success('تم تحديث بيانات الطالب بنجاح');
      } else {
        await api.post('/students', form);
        toast.success('تم إضافة الطالب بنجاح');
      }
      setShowModal(false);
      setEditStudent(null);
      setForm({
        full_name: '',
        student_number: '',
        national_id: '',
        password: 'student123',
        section_id: '',
      });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const confirmDelete = async () => {
    if (!showConfirmDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/students/${showConfirmDelete}`);
      toast.success('تم حذف الطالب بنجاح');
      fetchStudents();
      setShowConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (student: StudentProfile) => {
    setEditStudent(student);
    setForm({
      full_name: student.full_name,
      student_number: student.student_number,
      national_id: (student as any).user?.national_id || '',
      password: '',
      section_id: student.section?.id?.toString() || '',
    });
    setShowModal(true);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    if (importSection) formData.append('section_id', importSection);
    try {
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(
        `تم استيراد ${res.data.success} طالب بنجاح. ${res.data.errors?.length ? `أخطاء: ${res.data.errors.length}` : ''}`,
      );
      setShowImport(false);
      setImportFile(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل في استيراد الملف');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة الطلاب</h1>
          <p className="text-sm text-slate-400">إضافة وتعديل وحذف الطلاب</p>
        </div>
        <div className="flex flex-wrap w-full md:w-auto gap-3">
          <button
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            onClick={() => setShowImport(true)}>
            <HiOutlineUpload className="h-5 w-5" /> استيراد Excel
          </button>
          <button
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            onClick={() => {
              setEditStudent(null);
              setForm({
                full_name: '',
                student_number: '',
                national_id: '',
                password: 'student123',
                section_id: '',
              });
              setShowModal(true);
            }}>
            <HiOutlinePlus className="h-5 w-5" /> إضافة طالب
          </button>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={confirmDelete}
        title="حذف طالب"
        message="هل أنت متأكد من حذف هذا الطالب؟ سيؤدي ذلك لحذف جميع بياناته ونتائجه."
        isDanger={true}
        loading={isDeleting}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="بحث بالاسم أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
          />
        </div>
        <select
          className="w-full sm:w-48 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={sectionFilter}
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setTimeout(() => fetchStudents(), 100);
          }}>
          <option value="">كل الفصول</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
          onClick={() => fetchStudents()}>
          بحث
        </button>
      </div>

      {/* Students list */}
      {students.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400 shadow-sm">
          لا يوجد طلاب
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {students.map((s, i) => (
              <div
                key={s.id}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    #{(pagination.page - 1) * 20 + i + 1}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {s.student_number}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{s.full_name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    الرقم القومي: {(s as any).user?.national_id || '-'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    الفصل: {s.section?.name || '-'}
                  </p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    className="flex-1 py-2 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    title="تعديل"
                    onClick={() => handleEdit(s)}>
                    <HiOutlinePencil className="h-4 w-4" /> تعديل
                  </button>
                  <button
                    className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    title="حذف"
                    onClick={() => setShowConfirmDelete(s.id)}>
                    <HiOutlineTrash className="h-4 w-4" /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-slate-300 min-w-[800px]">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">#</th>
                    <th className="px-6 py-4 font-medium text-right">الاسم الكامل</th>
                    <th className="px-6 py-4 font-medium text-right">رقم الطالب</th>
                    <th className="px-6 py-4 font-medium text-right">الرقم القومي</th>
                    <th className="px-6 py-4 font-medium text-right">الفصل</th>
                    <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {students.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{(pagination.page - 1) * 20 + i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{s.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {s.student_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{(s as any).user?.national_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{s.section?.name || <span className="text-slate-500">-</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all"
                            title="تعديل"
                            onClick={() => handleEdit(s)}>
                            <HiOutlinePencil className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                            title="حذف"
                            onClick={() => setShowConfirmDelete(s.id)}>
                            <HiOutlineTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                pagination.page === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
              onClick={() => fetchStudents(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
        maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الاسم الكامل
            </label>
            <input
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              رقم الطالب
            </label>
            <input
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={form.student_number}
              onChange={(e) =>
                setForm({ ...form, student_number: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الرقم القومي
            </label>
            <input
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={form.national_id}
              onChange={(e) =>
                setForm({ ...form, national_id: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              كلمة المرور{' '}
              {editStudent && '(اتركها فارغة إذا لم تكن تريد التغيير)'}
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
              placeholder={editStudent ? '••••••••' : 'أدخل كلمة المرور'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editStudent}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الفصل
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={form.section_id}
              onChange={(e) =>
                setForm({ ...form, section_id: e.target.value })
              }>
              <option value="">بدون فصل</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              {editStudent ? 'تعديل البيانات' : 'إضافة الطالب'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="استيراد طلاب من Excel"
        maxWidth="max-w-md">
        <form onSubmit={handleImport} className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50 text-blue-400 text-xs leading-relaxed">
            يجب أن يحتوي ملف Excel على الأعمدة التالية في الصف الأول:
            <br />
            <div className="mt-2 flex flex-wrap gap-2">
              <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-blue-500/20">
                رقم الطالبة
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-blue-500/20">
                اسم الطالبة
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-blue-500/20">
                الفصل
              </code>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              * سيتم إنشاء "الفصل" تلقائياً إذا لم يكن موجوداً.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              اختر ملف Excel (.xlsx)
            </label>
            <input
              type="file"
              className="w-full px-4 py-2 border border-slate-700 border-dashed rounded-lg bg-slate-900/50 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20"
              accept=".xlsx,.xls"
              onChange={(e) =>
                setImportFile(e.target.files ? e.target.files[0] : null)
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              تعيين الشعبة{' '}
              <span className="text-slate-500 font-normal">
                (يطبق على جميع الطلاب في الملف)
              </span>
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={importSection}
              onChange={(e) => setImportSection(e.target.value)}>
              <option value="">بدون فصل (أو كما هو محدد في الملف)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              <HiOutlineUpload className="h-5 w-5" /> استيراد الطلاب
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
