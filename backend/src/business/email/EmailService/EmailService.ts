export type TemplatedEmailData = {
  templateAlias: string;
  from: string;

  to: string;
  templateContext: object;
  metadata: Record<string, string>;
};

export type EmailResult = {
  messageId: string;
};

export interface EmailService {
  sendTemplateEmail(options: TemplatedEmailData): Promise<EmailResult>;
}
