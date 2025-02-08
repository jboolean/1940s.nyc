import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchOrderItem from './MerchOrderItem';

@Entity('merch_order_items')
export default class MerchOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MerchOrderItem, (item) => item.order)
  items: MerchOrderItem[];

  @Column()
  printfulOrderId: number;

  @Column()
  stripeInvoiceId: number;
}
