import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('site_visitors')
export class SiteVisitor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  visited_at: Date;
}
