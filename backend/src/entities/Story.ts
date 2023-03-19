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

  @Column()
  storytellerEmail?: string;

  @Column()
  storytellerName?: string;

  @Column()
  storytellerSubtitle?: string;

  @Column()
  title?: string;

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

  @Column()
  textContent?: string;

  @Column()
  recaptchaScore: number;

  @Column()
  lastEmailMessageId?: string;

  @Column()
  hasEverSubmitted: boolean;
}
