enum LoginOutcome {
  AlreadyAuthenticated = 'already_authenticated',
  SentLinkToNewAccount = 'sent_link_to_new_account',
  SentLinkToExistingAccount = 'sent_link_to_existing_account',
  NamedAnonymousAccount = 'named_anonymous_account',
}

export default LoginOutcome;
