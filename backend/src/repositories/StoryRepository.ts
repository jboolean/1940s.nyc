import { Brackets, getRepository, Repository } from 'typeorm';
import getLngLatForIdentifier from './getLngLatForIdentifier';
import Story from '../entities/Story';
import StoryState from '../enum/StoryState';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- better type is inferred
const StoryRepository = () =>
  getRepository(Story).extend({
    async findForPhotoIdentifier(this: Repository<Story>, identifier: string) {
      // Get the lng,lat for this photo, so we can return stories
      // for this photo and stories for other photos in the same location
      const maybeLngLat = await getLngLatForIdentifier(identifier);

      return this.createQueryBuilder('story')
        .where({ state: StoryState.PUBLISHED })
        .andWhere(
          new Brackets((qb) => {
            qb.where({ photo: identifier });

            if (maybeLngLat) {
              const [lng, lat] = maybeLngLat.coordinates;
              qb.orWhere('story.lng_lat ~= point(:lng, :lat)', {
                lng,
                lat,
              });
            }
          })
        )
        .getMany();
    },
  });

export default StoryRepository;
