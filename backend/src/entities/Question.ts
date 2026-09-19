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
import { ExamModel } from './ExamModel';
import { Answer } from './Answer';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question_text: string;

  // Optional question image: external URL or base64 data URI.
  // select: false keeps the (potentially large) image out of every exam query;
  // it is served on demand by the question-image endpoint instead.
  @Column({ type: 'text', nullable: true, select: false })
  image_url: string | null;

  // Set by the service from a lightweight lookup — not a database column
  has_image?: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @ManyToOne(() => ExamModel, (exam) => exam.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_model_id' })
  exam: ExamModel;

  @OneToMany(() => Answer, (answer) => answer.question, { cascade: true })
  answers: Answer[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
