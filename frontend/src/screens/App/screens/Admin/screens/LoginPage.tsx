import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Button from 'shared/components/Button';
import useAuthStore from 'shared/stores/AuthStore';

export default function LoginPage(): JSX.Element {
  const login = useAuthStore((state) => state.login);
  const close = useAuthStore((state) => state.close);
  const isAutheticated = useAuthStore((state) => state.isAutheticated);

  const location = useLocation<{ from?: string }>();
  const history = useHistory();

  const { from } = location.state || { from: { pathname: '/' } };

  // If authenticated, redirect to the page they were trying to access
  React.useEffect(() => {
    if (isAutheticated) {
      history.replace(from);
    } else {
      //automatically trigger login modal
      login();
    }

    return () => {
      close();
    };
  }, [isAutheticated, history, from, login, close]);

  return (
    <div>
      <h1>Login</h1>
      <Button buttonStyle="primary" onClick={() => login()}>
        Login
      </Button>
    </div>
  );
}
