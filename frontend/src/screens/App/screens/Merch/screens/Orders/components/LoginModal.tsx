import React from 'react';

import LoginForm from 'shared/components/LoginForm';
import FourtiesModal from 'shared/components/Modal';
import useLoginStore from 'shared/stores/LoginStore';
import useOrdersStore from '../shared/stores/OrdersStore';

export default function LoginModal(): JSX.Element {
  const { isLoginOpen, closeLogin } = useOrdersStore();

  const { isLoginValidated } = useLoginStore();

  return (
    <FourtiesModal
      isOpen={isLoginOpen}
      onRequestClose={closeLogin}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="small"
      isCloseButtonVisible={true}
    >
      <div>
        <h1>Log in</h1>

        <p>
          Enter the email address your order was placed with to log into your
          account.
        </p>

        <LoginForm newEmailBehavior="reject" />

        {isLoginValidated && (
          <p>You are logged in. Close this dialog to return to your orders.</p>
        )}
      </div>
    </FourtiesModal>
  );
}
