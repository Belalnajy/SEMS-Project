import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineEyeOff,
  HiOutlineInbox,
  HiOutlineTag,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../../api/client';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { PartnerCategory, PartnerPost } from '../../types/api';

type Tab = 'pending' | 'approved';

const MESSAGE_MAX = 1000;

const emptyForm = {
  category: '',
  parent_name: '',
  student_name: '',
  message: '',
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('ar-u-ca-gregory', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

export default function PartnersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [posts, setPosts] = useState<PartnerPost[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<PartnerPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<
    { type: 'post'; post: PartnerPost } | { type: 'category'; category: PartnerCategory } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async (which: Tab = tab) => {
    setLoading(true);
    try {
      const res = await api.get<{
        items: PartnerPost[];
        counts: { pending: number; approved: number };
      }>('/partners/admin/posts', { params: { status: which } });
      setPosts(res.data.items);
      setCounts(res.data.counts);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذر تحميل المشاركات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<PartnerCategory[]>('/partners/categories');
      setCategories(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchPosts(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const runAction = async (
    post: PartnerPost,
    action: 'approve' | 'unpublish',
    successMessage: string,
  ) => {
    setBusyId(post.id);
    try {
      await api.patch(`/partners/admin/posts/${post.id}/${action}`);
      toast.success(successMessage);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setBusyId(null);
    }
  };

  const openAdd = () => {
    setEditPost(null);
    setForm({ ...emptyForm, category: categories[0]?.name || '' });
    setShowModal(true);
  };

  const openEdit = (post: PartnerPost) => {
    setEditPost(post);
    setForm({
      category: post.category,
      parent_name: post.parent_name,
      student_name: post.student_name || '',
      message: post.message,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editPost) {
        await api.put(`/partners/admin/posts/${editPost.id}`, form);
        toast.success('تم حفظ التعديل');
      } else {
        await api.post('/partners/admin/posts', form);
        toast.success('تمت إضافة المشاركة ونشرها');
        if (tab !== 'approved') setTab('approved');
      }
      setShowModal(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === 'post') {
        await api.delete(`/partners/admin/posts/${confirm.post.id}`);
        toast.success('تم حذف المشاركة');
        fetchPosts();
      } else {
        await api.delete(`/partners/admin/categories/${confirm.category.id}`);
        toast.success('تم حذف النوع');
        fetchCategories();
      }
      setConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/partners/admin/categories', { name: newCategory });
      toast.success('تمت إضافة النوع');
      setNewCategory('');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">شركاؤنا في النجاح</h1>
          <p className="text-sm text-slate-400">
            راجعي مشاركات أولياء الأمور — لا يظهر للزوار إلا ما تنشرينه
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={categories.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
          <HiOutlinePlus className="h-5 w-5" /> إضافة مشاركة
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full sm:w-fit">
        {(
          [
            { key: 'pending', label: 'بانتظار المراجعة', count: counts.pending },
            { key: 'approved', label: 'المنشورة', count: counts.approved },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {t.label}
            <span
              className={`min-w-6 px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.key
                  ? 'bg-white/20'
                  : t.key === 'pending' && t.count > 0
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700'
              }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 border-dashed text-center text-slate-400">
          <HiOutlineInbox className="h-10 w-10 mx-auto mb-3 text-slate-500" />
          {tab === 'pending'
            ? 'لا توجد مشاركات جديدة بانتظار المراجعة'
            : 'لا توجد مشاركات منشورة بعد'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-white break-words">
                    ولي الأمر: {post.parent_name}
                  </p>
                  {post.student_name && (
                    <p className="text-sm text-slate-400 break-words">
                      الطالبة: {post.student_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2.5 py-1">
                    {post.category}
                  </span>
                  {post.source === 'admin' && (
                    <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2.5 py-1">
                      أضافتها الإدارة
                    </span>
                  )}
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed whitespace-pre-line break-words flex-1">
                {post.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-700">
                <span className="text-xs text-slate-500">
                  {tab === 'approved'
                    ? `نُشرت ${formatDate(post.approved_at)}`
                    : `وصلت ${formatDate(post.created_at)}`}
                </span>
                <div className="flex gap-2">
                  {tab === 'pending' ? (
                    <button
                      onClick={() => runAction(post, 'approve', 'تم نشر المشاركة')}
                      disabled={busyId === post.id}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                      <HiOutlineCheck className="h-4 w-4" /> نشر
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        runAction(post, 'unpublish', 'تم إخفاء المشاركة وإرجاعها للمراجعة')
                      }
                      disabled={busyId === post.id}
                      className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                      <HiOutlineEyeOff className="h-4 w-4" /> إخفاء
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(post)}
                    title="تعديل"
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
                    <HiOutlinePencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirm({ type: 'post', post })}
                    title="حذف"
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-1">
          <HiOutlineTag className="h-5 w-5 text-blue-400" />
          أنواع المشاركة
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          الأنواع اللي يختار منها ولي الأمر في الفورم. حذف نوع لا يحذف المشاركات المنشورة به.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-full pr-3 pl-1.5 py-1 text-sm">
              {c.name}
              <button
                onClick={() => setConfirm({ type: 'category', category: c })}
                disabled={categories.length <= 1}
                title={categories.length <= 1 ? 'لازم يفضل نوع واحد على الأقل' : 'حذف'}
                className="p-0.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent">
                <HiOutlineX className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
          <input
            className={inputClass}
            placeholder="نوع جديد، مثال: تطوعي"
            value={newCategory}
            maxLength={50}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            type="submit"
            className="flex-none flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg text-sm font-medium transition-colors">
            <HiOutlinePlus className="h-4 w-4" /> إضافة
          </button>
        </form>
      </div>

      {/* Add / edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editPost ? 'تعديل المشاركة' : 'إضافة مشاركة'}
        maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          {!editPost && (
            <p className="text-xs text-slate-400 bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              المشاركة اللي تضيفيها بنفسك تُنشر مباشرة.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">نوع المشاركة</label>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required>
              <option value="" disabled>
                اختر النوع
              </option>
              {/* Keeps a post editable even if its category was deleted later */}
              {form.category && !categories.some((c) => c.name === form.category) && (
                <option value={form.category} disabled>
                  {form.category} (محذوف)
                </option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اسم ولي الأمر</label>
            <input
              className={inputClass}
              value={form.parent_name}
              maxLength={100}
              onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              اسم الطالبة <span className="text-slate-500">(اختياري)</span>
            </label>
            <input
              className={inputClass}
              value={form.student_name}
              maxLength={100}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">نص المشاركة</label>
            <textarea
              className={`${inputClass} min-h-[140px] resize-y`}
              value={form.message}
              maxLength={MESSAGE_MAX}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1 text-left">
              {form.message.length} / {MESSAGE_MAX}
            </p>
          </div>
          <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 pt-4 pb-6 bg-slate-800 border-t border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : editPost ? 'حفظ التعديل' : 'إضافة ونشر'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message={
          confirm?.type === 'category'
            ? `حذف نوع "${confirm.category.name}"؟ المشاركات المنشورة بهذا النوع ستبقى كما هي.`
            : 'حذف هذه المشاركة نهائياً؟'
        }
        isDanger
        loading={deleting}
      />
    </div>
  );
}
