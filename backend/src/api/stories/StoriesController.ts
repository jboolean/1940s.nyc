import map from 'lodash/map';
import { Body, Controller, Get, Path, Post, Put, Query, Route } from 'tsoa';

import { BadRequest, NotFound } from 'http-errors';
import Story from '../../entities/Story';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';
import getLngLatForIdentifier from '../../repositories/getLngLatForIdentifier';
import StoryRepository from '../../repositories/StoryRepository';
import {
  NewStoryRequest,
  PublicStoryResponse,
  StoryDraftResponse,
  StoryUpdateRequest,
} from './StoryApiModel';
import { toDraftStoryResponse, toPublicStoryResponse } from './storyToApi';

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

@Route('stories')
export class StoriesController extends Controller {
  @Post('/')
  public async createStory(
    @Body() storyRequest: NewStoryRequest
  ): Promise<StoryDraftResponse> {
    let story = new Story();
    story.lngLat =
      storyRequest.lngLat ?? (await getLngLatForIdentifier(storyRequest.photo));
    story.photo = storyRequest.photo;
    story.storyType = storyRequest.storyType;
    story.state = StoryState.DRAFT;
    story.textContent = storyRequest.textContent;

    story = await StoryRepository().save(story);

    const resp: StoryDraftResponse = toDraftStoryResponse(story);

    return resp;
  }

  @Put('/{id}')
  public async updateStory(
    @Body() updates: StoryUpdateRequest,
    @Path('id') id: number
  ): Promise<StoryDraftResponse> {
    let story = await StoryRepository().findOneBy({ id });

    if (!story) {
      throw new NotFound();
    }

    // Immutable unless it's a draft (prevent distruction of published stories until a real, authenticated editing function is implemented)
    if (story.state !== StoryState.DRAFT) {
      throw new BadRequest('Cannot be edited');
    }

    // validate state transition
    if (![StoryState.SUBMITTED, StoryState.DRAFT].includes(updates.state)) {
      throw new BadRequest(
        `Not valid state transition: ${story.state}=>${updates.state}`
      );
    }

    story.storyType = updates.storyType;
    story.storytellerName = updates.storytellerName;
    story.storytellerEmail = normalizeEmail(updates.storytellerEmail);
    story.storytellerSubtitle = updates.storytellerSubtitle;
    story.textContent = updates.textContent;

    if (updates.state !== StoryState.DRAFT && !validateSubmittable(story)) {
      throw new BadRequest('Story is not valid for submission');
    }
    story.state = updates.state;

    story = await StoryRepository().save(story);

    return toDraftStoryResponse(story);
  }

  @Get('/')
  public async getStories(
    @Query('forPhotoIdentifier') identifier: string
  ): Promise<PublicStoryResponse[]> {
    const stories = await StoryRepository().findForPhotoIdentifier(identifier);

    return map(stories, toPublicStoryResponse);
  }
}
