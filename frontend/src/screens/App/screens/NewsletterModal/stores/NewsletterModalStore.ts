import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from 'shared/utils/api';

interface State {
  isOpen: boolean;
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
}

interface Actions {
  open: () => void;
  close: () => void;
  setEmail: (email: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

const useNewsletterModalStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    email: '',
    isSubmitting: false,
    isSuccess: false,
    errorMessage: null,

    open: () => {
      set((draft) => {
        draft.isOpen = true;
        draft.email = '';
        draft.isSubmitting = false;
        draft.isSuccess = false;
        draft.errorMessage = null;
      });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
      });
    },

    setEmail: (email: string) => {
      set((draft) => {
        draft.email = email;
        draft.errorMessage = null;
      });
    },

    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();

      const { email } = get();

      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        set((draft) => {
          draft.errorMessage = 'Please enter a valid email address';
        });
        return;
      }

      set((draft) => {
        draft.isSubmitting = true;
        draft.errorMessage = null;
      });

      try {
        await api.post('/email-campaigns/mailing-list', {
          address: email,
          source: 'signup-form',
        });

        set((draft) => {
          draft.isSuccess = true;
          draft.email = '';
        });

        // Close modal after success message
        setTimeout(() => {
          set((draft) => {
            draft.isSuccess = false;
            draft.isOpen = false;
          });
        }, 2000);
      } catch (err) {
        set((draft) => {
          draft.errorMessage = 'Failed to subscribe. Please try again.';
        });
      } finally {
        set((draft) => {
          draft.isSubmitting = false;
        });
      }
    },

    reset: () => {
      set((draft) => {
        draft.email = '';
        draft.errorMessage = null;
        draft.isSuccess = false;
      });
    },
  }))
);

export default useNewsletterModalStore;
