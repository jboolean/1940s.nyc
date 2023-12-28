import React from 'react';

import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import TextInput from 'shared/components/TextInput';

import useLoginStore from 'shared/stores/LoginStore';
import stylesheet from './LoginForm.less';

export default function LoginForm(): JSX.Element {
  const {
    emailAddress,
    isLoginValidated,
    onEmailAddressChange,
    onSubmitLogin,
    isFollowMagicLinkMessageVisible,
  } = useLoginStore();

  return (
    <form
      className={stylesheet.emailRow}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitLogin();
      }}
    >
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
            disabled={isLoginValidated}
          />
        )}
      />

      <Button
        type="submit"
        buttonStyle="primary"
        disabled={isLoginValidated || !emailAddress}
        className={stylesheet.submitButton}
      >
        Continue
      </Button>
      {isFollowMagicLinkMessageVisible && (
        <p className={stylesheet.magicLinkMessage}>
          You already have an account. Please click the link emailed to{' '}
          <i>{emailAddress}</i> to log in.
        </p>
      )}
    </form>
  );
}
