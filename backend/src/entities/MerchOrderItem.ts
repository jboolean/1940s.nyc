import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchOrder from './MerchOrder';

interface CustomizationOptions {
  lat: number;
  lon: number;
}

@Entity('merch_order_items')
export default class MerchOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => MerchOrder, (order) => order.items)
  order: MerchOrder;

  @Column()
  internalVariant: MerchInternalVariant;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  customizationOptions: CustomizationOptions | null;

  @Column()
  customizationOptionsSubmitted: boolean;

  @Column()
  printfileCreated: boolean;

  @Column({
    nullable: true,
  })
  lastEmailMessageId?: string;
}
