import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import { Subject } from '../../types/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await api.get<Subject[]>('/subjects');
      setSubjects(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/subjects/${editItem.id}`, form);
        toast.success('تم تحديث المادة بنجاح');
      } else {
        await api.post('/subjects', form);
        toast.success('تم إضافة المادة بنجاح');
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ name: '', description: '' });
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const confirmDelete = async () => {
    if (!showConfirmDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/subjects/${showConfirmDelete}`);
      toast.success('تم الحذف بنجاح');
      fetchSubjects();
      setShowConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            المواد الدراسية
          </h1>
          <p className="text-sm text-slate-400">
            إدارة المواد الدراسية في النظام
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => {
            setEditItem(null);
            setForm({ name: '', description: '' });
            setShowModal(true);
          }}>
          <HiOutlinePlus className="h-5 w-5" /> إضافة مادة
        </button>
      </div>

      <ConfirmModal
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={confirmDelete}
        title="حذف مادة"
        message="هل أنت متأكد من حذف هذه المادة؟ سيؤدي ذلك لحذف جميع الاختبارات والأسئلة المرتبطة بها."
        isDanger={true}
        loading={isDeleting}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((s) => (
          <div
            key={s.id}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <HiOutlineBookOpen className="text-blue-500 h-5 w-5" />
              {s.name}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {s.description || 'بدون وصف'}
            </p>
            <div className="flex gap-3">
              <button
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  setEditItem(s);
                  setForm({ name: s.name, description: s.description || '' });
                  setShowModal(true);
                }}>
                <HiOutlinePencil className="h-4 w-4" /> تعديل
              </button>
              <button
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowConfirmDelete(s.id)}>
                <HiOutlineTrash className="h-4 w-4" /> حذف
              </button>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-full bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 border-dashed text-center text-slate-400">
            لا توجد مواد دراسية حتى الآن.
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'تعديل المادة' : 'إضافة مادة جديدة'}
        maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              اسم المادة
            </label>
            <input
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الوصف
            </label>
            <input
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              {editItem ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
