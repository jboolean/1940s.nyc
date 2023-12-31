import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import Photo from './Photo';

/**
 * A materialized view that computes the effective address including corrections.
 */
@Entity('effective_addresses_view')
export default class EffectiveAddress {
  @PrimaryColumn()
  identifier: string;

  @Column({
    type: 'varchar',
  })
  address: string | null;

  @OneToOne(() => Photo, (photo) => photo.effectiveAddress)
  @JoinColumn({ name: 'identifier' })
  photo: Photo;
}
