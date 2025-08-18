import api from 'utils/api';

export enum LoginOutcome {
  AlreadyAuthenticated = 'already_authenticated',
  UpdatedEmailOnAuthenticatedAccount = 'updated_email_on_authenticated_account',
  SentLinkToExistingAccount = 'sent_link_to_existing_account',
  SentLinkToVerifyEmail = 'sent_link_to_verify_email',
  AccountDoesNotExist = 'account_does_not_exist',
  CreatedNewAccount = 'created_new_account',
}

export async function processLoginRequest(
  requestedEmail: string,
  returnToPath?: string,
  newEmailBehavior?: 'update' | 'reject' | 'create',
  requireVerifiedEmail = false
): Promise<LoginOutcome> {
  const resp = await api.post<{ outcome: LoginOutcome }>(
    '/authentication/request-login',
    {
      requestedEmail,
      returnToPath,
      requireVerifiedEmail,
      newEmailBehavior,
    }
  );
  return resp.data.outcome;
}

export async function getMe(): Promise<{ email: string | null }> {
  const resp = await api.get<{ email: string | null }>('/authentication/me');
  return resp.data;
}

export async function logout(): Promise<void> {
  await api.post('/authentication/logout');
}
