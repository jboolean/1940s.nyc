import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import Button from 'shared/components/Button';
import useAuthStore from 'shared/stores/AuthStore';

export default function LoginPage(): JSX.Element {
  const login = useAuthStore((state) => state.login);
  const close = useAuthStore((state) => state.close);
  const isAutheticated = useAuthStore((state) => state.isAutheticated);
  const returnToRoute = useAuthStore((state) => state.returnToRoute);

  const location = useLocation();
  const navigate = useNavigate();

  const from: string =
    (location.state as { from?: string } | null)?.from || returnToRoute || '/';

  // If authenticated, redirect to the page they were trying to access
  React.useEffect(() => {
    if (isAutheticated) {
      void navigate(from, { replace: true });
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
