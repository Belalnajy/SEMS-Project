import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Question } from './Question';
import { Student } from './Student';
import { ExamModel } from './ExamModel';

@Entity('question_reports')
export class QuestionReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ExamModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_model_id' })
  exam: ExamModel;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}

