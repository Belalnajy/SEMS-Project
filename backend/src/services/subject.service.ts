import { AppDataSource } from '../config/data-source';
import { Subject } from '../entities/Subject';
import { ApiError } from '../middleware/errorHandler';

export class SubjectService {
  private subjectRepository = AppDataSource.getRepository(Subject);

  async getAll() {
    return await this.subjectRepository.find({
      order: { id: 'ASC' },
    });
  }

  async getById(id: number) {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) throw new ApiError(404, 'المادة غير موجودة.');
    return subject;
  }

  async create(data: Partial<Subject>) {
    const subject = this.subjectRepository.create(data);
    return await this.subjectRepository.save(subject);
  }

  async update(id: number, data: Partial<Subject>) {
    const subject = await this.getById(id);
    Object.assign(subject, data);
    return await this.subjectRepository.save(subject);
  }

  async delete(id: number) {
    const subject = await this.getById(id);
    return await this.subjectRepository.remove(subject);
  }
}
