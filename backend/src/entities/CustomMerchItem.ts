import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

interface CustomizationOptions {
  lat: number;
  lon: number;
}

@Entity('custom_merch_items')
export default class CustomMerchItem {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  customizationOptions: CustomizationOptions | null;

  @Column()
  customizationOptionsSubmitted: boolean;

  @Column()
  printfileCreated: boolean;

  @Column()
  orderCreated: boolean;

  @Column({
    nullable: true,
  })
  lastEmailMessageId?: string;
}
