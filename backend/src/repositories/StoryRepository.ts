import { Brackets, getRepository, In, IsNull, Repository } from 'typeorm';
import Story from '../entities/Story';
import StoryState from '../enum/StoryState';
import getLngLatForIdentifier from './getLngLatForIdentifier';

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
            qb.where({ photoId: identifier });

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

    /**
     * For user-facing endpoints, get a story that is public or allowed to access by a user token
     * @param this
     * @param storyIdAllowedByToken id of story to allow access to even if not published
     * @returns
     */
    async findOnePublicById(
      this: Repository<Story>,
      storyId: number,
      storyIdAllowedByToken?: number
    ) {
      return this.createQueryBuilder('story')
        .where({ id: storyId })
        .andWhere(
          new Brackets((qb) => {
            qb.where({ state: StoryState.PUBLISHED });

            if (storyIdAllowedByToken) {
              qb.orWhere({ id: storyIdAllowedByToken });
            }
          })
        )
        .leftJoinAndSelect('story.photo', 'photo')
        .getOne();
    },

    async findForReview(this: Repository<Story>) {
      return this.createQueryBuilder('story')
        .where({ state: StoryState.SUBMITTED })
        .orderBy('story.updated_at', 'ASC')
        .leftJoinAndSelect('story.photo', 'photo')
        .getMany();
    },

    async findForEmailBackfill(this: Repository<Story>) {
      return this.createQueryBuilder('story')
        .where({
          state: In([StoryState.SUBMITTED, StoryState.PUBLISHED]),
          lastEmailMessageId: IsNull(),
        })
        .orderBy('story.created_at', 'ASC')
        .leftJoinAndSelect('story.photo', 'photo')
        .getMany();
    },
  });

export default StoryRepository;
