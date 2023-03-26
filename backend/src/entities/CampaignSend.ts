import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import CampaignSendStatus from '../enum/CampaignSendStatus';

@Entity('campaign_sends')
export default class CampaignSend {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  address!: string;

  @Column()
  livemode!: boolean;

  @Column()
  template!: string;

  @Column({
    type: 'timestamp',
  })
  sendOn!: Date;

  @Column({ type: 'varchar' })
  status!: CampaignSendStatus;

  @Column({
    type: 'jsonb',
  })
  result?: object;
}
