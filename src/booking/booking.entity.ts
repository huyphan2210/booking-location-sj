import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../location/location.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  locationId!: string;

  @ManyToOne(() => Location, { nullable: false })
  location!: Location;

  @Column({ nullable: true })
  department?: string;

  @Column()
  attendees!: number;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ default: 'pending' })
  status!: 'pending' | 'confirmed' | 'cancelled';

  @Column({ default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
