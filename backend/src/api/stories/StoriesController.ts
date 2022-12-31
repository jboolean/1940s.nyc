import Express from 'express';
import isNumber from 'lodash/isNumber';
import map from 'lodash/map';
import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
} from 'tsoa';

import { BadRequest, Forbidden, NotFound } from 'http-errors';
import { validateRecaptchaToken } from '../../business/utils/grecaptcha';
import Story from '../../entities/Story';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';
import getLngLatForIdentifier from '../../repositories/getLngLatForIdentifier';
import StoryRepository from '../../repositories/StoryRepository';
import {
  AdminStoryResponse,
  PublicStoryResponse,
  StoryDraftRequest,
  StoryDraftResponse,
} from './StoryApiModel';
import {
  toAdminStoryResponse,
  toDraftStoryResponse,
  toPublicStoryResponse,
} from './storyToApi';

function normalizeEmail(email: string): string {
  return email.toLocaleLowerCase();
}

function updateModelFromRequest(
  story: Story,
  storyRequest: StoryDraftRequest
): void {
  story.lngLat = storyRequest.lngLat ?? null;
  story.photo = storyRequest.photo;
  story.storyType = storyRequest.storyType;
  story.textContent = storyRequest.textContent;

  story.storytellerEmail = storyRequest.storytellerEmail
    ? normalizeEmail(storyRequest.storytellerEmail)
    : undefined;
  story.storytellerName = storyRequest.storytellerName;
  story.storytellerSubtitle = storyRequest.storytellerSubtitle;
}

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

@Route('stories')
export class StoriesController extends Controller {
  @Post('/')
  public async createStory(
    @Body() storyRequest: StoryDraftRequest,
    @Header('X-Recaptcha-Token') recaptchaToken: string,
    @Request() request: Express.Request
  ): Promise<StoryDraftResponse> {
    let story = new Story();
    updateModelFromRequest(story, storyRequest);
    story.state = StoryState.DRAFT;

    // If lat/lng is not provided, try to get it from the photo
    if (!story.lngLat) {
      story.lngLat = await getLngLatForIdentifier(story.photo);
    }

    const ip = request.ip;
    const recaptchaResult = await validateRecaptchaToken(recaptchaToken, ip);

    if (!recaptchaResult.success || !isNumber(recaptchaResult.score)) {
      console.error('Recaptcha error', recaptchaResult['error-codes']);
      throw new Forbidden('Recaptcha failed');
    }

    story.recaptchaScore = recaptchaResult.score;

    story = await StoryRepository().save(story);

    const resp: StoryDraftResponse = toDraftStoryResponse(story);

    return resp;
  }

  @Put('/{id}')
  public async updateStory(
    @Body() updates: StoryDraftRequest,
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

    updateModelFromRequest(story, updates);

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

  // TODO Protect this route because it returns sensitive data
  @Get('/needs-review')
  public async getStoriesNeedingReview(): Promise<AdminStoryResponse[]> {
    const stories = await StoryRepository().findForReview();

    return map(stories, toAdminStoryResponse);
  }

  @Patch('/{id}/state')
  public async updateStoryState(
    @Path('id') id: number,
    @Body() updates: { state: StoryState }
  ): Promise<AdminStoryResponse> {
    let story = await StoryRepository().findOneBy({ id });

    if (!story) {
      throw new NotFound();
    }

    // validate state transition
    if (
      story.state !== StoryState.SUBMITTED ||
      ![StoryState.PUBLISHED, StoryState.REJECTED].includes(updates.state)
    ) {
      throw new BadRequest(
        `Not valid state transition: ${story.state}=>${updates.state}`
      );
    }

    story.state = updates.state;

    story = await StoryRepository().save(story);

    return toAdminStoryResponse(story);
  }
}
