import axios, { HttpStatusCode } from 'axios';
import { colorizePhoto } from 'shared/utils/ColorApi';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const STATUSES_WITH_MESSAGES: number[] = [
  HttpStatusCode.BadRequest,
  HttpStatusCode.NotFound,
];

interface State {
  identifier: string;
  isLoading: boolean;
  error: string | null;
}

interface Actions {
  setIdentifier(identifier: string): void;
  colorize(): Promise<void>;
}

const useColorizeStore = create(
  immer<State & Actions>((set, get) => ({
    identifier: '',
    isLoading: false,
    error: null,
    setIdentifier: (identifier) => {
      set((state) => {
        state.identifier = identifier;
      });
    },
    colorize: async () => {
      const { identifier } = get();
      if (!identifier) {
        return;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        window.location.assign(await colorizePhoto(identifier));
      } catch (err) {
        console.error('Colorization failed', err);
        const serverMessage =
          axios.isAxiosError<{ error?: string }>(err) &&
          err.response &&
          STATUSES_WITH_MESSAGES.includes(err.response.status)
            ? err.response.data?.error
            : undefined;
        set((state) => {
          state.error = serverMessage ?? 'Colorization failed. Try again.';
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
  }))
);

export default useColorizeStore;
