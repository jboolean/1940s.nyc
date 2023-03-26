import { ServerClient, TemplatedMessage } from 'postmark';
import isProduction from '../../utils/isProduction';
import { EmailResult, EmailService, TemplatedEmailData } from './EmailService';
import EmailStreamType from '../templates/EmailStreamType';
import required from '../../utils/required';

const POSTMARK_TOKEN = required(process.env.POSTMARK_TOKEN, 'POSTMARK_TOKEN');
const POSTMARK_SANDBOX_TOKEN = required(
  process.env.POSTMARK_SANDBOX_TOKEN,
  'POSTMARK_SANDBOX_TOKEN'
);

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

    // Refuse to send to real email addresses in dev
    if (
      !isProduction() &&
      to.split(',').some((address) => !address.endsWith('@1940s.nyc')) &&
      livemode
    ) {
      console.log(
        'Refusing to send email to real address in dev. Forcing testmode.',
        {
          apiParams,
        }
      );
      livemode = false;
    }

    const client = this.getClient(livemode);

    const { MessageID: messageId } = await client.sendEmailWithTemplate(
      apiParams
    );

    return { messageId };
  }
}

export default new PostmarkEmailService();
