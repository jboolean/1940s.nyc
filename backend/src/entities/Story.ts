import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import PointColumnOptions from '../business/utils/PointColumnOptions';
import LngLat from '../enum/LngLat';
import StoryState from '../enum/StoryState';
import StoryType from '../enum/StoryType';
import EffectiveGeocode from './EffectiveGeocode';
import Photo from './Photo';

@Entity('stories')
export default class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  storyType: StoryType;

  @Column()
  state: StoryState;

  @Column({
    type: String,
    nullable: true,
  })
  storytellerEmail!: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  storytellerName!: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  storytellerSubtitle!: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  title!: string | null;

  @Column(PointColumnOptions)
  lngLat: LngLat | null;

  @Column({ name: 'photo' })
  photoId: string;

  @ManyToOne(() => Photo, (photo) => photo.stories)
  @JoinColumn({ name: 'photo' })
  photo: Photo;

  @ManyToOne(
    () => EffectiveGeocode,
    (effectiveGeocode) => effectiveGeocode.stories
  )
  @JoinColumn({ name: 'photo' })
  effectiveGeocode: EffectiveGeocode;

  @Column({
    type: 'text',
    nullable: true,
  })
  textContent!: string | null;

  @Column()
  recaptchaScore: number;

  @Column()
  lastEmailMessageId?: string;

  @Column()
  hasEverSubmitted: boolean;

  @Column()
  lastReviewer!: string | null;
}
