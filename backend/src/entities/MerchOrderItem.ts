import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import MerchCustomizationOptions from './MerchCustomizationOptions';
import MerchOrder from './MerchOrder';

@Entity('merch_order_items')
export default class MerchOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  state: MerchItemState;

  @ManyToOne(() => MerchOrder, (order) => order.items)
  order: MerchOrder;

  @Column()
  internalVariant: MerchInternalVariant;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  customizationOptions: MerchCustomizationOptions | null;

  @Column({
    nullable: true,
  })
  lastEmailMessageId?: string;
}
