import { ServerClient, TemplatedMessage } from 'postmark';
import isProduction from '../../utils/isProduction';
import { EmailResult, EmailService, TemplatedEmailData } from './EmailService';

const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN;

class PostmarkEmailService implements EmailService {
  private client: ServerClient;

  constructor() {
    if (!POSTMARK_TOKEN) throw new Error('POSTMARK_TOKEN is not defined');
    this.client = new ServerClient(POSTMARK_TOKEN);
  }

  async sendTemplateEmail(options: TemplatedEmailData): Promise<EmailResult> {
    const {
      templateAlias,
      from,
      to,
      templateContext,
      metadata,
      referenceMessageId,
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
    };

    // Refuse to send to real email addresses in dev
    if (!isProduction() && !to.endsWith('@1940s.nyc')) {
      console.log('[DEV]', 'EmailService.sendTemplateEmail', apiParams);
      return { messageId: 'fake-message-id' };
    }

    const { MessageID: messageId } = await this.client.sendEmailWithTemplate(
      apiParams
    );

    return { messageId };
  }
}

export default new PostmarkEmailService();
