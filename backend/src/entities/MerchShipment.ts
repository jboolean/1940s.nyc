import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MerchOrder from './MerchOrder';

@Entity('merch_shipments')
@Index(['orderId', 'providerShipmentId'], { unique: true })
export default class MerchShipment {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  orderId: number;

  @ManyToOne(() => MerchOrder, (order) => order.shipments)
  order: MerchOrder;

  @Column()
  providerShipmentId: string;

  @Column({ type: 'varchar', nullable: true })
  trackingUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  carrier: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailedAt: Date | null;
}
