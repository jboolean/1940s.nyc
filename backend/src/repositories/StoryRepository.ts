import { Brackets, getRepository, Repository } from 'typeorm';
import getLngLatForIdentifier from './getLngLatForIdentifier';
import Story from '../entities/Story';
import StoryState from '../enum/StoryState';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- better type is inferred
const StoryRepository = () =>
  getRepository(Story).extend({
    async findPublishedForPhotoIdentifier(
      this: Repository<Story>,
      identifier: string
    ) {
      // Get the lng,lat for this photo, so we can return stories
      // for this photo and stories for other photos in the same location
      const maybeLngLat = await getLngLatForIdentifier(identifier);

      return this.createQueryBuilder('story')
        .where({ state: StoryState.PUBLISHED })
        .andWhere(
          new Brackets((qb) => {
            qb.where({ photo: identifier });

            if (maybeLngLat) {
              const { lng, lat } = maybeLngLat;
              qb.orWhere('story.lng_lat ~= point(:lng, :lat)', {
                lng,
                lat,
              });
            }
          })
        )
        .leftJoinAndSelect('story.photo', 'photo')
        .orderBy('story.created_at', 'DESC')
        .getMany();
    },

    async findPublished(this: Repository<Story>) {
      return this.createQueryBuilder('story')
        .where({ state: StoryState.PUBLISHED })
        .orderBy('story.created_at', 'DESC')
        .leftJoinAndSelect('story.photo', 'photo')
        .getMany();
    },

    async findForReview(this: Repository<Story>) {
      return this.createQueryBuilder('story')
        .where({ state: StoryState.SUBMITTED })
        .orderBy('story.created_at', 'ASC')
        .leftJoinAndSelect('story.photo', 'photo')
        .getMany();
    },
  });

export default StoryRepository;
