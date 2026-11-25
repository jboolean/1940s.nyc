import { Errors, ServerClient, TemplatedMessage } from 'postmark';
import { MessageSendingResponse } from 'postmark/dist/client/models';
import isProduction from '../../utils/isProduction';
import required from '../../utils/required';
import EmailStreamType from '../templates/EmailStreamType';
import { EmailResult, EmailService, TemplatedEmailData } from './EmailService';

const POSTMARK_TOKEN = required(process.env.POSTMARK_TOKEN, 'POSTMARK_TOKEN');
const POSTMARK_SANDBOX_TOKEN = required(
  process.env.POSTMARK_SANDBOX_TOKEN,
  'POSTMARK_SANDBOX_TOKEN'
);

const DEV_ALLOWED_DOMAINS = [
  '@1940s.nyc',
  '@bounce-testing.postmarkapp.com',
  'blackhole.postmarkapp.com',
];

const TEMPLATE_NOT_FOUND_ERROR_CODE = 1101;

const streamIds: Record<EmailStreamType, string> = {
  [EmailStreamType.TRANSACTIONAL]: 'outbound',
  [EmailStreamType.BROADCAST]: 'broadcast',
};

class PostmarkEmailService implements EmailService {
  private client: ServerClient;
  private sandboxClient: ServerClient;

  constructor() {
    this.client = new ServerClient(POSTMARK_TOKEN);
    this.sandboxClient = new ServerClient(POSTMARK_SANDBOX_TOKEN);
  }

  private getClient(livemode: boolean): ServerClient {
    return livemode ? this.client : this.sandboxClient;
  }

  async sendTemplateEmail(
    options: TemplatedEmailData,
    livemode = true
  ): Promise<EmailResult> {
    const apiParams = PostmarkEmailService.createApiMessage(options);

    // Refuse to send to real email addresses in dev
    if (livemode && PostmarkEmailService.shouldForceTestmode([options])) {
      console.log(
        'Refusing to send email to real address in dev. Forcing testmode.',
        {
          apiParams,
        }
      );
      livemode = false;
    }

    const client = this.getClient(livemode);

    const resp = await client.sendEmailWithTemplate(apiParams);

    return PostmarkEmailService.mapPostmarkResponse(resp);
  }

  async sendBulkTemplateEmail(
    options: TemplatedEmailData[],
    livemode = true
  ): Promise<EmailResult[]> {
    const apiParams = options.map((option) =>
      PostmarkEmailService.createApiMessage(option)
    );

    // Refuse to send to real email addresses in dev
    if (livemode && PostmarkEmailService.shouldForceTestmode(options)) {
      console.log(
        'Refusing to send email to real address in dev. Forcing testmode.',
        {
          apiParams,
        }
      );
      livemode = false;
    }

    const client = this.getClient(livemode);

    const resp = await client.sendEmailBatchWithTemplates(apiParams);

    return resp.map((r) => PostmarkEmailService.mapPostmarkResponse(r));
  }

  async templateExists(
    templateAlias: string,
    livemode = true
  ): Promise<boolean> {
    try {
      await this.getClient(livemode).getTemplate(templateAlias);
      return true;
    } catch (err) {
      if (
        err instanceof Errors.PostmarkError &&
        err.code === TEMPLATE_NOT_FOUND_ERROR_CODE
      ) {
        return false;
      }
      throw err;
    }
  }

  private static createApiMessage(
    options: TemplatedEmailData
  ): TemplatedMessage {
    const {
      templateAlias,
      from,
      to,
      templateContext,
      metadata,
      referenceMessageId,
      streamType,
    } = options;

    const apiParams: TemplatedMessage = {
      From: from,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: templateContext,
      Metadata: metadata,
      Headers: referenceMessageId
        ? [
            {
              Name: 'References',
              Value: options.referenceMessageId || '',
            },
          ]
        : [],
      MessageStream: streamIds[streamType],
    };

    return apiParams;
  }

  private static mapPostmarkResponse(
    response: MessageSendingResponse
  ): EmailResult {
    return {
      messageId: response.MessageID,
      statusMessage: response.Message,
      code: response.ErrorCode,
    };
  }

  private static shouldForceTestmode(options: TemplatedEmailData[]): boolean {
    return (
      !isProduction() &&
      options
        .map((option) => option.to.split(','))
        .flat()
        .some(
          (address) =>
            !DEV_ALLOWED_DOMAINS.some((domain) => address.endsWith(domain))
        )
    );
  }
}

export default new PostmarkEmailService();
