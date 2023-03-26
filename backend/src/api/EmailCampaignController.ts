import { Body, Controller, Post, Route, Security } from 'tsoa';
import EmailCampaignService from '../business/email/EmailCampaignService';
import { BadRequest } from 'http-errors';

type MailingListRequest = {
  address: string;
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
    @Body() mailingListRequest: MailingListRequest
  ): Promise<void> {
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
