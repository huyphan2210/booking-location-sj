import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { type IOpenTime } from './dto/open-time.dto';

@Entity()
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  locationNumber!: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true, type: 'int' })
  capacity?: number;

  @Column({ type: 'jsonb', nullable: true })
  openTime?: IOpenTime;

  @Column({ default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Location, (location) => location.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parent?: Location;

  @OneToMany(() => Location, (location) => location.parent)
  children?: Location[];
}
