import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from './Subject';
import { Question } from './Question';
import { Result } from './Result';
import { Section } from './Section';

@Entity('exam_models')
export class ExamModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', default: 30 })
  duration_minutes: number;

  @Column({ default: false })
  allow_reattempt: boolean;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => Subject, (subject) => subject.exams, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // Sections allowed to take this exam. Empty means every section is allowed,
  // which keeps exams created before this feature open to everyone.
  @ManyToMany(() => Section)
  @JoinTable({
    name: 'exam_model_sections',
    joinColumn: { name: 'exam_model_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'section_id', referencedColumnName: 'id' },
  })
  sections: Section[];

  @OneToMany(() => Question, (question) => question.exam, { cascade: true })
  questions: Question[];

  @OneToMany(() => Result, (result) => result.exam_model)
  results: Result[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
