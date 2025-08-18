import React from 'react';

import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import TextInput from 'shared/components/TextInput';

import useLoginStore from 'shared/stores/LoginStore';
import stylesheet from './LoginForm.less';

export default function LoginForm({
  requireVerifiedEmail,
  newEmailBehavior,
}: {
  requireVerifiedEmail?: boolean;
  newEmailBehavior?: 'update' | 'reject' | 'create';
}): JSX.Element {
  const {
    emailAddress,
    isLoginValidated,
    onEmailAddressChange,
    onSubmitLogin,
    isFollowMagicLinkMessageVisible,
    isVerifyEmailMessageVisible,
    isEmailUpdatedMessageVisible,
    isAccountDoesNotExistMessageVisible,
    isNewAccountCreatedMessageVisible,
    isLoadingMe,
  } = useLoginStore();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitLogin({ requireVerifiedEmail, newEmailBehavior });
      }}
    >
      <div className={stylesheet.emailRow}>
        <Labeled
          labelText="Your email address"
          className={stylesheet.email}
          renderInput={({ id }) => (
            <TextInput
              id={id}
              type="email"
              value={emailAddress}
              autoComplete="email"
              required
              onChange={({ target: { value } }) => {
                onEmailAddressChange(value);
              }}
              disabled={isLoginValidated || isLoadingMe}
            />
          )}
        />

        <Button
          type="submit"
          buttonStyle="primary"
          disabled={isLoginValidated || !emailAddress || isLoadingMe}
          className={stylesheet.submitButton}
        >
          Continue
        </Button>
      </div>
      {isFollowMagicLinkMessageVisible && (
        <p className={stylesheet.resultMessage}>
          You already have an account. Please click the link emailed to{' '}
          <i>{emailAddress}</i> to log in.
        </p>
      )}
      {isVerifyEmailMessageVisible && (
        <p className={stylesheet.resultMessage}>
          Please verify your email address by clicking the link emailed to{' '}
          <i>{emailAddress}</i> to continue.
        </p>
      )}
      {isEmailUpdatedMessageVisible && (
        <p className={stylesheet.resultMessage}>
          Your email address on this account has been updated.
        </p>
      )}
      {isAccountDoesNotExistMessageVisible && (
        <p className={stylesheet.resultMessage}>
          No account found for <i>{emailAddress}</i>.
        </p>
      )}
      {isNewAccountCreatedMessageVisible && (
        <p className={stylesheet.resultMessage}>
          A new account has been created for <i>{emailAddress}</i>.
        </p>
      )}
    </form>
  );
}
