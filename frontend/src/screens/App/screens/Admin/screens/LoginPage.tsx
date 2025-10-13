import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { To } from 'react-router-dom';
import Button from 'shared/components/Button';
import useAuthStore from 'shared/stores/AuthStore';

export default function LoginPage(): JSX.Element {
  const login = useAuthStore((state) => state.login);
  const close = useAuthStore((state) => state.close);
  const isAutheticated = useAuthStore((state) => state.isAutheticated);
  const returnToRoute = useAuthStore((state) => state.returnToRoute);

  const location = useLocation<{ from?: To }>();
  const navigate = useNavigate();

  const from: To = location.state?.from || returnToRoute || '/';

  // If authenticated, redirect to the page they were trying to access
  React.useEffect(() => {
    if (isAutheticated) {
      navigate(from, { replace: true });
    } else {
      //automatically trigger login modal
      login(from);
    }

    return () => {
      close();
    };
  }, [isAutheticated, navigate, from, login, close]);

  return (
    <div>
      <h1>Login</h1>
      <Button buttonStyle="primary" onClick={() => login()}>
        Login
      </Button>
    </div>
  );
}
