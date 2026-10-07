import { AppDataSource } from '../config/data-source';
import { PartnerPost, PartnerPostStatus } from '../entities/PartnerPost';
import { PartnerCategory } from '../entities/PartnerCategory';
import { ApiError } from '../middleware/errorHandler';

const LIMITS = {
  name: { min: 2, max: 100 },
  message: { min: 5, max: 1000 },
  category: { min: 2, max: 50 },
};

// The public form is open to the whole internet, so links are refused outright:
// a parent sharing a thank-you note never needs one, and spam always has one.
const LINK_PATTERN =
  /(https?:\/\/|www\.|t\.me\/|wa\.me\/|bit\.ly|\.(com|net|org|info|xyz|shop|link|io)\b)/i;

// Caps the review queue so a flood of submissions cannot grow the database
// (which is billed by storage) while nobody is around to moderate it.
const MAX_PENDING = 300;

const PUBLIC_PAGE_MAX = 30;

type PostInput = {
  parent_name?: unknown;
  student_name?: unknown;
  category?: unknown;
  message?: unknown;
};

const clean = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

// Keeps the parent's own line breaks while collapsing runs of blank lines
const cleanMessage = (value: unknown) =>
  typeof value === 'string'
    ? value
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

export class PartnerService {
  private postRepository = AppDataSource.getRepository(PartnerPost);
  private categoryRepository = AppDataSource.getRepository(PartnerCategory);

  // ---------- Categories ----------

  async getCategories() {
    return this.categoryRepository.find({
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  async addCategory(rawName: unknown) {
    const name = clean(rawName);
    if (name.length < LIMITS.category.min || name.length > LIMITS.category.max) {
      throw new ApiError(400, 'اسم النوع يجب أن يكون بين 2 و 50 حرفاً.');
    }

    const exists = await this.categoryRepository.findOne({ where: { name } });
    if (exists) throw new ApiError(409, 'هذا النوع موجود بالفعل.');

    const last = await this.categoryRepository.find({
      order: { sort_order: 'DESC' },
      take: 1,
    });
    const category = this.categoryRepository.create({
      name,
      sort_order: (last[0]?.sort_order ?? 0) + 1,
    });
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new ApiError(404, 'النوع غير موجود.');

    const count = await this.categoryRepository.count();
    if (count <= 1) {
      throw new ApiError(400, 'يجب أن يبقى نوع واحد على الأقل.');
    }

    await this.categoryRepository.remove(category);
    return { success: true };
  }

  // ---------- Validation ----------

  private async validate(input: PostInput, { fromPublic }: { fromPublic: boolean }) {
    const parent_name = clean(input.parent_name);
    const student_name = clean(input.student_name);
    const category = clean(input.category);
    const message = cleanMessage(input.message);

    if (
      parent_name.length < LIMITS.name.min ||
      parent_name.length > LIMITS.name.max
    ) {
      throw new ApiError(400, 'يرجى كتابة اسم ولي الأمر بشكل صحيح.');
    }
    if (student_name.length > LIMITS.name.max) {
      throw new ApiError(400, 'اسم الطالبة طويل جداً.');
    }
    if (
      message.length < LIMITS.message.min ||
      message.length > LIMITS.message.max
    ) {
      throw new ApiError(
        400,
        `نص المشاركة يجب أن يكون بين ${LIMITS.message.min} و ${LIMITS.message.max} حرف.`,
      );
    }

    const categories = await this.getCategories();
    if (!categories.some((c) => c.name === category)) {
      throw new ApiError(400, 'يرجى اختيار نوع المشاركة من القائمة.');
    }

    if (fromPublic && LINK_PATTERN.test(`${parent_name} ${student_name} ${message}`)) {
      throw new ApiError(400, 'لا يُسمح بإضافة روابط في المشاركة.');
    }

    return {
      parent_name,
      student_name: student_name || null,
      category,
      message,
    };
  }

  // ---------- Public ----------

  async getApproved(limitRaw: unknown, offsetRaw: unknown) {
    const limit = Math.min(
      Math.max(parseInt(String(limitRaw ?? ''), 10) || 6, 1),
      PUBLIC_PAGE_MAX,
    );
    const offset = Math.max(parseInt(String(offsetRaw ?? ''), 10) || 0, 0);

    const [items, total] = await this.postRepository.findAndCount({
      where: { status: 'approved' },
      select: {
        id: true,
        parent_name: true,
        student_name: true,
        category: true,
        message: true,
        approved_at: true,
      },
      order: { approved_at: 'DESC', id: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  async submitPublic(input: PostInput & { website?: unknown }) {
    // Honeypot: a field hidden from people that only bots fill in. Pretend it
    // worked so the bot has no signal to adapt to, but store nothing.
    if (clean(input.website)) return { success: true };

    const data = await this.validate(input, { fromPublic: true });

    const pending = await this.postRepository.count({
      where: { status: 'pending' },
    });
    if (pending >= MAX_PENDING) {
      throw new ApiError(
        429,
        'نستقبل حالياً عدداً كبيراً من المشاركات. يرجى المحاولة لاحقاً.',
      );
    }

    const duplicate = await this.postRepository.findOne({
      where: { message: data.message, parent_name: data.parent_name },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(409, 'تم استلام هذه المشاركة من قبل، شكراً لك.');
    }

    await this.postRepository.save(
      this.postRepository.create({ ...data, status: 'pending', source: 'public' }),
    );
    return { success: true };
  }

  // ---------- Admin ----------

  async getAllForAdmin(statusRaw: unknown) {
    const status: PartnerPostStatus =
      statusRaw === 'approved' ? 'approved' : 'pending';

    const [items, pending, approved] = await Promise.all([
      this.postRepository.find({
        where: { status },
        order:
          status === 'approved'
            ? { approved_at: 'DESC', id: 'DESC' }
            : { created_at: 'DESC', id: 'DESC' },
        take: 500,
      }),
      this.postRepository.count({ where: { status: 'pending' } }),
      this.postRepository.count({ where: { status: 'approved' } }),
    ]);

    return { items, counts: { pending, approved } };
  }

  async createByAdmin(input: PostInput) {
    const data = await this.validate(input, { fromPublic: false });
    return this.postRepository.save(
      this.postRepository.create({
        ...data,
        status: 'approved',
        source: 'admin',
        approved_at: new Date(),
      }),
    );
  }

  private async findOrFail(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new ApiError(404, 'المشاركة غير موجودة.');
    return post;
  }

  async update(id: number, input: PostInput) {
    const post = await this.findOrFail(id);
    const data = await this.validate(input, { fromPublic: false });
    Object.assign(post, data);
    return this.postRepository.save(post);
  }

  async setStatus(id: number, status: PartnerPostStatus) {
    const post = await this.findOrFail(id);
    post.status = status;
    post.approved_at = status === 'approved' ? new Date() : null;
    return this.postRepository.save(post);
  }

  async remove(id: number) {
    const post = await this.findOrFail(id);
    await this.postRepository.remove(post);
    return { success: true };
  }
}
