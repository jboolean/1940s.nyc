import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('mailing_list_members')
export default class MailingListMember {
  @PrimaryColumn()
  address!: string;

  @Column({
    type: 'varchar',
  })
  source!: string | null;
}
