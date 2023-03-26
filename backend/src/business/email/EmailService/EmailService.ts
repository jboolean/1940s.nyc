import EmailStreamType from '../templates/EmailStreamType';

export type TemplatedEmailData = {
  templateAlias: string;
  from: string;
  streamType: EmailStreamType;

  to: string;
  templateContext: object;
  metadata: Record<string, string>;
  referenceMessageId?: string;
};

export type EmailResult = {
  messageId: string;
  statusMessage: string;
  code: number;
};

export interface EmailService {
  sendTemplateEmail(
    options: TemplatedEmailData,
    livemode?: boolean
  ): Promise<EmailResult>;

  sendBulkTemplateEmail(
    options: TemplatedEmailData[],
    livemode?: boolean
  ): Promise<EmailResult[]>;
}
