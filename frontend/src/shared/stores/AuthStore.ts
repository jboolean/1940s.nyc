import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import netlifyIdentity, { User } from 'netlify-identity-widget';

interface State {
  isAutheticated: boolean;
  user: User | null;
  jwt: string | null;
}

interface Actions {
  login(): void;
  signout(): void;
  close(): void;
}

const useAuthStore = create(
  immer<State & Actions>(() => ({
    isAutheticated: false,
    user: null,
    jwt: null,
    login: () => {
      netlifyIdentity.open('login');
    },
    signout: async () => {
      await netlifyIdentity.logout();
    },
    close: () => {
      netlifyIdentity.close();
    },
  }))
);

netlifyIdentity.on('logout', () => {
  useAuthStore.setState((state: State) => {
    state.isAutheticated = false;
    state.user = null;
    state.jwt = null;
  });
});
netlifyIdentity.on('login', (user) => {
  netlifyIdentity.refresh().then((jwt) => {
    useAuthStore.setState((state) => {
      state.isAutheticated = true;
      state.user = user;
      state.jwt = jwt;
    });
  }, console.error);
});

export default useAuthStore;
