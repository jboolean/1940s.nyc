import { getRepository } from 'typeorm';
import Story from '../entities/Story';

const StoryRepository = getRepository(Story);

export default StoryRepository;
