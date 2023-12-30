enum LoginOutcome {
  AlreadyAuthenticated = 'already_authenticated',
  UpdatedEmailOnAuthenticatedAccount = 'updated_email_on_authenticated_account',
  SentLinkToExistingAccount = 'sent_link_to_existing_account',
  SentLinkToVerifyEmail = 'sent_link_to_verify_email',
}

export default LoginOutcome;
