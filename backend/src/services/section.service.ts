import { AppDataSource } from '../config/data-source';
import { Section } from '../entities/Section';
import { ApiError } from '../middleware/errorHandler';

export class SectionService {
  private sectionRepository = AppDataSource.getRepository(Section);

  async getAll() {
    return await this.sectionRepository.find({
      order: { id: 'DESC' },
    });
  }

  async getById(id: number) {
    const section = await this.sectionRepository.findOneBy({ id });
    if (!section) throw new ApiError(404, 'الشعبة غير موجودة.');
    return section;
  }

  async create(data: any) {
    const { name, description } = data;
    if (!name) throw new ApiError(400, 'اسم الشعبة مطلوب.');

    const section = new Section();
    section.name = name;

    return await this.sectionRepository.save(section);
  }

  async update(id: number, data: any) {
    const section = await this.getById(id);
    const { name } = data;

    if (name) section.name = name;

    return await this.sectionRepository.save(section);
  }

  async delete(id: number) {
    const section = await this.getById(id);
    return await this.sectionRepository.remove(section);
  }
}
