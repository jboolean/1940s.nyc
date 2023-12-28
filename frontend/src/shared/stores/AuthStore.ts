import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

import netlifyIdentity, { User } from 'netlify-identity-widget';
import pick from 'lodash/pick';
import { LocationDescriptor } from 'history';

interface State {
  isAutheticated: boolean;
  user: User | null;
  jwt: string | null;
  returnToRoute?: LocationDescriptor;
}

interface Actions {
  login(returnTo?: LocationDescriptor): void;
  signout(): void;
  close(): void;
}

// Auth store is for admin login only
const useAuthStore = create(
  persist(
    immer<State & Actions>((set) => ({
      isAutheticated: false,
      user: null,
      jwt: null,
      login: (returnToRoute: LocationDescriptor) => {
        netlifyIdentity.open('login');
        set((state) => {
          state.returnToRoute = returnToRoute;
        });
      },
      signout: async () => {
        await netlifyIdentity.logout();
      },
      close: () => {
        netlifyIdentity.close();
      },
    })),
    // persists the returnToRoute to local storage, so that we may return after login
    {
      name: 'auth',
      getStorage: () => localStorage,
      partialize: (state) => pick(state, 'returnToRoute'),
    }
  )
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
