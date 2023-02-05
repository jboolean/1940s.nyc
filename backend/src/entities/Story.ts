import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import PointColumnOptions from '../business/utils/PointColumnOptions';
import LngLat from '../enum/LngLat';
import StoryState from '../enum/StoryState';
import StoryType from '../enum/StoryType';
import Photo from './Photo';

@Entity('stories')
export default class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

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

  @Column(PointColumnOptions)
  lngLat: LngLat | null;

  @Column({ name: 'photo' })
  photoId: string;

  @ManyToOne(() => Photo, (photo) => photo.stories)
  @JoinColumn({ name: 'photo' })
  photo: Photo;

  @Column()
  textContent?: string;

  @Column()
  recaptchaScore: number;

  @Column()
  lastEmailMessageId: string | null;

  @Column()
  hasEverSubmitted: boolean;
}
