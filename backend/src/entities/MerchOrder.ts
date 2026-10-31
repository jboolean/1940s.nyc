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
import MerchProvider from '../enum/MerchProvider';
import MerchOrderItem from './MerchOrderItem';
import ShippingAddress from './ShippingAddress';
import MerchShipment from './MerchShipment';
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
  provider: MerchProvider;

  @Column({ nullable: true })
  fulfillmentState?: MerchOrderFulfillmentState;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MerchOrderItem, (item) => item.order, { eager: true })
  items: MerchOrderItem[];

  @Column({ type: 'varchar', nullable: true })
  providerOrderId?: string;

  @Column({ unique: true })
  stripeCheckoutSessionId: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => MerchShipment, (shipment) => shipment.order)
  shipments: MerchShipment[];

  // Kept for providers that create their order only at submission.
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: ShippingAddress | null;

  // Provider-specific shipping service chosen at checkout (a Prodigi shippingMethod for Prodigi orders).
  @Column({ type: 'varchar', nullable: true })
  providerShippingMethod?: string | null;

  @Column({ nullable: true })
  trackingUrl?: string;
}
