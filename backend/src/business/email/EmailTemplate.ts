import { TemplatedEmailData } from './EmailService';
import Senders from './templates/Senders';

abstract class EmailTemplate<
  TemplateData extends object,
  Metadata extends Record<keyof Metadata, string>
> {
  abstract readonly alias: string;
  abstract readonly from: typeof Senders[keyof typeof Senders];

  createTemplatedEmail({
    templateContext,
    metadata,
    to,
    referenceMessageId,
  }: {
    templateContext: TemplateData;
    metadata: Metadata;
    to: string;
    referenceMessageId?: string;
  }): TemplatedEmailData {
    return {
      templateAlias: this.alias,
      from: this.from,
      to,
      templateContext,
      metadata,
      referenceMessageId,
    };
  }
}

export default EmailTemplate;
