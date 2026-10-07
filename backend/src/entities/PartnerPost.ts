import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PartnerPostStatus = 'pending' | 'approved';

// مشاركة من ولي أمر في قسم "شركاؤنا في النجاح".
// لا تظهر للزوار إلا بعد أن تعتمدها الإدارة (status = approved).
@Entity('partner_posts')
@Index('idx_partner_posts_status', ['status', 'approved_at'])
export class PartnerPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  parent_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  student_name: string | null;

  // Stored as text rather than a foreign key so deleting a category later
  // never breaks or hides posts that already used it
  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PartnerPostStatus;

  // 'public' = sent through the website form, 'admin' = added by the school
  @Column({ type: 'varchar', length: 20, default: 'public' })
  source: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
