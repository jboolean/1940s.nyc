import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Represents an end-user on the site
// Only used for usage tracking for colorization, not for stories
@Entity('users')
export default class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'text',
    name: 'ip_address',
  })
  ipAddress: string;

  @Column({
    type: String,
    nullable: true,
    name: 'email',
  })
  email!: string | null;

  @Column({
    type: String,
    nullable: true,
    name: 'stripe_customer',
  })
  stripeCustomerId!: string | null;

  get isAnonymous(): boolean {
    return !this.email;
  }

  @Column()
  isEmailVerified: boolean;

  @Column()
  isBanned: boolean;
}
