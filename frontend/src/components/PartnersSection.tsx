import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt2,
  HiOutlineHeart,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineSpeakerphone,
  HiOutlineCheck,
} from 'react-icons/hi';
import api from '../api/client';
import { PartnerCategory, PartnerPost } from '../types/api';

const PAGE_SIZE = 6;
const MESSAGE_MAX = 1000;
// Messages longer than this start collapsed with a "read more" toggle
const LONG_MESSAGE = 220;

const TICKER = [
  'ولي الأمر شريك النجاح',
  'معاً نصنع فرقاً وأثراً لا يُنسى',
  'كلمة شكر صغيرة تصنع يوماً جميلاً لمعلمة',
];

const emptyForm = {
  category: '',
  parent_name: '',
  student_name: '',
  message: '',
  website: '', // honeypot, hidden from real visitors
};

export default function PartnersSection() {
  const [posts, setPosts] = useState<PartnerPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api
      .get<{ items: PartnerPost[]; total: number }>('/partners/posts', {
        params: { limit: PAGE_SIZE, offset: 0 },
      })
      .then((res) => {
        setPosts(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));

    loadCategories();
  }, []);

  // The form is useless without its types, so a failed or empty answer is
  // retried a couple of times instead of leaving the list silently empty.
  const loadCategories = (attempt = 0) => {
    api
      .get<PartnerCategory[]>('/partners/categories')
      .then((res) => {
        if (res.data.length > 0) setCategories(res.data);
        else if (attempt < 2) setTimeout(() => loadCategories(attempt + 1), 1500 * (attempt + 1));
      })
      .catch(() => {
        if (attempt < 2) setTimeout(() => loadCategories(attempt + 1), 1500 * (attempt + 1));
      });
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get<{ items: PartnerPost[]; total: number }>(
        '/partners/posts',
        { params: { limit: PAGE_SIZE, offset: posts.length } },
      );
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.data.items.filter((p) => !seen.has(p.id))];
      });
      setTotal(res.data.total);
    } catch {
      toast.error('تعذر تحميل المزيد، حاول مرة أخرى');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      toast.error('يرجى اختيار نوع المشاركة');
      return;
    }
    setSending(true);
    try {
      await api.post('/partners/posts', form);
      setSent(true);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذر إرسال المشاركة، حاول مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  const remaining = Math.max(total - posts.length, 0);
  const inputClass =
    'w-full px-4 py-3 bg-ink-950/70 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-all';
  // القائمة المنسدلة تحتاج خلفية معتمة و color-scheme داكن: مع خلفية شفافة يرسم
  // Chrome/Edge على ويندوز الخيارات بيضاء على نص أبيض فتختفي
  const selectClass =
    'w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-xl text-white focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-all [color-scheme:dark]';

  return (
    <section id="partners" className="relative isolate py-20 sm:py-28 px-4 sm:px-6 scroll-mt-24 overflow-hidden">
      <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 h-[30rem] w-[min(60rem,140vw)] rounded-full bg-[radial-gradient(closest-side,rgb(227_184_95/0.08),transparent)]" />
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero */}
        <div className="text-center pb-2">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-400/25 bg-gold-400/5">
            <HiOutlineChatAlt2 className="h-7 w-7 text-gold-300" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/5 px-4 py-1.5 text-sm font-semibold text-gold-200 mb-4">
            <HiOutlineSparkles className="h-4 w-4" />
            شركاؤنا في النجاح
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
            معاً نُعلّم ونُلهم
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            ولي الأمر .. شريك النجاح وصانع الأثر
          </p>
        </div>

        {/* Ticker */}
        <div className="flex items-stretch overflow-hidden rounded-2xl border border-gold-400/15 bg-ink-900/80">
          <div className="flex-none flex items-center px-4 sm:px-5 bg-linear-to-b from-gold-400 to-gold-500">
            <HiOutlineSpeakerphone className="h-5 w-5 sm:h-6 sm:w-6 text-ink-950" />
          </div>
          <div className="relative flex-1 overflow-hidden py-3.5 sm:py-4 [mask-image:linear-gradient(to_left,transparent,#000_6%,#000_94%,transparent)]">
            <div className="partners-marquee flex w-max gap-10 text-slate-200 font-semibold whitespace-nowrap">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex gap-10" aria-hidden={copy === 1}>
                  {TICKER.map((line) => (
                    <span key={line} className="flex items-center gap-10">
                      {line}
                      <span className="text-gold-400">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="p-5 sm:p-8 rounded-3xl border border-white/8 bg-white/[0.02]">
          <div className="mb-6 sm:mb-8 border-r-2 border-gold-400 pr-4">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
              مشاركات أولياء الأمور
            </h3>
            <p className="text-slate-400 mt-1">
              كلمات وأنشطة شاركنا بها أولياء الأمور
            </p>
          </div>

          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-400 border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <HiOutlineHeart className="h-10 w-10 mx-auto mb-3 text-slate-600" />
              لا توجد مشاركات منشورة بعد — كونوا أول من يشارك 🌹
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {posts.map((post) => {
                  const long = post.message.length > LONG_MESSAGE;
                  const open = expanded[post.id];
                  return (
                    <article
                      key={post.id}
                      className="flex flex-col p-5 sm:p-6 rounded-2xl border border-white/8 bg-ink-900/80 transition-colors hover:border-gold-400/30">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-none h-10 w-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                          <HiOutlineHeart className="h-5 w-5 text-gold-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white leading-snug break-words">
                            ولي الأمر: {post.parent_name}
                          </p>
                          {post.student_name && (
                            <p className="text-sm text-slate-400 mt-0.5 break-words">
                              الطالبة: {post.student_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="self-start text-xs bg-white/5 border border-white/10 text-slate-300 rounded-full px-3 py-1 mb-4">
                        نوع المشاركة:{' '}
                        <span className="font-semibold text-gold-200">{post.category}</span>
                      </span>

                      <p
                        className={`text-slate-300 leading-loose whitespace-pre-line break-words ${
                          long && !open ? 'line-clamp-6' : ''
                        }`}>
                        {post.message}
                      </p>
                      {long && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [post.id]: !open }))
                          }
                          className="self-start mt-2 text-sm font-medium text-gold-300 hover:text-gold-200">
                          {open ? 'عرض أقل' : 'اقرأ المزيد'}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>

              {remaining > 0 && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold-400/40 text-white font-semibold transition-all disabled:opacity-60">
                    {loadingMore ? 'جاري التحميل...' : `عرض المزيد (${remaining})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Submission form */}
        <div className="p-5 sm:p-8 rounded-3xl border-gradient">
          <div className="mb-6 sm:mb-8 border-r-2 border-gold-400 pr-4">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              مشاركاتكم محل تقديرنا
            </h3>
            <p className="text-slate-400 mt-1">
              نسعد بسماع آرائكم ومشاركاتكم، وتُنشر بعد مراجعة إدارة المدرسة
            </p>
          </div>

          {sent ? (
            <div className="text-center py-10">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <HiOutlineCheck className="h-7 w-7 text-green-400" />
              </div>
              <p className="text-xl font-bold text-white mb-2">شكراً لك! 🌹</p>
              <p className="text-slate-400 mb-6">
                تم استلام مشاركتك، وستظهر هنا بعد مراجعة إدارة المدرسة.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-gold-300 hover:text-gold-200 font-semibold">
                إرسال مشاركة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    نوع المشاركة <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={selectClass}
                    onFocus={() => {
                      if (categories.length === 0) loadCategories();
                    }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required>
                    <option value="" disabled className="bg-ink-950 text-slate-400">
                      اختر نوع المشاركة
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-ink-950 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    اسم ولي الأمر <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="مثال: أم ندى"
                    value={form.parent_name}
                    maxLength={100}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  اسم الطالبة <span className="text-slate-500">(اختياري)</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="اسم الطالبة"
                  value={form.student_name}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  نص المشاركة <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`${inputClass} min-h-[140px] resize-y`}
                  placeholder="اكتب مشاركتك هنا..."
                  value={form.message}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1 text-left">
                  {form.message.length} / {MESSAGE_MAX}
                </p>
              </div>

              {/* Honeypot: invisible to people, filled in only by bots */}
              <div className="sr-only" aria-hidden="true">
                <label>
                  لا تملأ هذا الحقل
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-linear-to-l from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-700/30 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:shadow-blue-600/40 disabled:opacity-60 disabled:hover:translate-y-0">
                <HiOutlinePaperAirplane className="h-5 w-5 rotate-90" />
                {sending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
