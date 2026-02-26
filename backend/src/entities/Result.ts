import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './Student';
import { ExamModel } from './ExamModel';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  total_questions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ default: false })
  is_guest: boolean;

  @Column({ nullable: true })
  guest_name: string;

  @Column({ type: 'timestamp' })
  started_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  completed_at: Date;

  @ManyToOne(() => Student, (student) => student.results, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => ExamModel, (exam) => exam.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_model_id' })
  exam_model: ExamModel;
}
