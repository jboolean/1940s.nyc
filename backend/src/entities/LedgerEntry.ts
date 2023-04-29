import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import LedgerEntryType from '../enum/LedgerEntryType';

/**
 * An entry in the usage ledger to support
 * limiting by frequency or by total usage
 */
interface LedgerEntryMetadata {
  photoIdentifier: string;
}

@Entity('ledger')
export default class LedgerEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'integer',
    name: 'user_id',
  })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column('integer')
  amount: number;

  @Column()
  type: LedgerEntryType;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: LedgerEntryMetadata;
}
