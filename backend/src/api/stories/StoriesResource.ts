import express from 'express';
import map from 'lodash/map';
import { Brackets } from 'typeorm';
import getLngLatForIdentifier from '../../business/getLngLatForIdentifier';

import Story from '../../entities/Story';
import StoryState from '../../entities/StoryState';
import StoryType from '../../entities/StoryType';
import StoryRepository from '../../repositories/StoryRepository';
import ErrorResponse from '../ErrorResponse';
import {
  NewStoryRequest,
  PublicStoryResponse,
  StoryDraftResponse,
  StoryUpdateRequest,
} from './StoryApiModel';
import { toDraftStoryResponse, toPublicStoryResponse } from './storyToApi';

const router = express.Router();

function validateSubmittable(story: Story): boolean {
  return !!(
    story.storytellerEmail &&
    story.storytellerName &&
    story.storytellerSubtitle &&
    story.storyType &&
    story.photo &&
    story.lngLat &&
    (story.storyType !== StoryType.TEXT || story.textContent)
  );
}

function normalizeEmail(email: string): string {
  return email.toLocaleLowerCase();
}

router.post<unknown, StoryDraftResponse | ErrorResponse, NewStoryRequest>(
  '/',
  async (req, res) => {
    const storyRequest = req.body;

    let story = new Story();
    story.lngLat = storyRequest.lngLat;
    story.photo = storyRequest.photo;
    story.storyType = storyRequest.storyType;
    story.state = StoryState.DRAFT;
    story.textContent = storyRequest.textContent;

    story = await StoryRepository.save(story);

    const resp: StoryDraftResponse = toDraftStoryResponse(story);

    res.send(resp);
  }
);

router.put<
  { id: number },
  StoryDraftResponse | ErrorResponse,
  StoryUpdateRequest
>('/:id', async (req, res) => {
  const id = req.params.id;

  let story = await StoryRepository.findOneBy({ id });

  if (!story) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // Immutable unless it's a draft (prevent distruction of published stories until a real, authenticated editing function is implemented)
  if (story.state !== StoryState.DRAFT) {
    res.status(400).json({ error: 'Cannot be edited' });
    return;
  }

  const updates = req.body;

  // validate state transition
  if (![StoryState.SUBMITTED, StoryState.DRAFT].includes(updates.state)) {
    res
      .status(400)
      .json({
        error: `Not valid status transition: ${story.state}=>${updates.state}`,
      })
      .end();
    return;
  }

  story.storyType = updates.storyType;
  story.storytellerName = updates.storytellerName;
  story.storytellerEmail = normalizeEmail(updates.storytellerEmail);
  story.storytellerSubtitle = updates.storytellerSubtitle;
  story.textContent = updates.textContent;

  if (updates.state !== StoryState.DRAFT && !validateSubmittable(story)) {
    res.status(400).send({ error: 'Story is not valid for submission' });
    return;
  }
  story.state = updates.state;

  story = await StoryRepository.save(story);

  res.json(toDraftStoryResponse(story));
});

router.get<
  '/',
  never,
  PublicStoryResponse[] | ErrorResponse,
  never,
  { forPhotoIdentifier: string }
>('/', async (req, res) => {
  const { forPhotoIdentifier: identifier } = req.query;

  // Get the lng,lat for this photo, so we can return stories
  // for this photo and stories for other photos in the same location
  const maybeLngLat = await getLngLatForIdentifier(identifier);

  const stories = await StoryRepository.createQueryBuilder('story')
    .where({ state: StoryState.PUBLISHED })
    .andWhere(
      new Brackets((qb) => {
        qb.where({ photo: identifier });

        if (maybeLngLat) {
          const [lng, lat] = maybeLngLat.coordinates;
          qb.andWhere('story.lng_lat ~= point(:lng, :lat)', {
            lng,
            lat,
          });
        }
      })
    )
    .getMany();

  const storiesResp = map(stories, toPublicStoryResponse);

  res.json(storiesResp);
});
