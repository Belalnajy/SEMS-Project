import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// أنواع المشاركة اللي بتظهر في القائمة المنسدلة بالفورم، وتتعدل من لوحة التحكم
@Entity('partner_categories')
export class PartnerCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;
}
