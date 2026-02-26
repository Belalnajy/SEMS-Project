import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from './Subject';
import { Question } from './Question';
import { Result } from './Result';

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

  @OneToMany(() => Question, (question) => question.exam, { cascade: true })
  questions: Question[];

  @OneToMany(() => Result, (result) => result.exam_model)
  results: Result[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
