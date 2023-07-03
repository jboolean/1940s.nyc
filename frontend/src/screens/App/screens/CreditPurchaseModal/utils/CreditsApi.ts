import api from 'utils/api';

export enum LoginOutcome {
  AlreadyAuthenticated = 'already_authenticated',
  UpdatedEmailOnAuthenticatedAccount = 'updated_email_on_authenticated_account',
  SentLinkToExistingAccount = 'sent_link_to_existing_account',
}

export async function processLoginRequest(
  requestedEmail: string,
  returnToPath?: string
): Promise<LoginOutcome> {
  const resp = await api.post<{ outcome: LoginOutcome }>(
    '/authentication/request-login',
    {
      requestedEmail,
      returnToPath,
    }
  );
  return resp.data.outcome;
}
