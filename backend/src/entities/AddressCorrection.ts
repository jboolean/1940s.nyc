import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('address_corrections')
export default class AddressCorrection {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @Index()
  photo: string;

  @Column({
    type: 'varchar',
  })
  address: string | null;

  @Column({
    type: 'integer',
    name: 'user_id',
  })
  userId: number;
}
