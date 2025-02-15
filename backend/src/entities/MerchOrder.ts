import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchOrderState from '../enum/MerchOrderState';
import MerchOrderItem from './MerchOrderItem';

@Entity('merch_orders')
export default class MerchOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  state: MerchOrderState;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MerchOrderItem, (item) => item.order)
  items: MerchOrderItem[];

  @Column()
  printfulOrderId?: number;

  @Column({ unique: true })
  stripeCheckoutSessionId: string;
}
