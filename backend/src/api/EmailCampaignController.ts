import {
  Body,
  Controller,
  Header,
  Post,
  Request,
  Route,
  Security,
} from '@tsoa/runtime';
import * as express from 'express';
import { BadRequest } from 'http-errors';
import EmailCampaignService from '../business/email/EmailCampaignService';
import { verifyRecaptchaToken } from '../business/utils/grecaptcha';
import { Email } from './CommonApiTypes';

type MailingListRequest = {
  address: Email;
  source?: string;
};

type EmailCampaignRequest = {
  template: string;
  livemode: boolean;
  sendOn: Date;
};

@Route('email-campaigns')
export class EmailCampaignController extends Controller {
  @Post('/mailing-list')
  public async addEmailToMailingList(
    @Body() mailingListRequest: MailingListRequest,
    @Header('X-Recaptcha-Token') recaptchaToken: string,
    @Request() req: express.Request
  ): Promise<void> {
    await verifyRecaptchaToken(recaptchaToken, req.ip);
    await EmailCampaignService.addToMailingList(
      mailingListRequest.address,
      mailingListRequest.source ?? null
    );
  }

  @Security('netlify', ['email-campaigns'])
  @Post('/send-campaign')
  public async sendEmailCampaign(
    @Body() emailCampaignRequest: EmailCampaignRequest
  ): Promise<void> {
    if (emailCampaignRequest.sendOn < new Date()) {
      throw new BadRequest('Cannot schedule email campaign in the past');
    }
    await EmailCampaignService.enqueueEmailCampaign(
      emailCampaignRequest.template,
      emailCampaignRequest.livemode,
      emailCampaignRequest.sendOn
    );
  }
}
