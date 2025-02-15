import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchOrderFulfillmentState from '../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../enum/MerchOrderState';
import MerchOrderItem from './MerchOrderItem';
import User from './User';

@Entity('merch_orders')
export default class MerchOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  state: MerchOrderState;

  @Column()
  fulfillmentState: MerchOrderFulfillmentState | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MerchOrderItem, (item) => item.order, { eager: true })
  items: MerchOrderItem[];

  @Column()
  printfulOrderId?: number;

  @Column({ unique: true })
  stripeCheckoutSessionId: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  user: User;
}
