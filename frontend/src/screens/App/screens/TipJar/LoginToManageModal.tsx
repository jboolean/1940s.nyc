import React from 'react';

import LoginForm from 'shared/components/LoginForm';
import FourtiesModal from 'shared/components/Modal';
import useLoginStore from 'shared/stores/LoginStore';
import useTipJarStore from './TipJarStore';

export default function LoginToManageModal(): JSX.Element {
  const { isLoginOpen, closeLogin, redirectToCustomerPortal } =
    useTipJarStore();

  const isLoginValidPrev = React.useRef(false);

  const { isLoginValidated } = useLoginStore();

  React.useEffect(() => {
    if (isLoginValidated && !isLoginValidPrev.current) {
      void redirectToCustomerPortal();
    }

    isLoginValidPrev.current = isLoginValidated;
  }, [isLoginValidated, redirectToCustomerPortal]);

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
        <h1>Supporter dashboard</h1>

        <p>
          Enter your email address to continue to your{' '}
          <i>Supporter Dashboard</i> to manage subscriptions and payments.
        </p>

        <LoginForm newEmailBehavior="reject" />
      </div>
    </FourtiesModal>
  );
}
