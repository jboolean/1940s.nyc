import { ServerClient, TemplatedMessage } from 'postmark';
import isProduction from '../../utils/isProduction';
import { EmailResult, EmailService, TemplatedEmailData } from './EmailService';
import uniqueId from 'lodash/uniqueId';
import EmailStreamType from '../templates/EmailStreamType';

const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN;

const streamIds: Record<EmailStreamType, string> = {
  [EmailStreamType.TRANSACTIONAL]: 'outbound',
  [EmailStreamType.BROADCAST]: 'broadcast',
};

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
      to.split(',').some((address) => !address.endsWith('@1940s.nyc'))
    ) {
      console.log('[DEV]', 'EmailService.sendTemplateEmail', apiParams);
      return { messageId: uniqueId('fake-message-id-') };
    }

    const { MessageID: messageId } = await this.client.sendEmailWithTemplate(
      apiParams
    );

    return { messageId };
  }
}

export default new PostmarkEmailService();
