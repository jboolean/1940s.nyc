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
  Security,
} from 'tsoa';

import { BadRequest, Forbidden, NotFound } from 'http-errors';
import { onStateTransition } from '../../business/stories/StoriesService';
import {
  getStoryFromToken,
  verifyStoryToken,
} from '../../business/stories/StoryTokenService';
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
  story.photoId = storyRequest.photo;
  story.storyType = storyRequest.storyType;
  story.textContent = storyRequest.textContent;

  story.storytellerEmail = storyRequest.storytellerEmail
    ? normalizeEmail(storyRequest.storytellerEmail)
    : undefined;
  story.storytellerName = storyRequest.storytellerName;
  story.storytellerSubtitle = storyRequest.storytellerSubtitle;

  story.state = storyRequest.state;
}

function isStoryValid(story: Story): boolean {
  // Validation is lax for stories in these states
  if (
    [StoryState.DRAFT, StoryState.USER_REMOVED, StoryState.REJECTED].includes(
      story.state
    )
  ) {
    return true;
  }

  return !!(
    story.storytellerEmail &&
    story.storytellerName &&
    story.storytellerSubtitle &&
    story.storyType &&
    story.photoId &&
    // story.lngLat &&
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
      story.lngLat = await getLngLatForIdentifier(story.photoId);
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
    @Path('id') id: number,
    @Header('X-Story-Token') token?: string
  ): Promise<StoryDraftResponse> {
    let story = await StoryRepository().findOneBy({ id });

    if (!story) {
      throw new NotFound();
    }

    const originalState = story.state;

    // Can only mutate drafts or if you have a valid token
    const canMutate: boolean =
      originalState === StoryState.DRAFT ||
      (!!token && verifyStoryToken(token, story.id));

    if (!canMutate) {
      throw new BadRequest('Cannot be edited');
    }

    // Users can only move stories to DRAFT or SUBMITTED or USER_REMOVED.
    // Moderators use different endpoint to move stories to other states.
    if (
      ![
        StoryState.SUBMITTED,
        StoryState.DRAFT,
        StoryState.USER_REMOVED,
      ].includes(updates.state)
    ) {
      throw new BadRequest(
        `Not valid state transition: ${originalState}=>${updates.state}`
      );
    }

    updateModelFromRequest(story, updates);

    if (!isStoryValid(story)) {
      throw new BadRequest('Story is not valid for submission');
    }

    story = await StoryRepository().save(story);

    await onStateTransition(id, originalState, story.state);

    return toDraftStoryResponse(story);
  }

  @Get('/by-token')
  public async getStoryByToken(
    @Header('X-Story-Token') token: string
  ): Promise<StoryDraftResponse> {
    const storyIdAllowedByToken = getStoryFromToken(token);

    if (!storyIdAllowedByToken) {
      throw new Forbidden();
    }

    const story = await StoryRepository().findOneBy({
      id: storyIdAllowedByToken,
    });

    if (!story) {
      throw new NotFound();
    }

    return toDraftStoryResponse(story);
  }

  @Get('/')
  public async getStories(
    @Query('forPhotoIdentifier') identifier?: string
  ): Promise<PublicStoryResponse[]> {
    let stories: Story[];

    if (identifier) {
      stories = await StoryRepository().findPublishedForPhotoIdentifier(
        identifier
      );
    } else {
      stories = await StoryRepository().findPublished();
    }

    return map(stories, toPublicStoryResponse);
  }

  @Security('netlify', ['moderator'])
  @Get('/needs-review')
  public async getStoriesNeedingReview(): Promise<AdminStoryResponse[]> {
    const stories = await StoryRepository().findForReview();

    return map(stories, toAdminStoryResponse);
  }

  @Security('netlify', ['moderator'])
  @Patch('/{id}/state')
  public async updateStoryState(
    @Path('id') id: number,
    @Body() updates: { state: StoryState }
  ): Promise<AdminStoryResponse> {
    let story = await StoryRepository().findOneBy({ id });

    if (!story) {
      throw new NotFound();
    }

    const originalState = story.state;

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

    await onStateTransition(id, originalState, story.state);

    return toAdminStoryResponse(story);
  }
}
