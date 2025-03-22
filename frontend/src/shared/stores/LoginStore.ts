import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  getMe,
  LoginOutcome,
  processLoginRequest,
} from '../utils/AuthenticationApi';

interface State {
  emailAddress: string;
  isLoginValidated: boolean;
  isFollowMagicLinkMessageVisible: boolean;
  isVerifyEmailMessageVisible: boolean;
  isEmailUpdatedMessageVisible: boolean;
  isLoadingMe: boolean;
}

interface Actions {
  initialize: () => void;
  onEmailAddressChange: (emailAddress: string) => void;
  onSubmitLogin: ({
    requireVerifiedEmail,
  }: {
    requireVerifiedEmail: boolean;
  }) => void;
}

const useLoginStore = create(
  immer<State & Actions>((set, get) => ({
    emailAddress: '',
    isLoginValidated: false,
    isFollowMagicLinkMessageVisible: false,
    isVerifyEmailMessageVisible: false,
    isEmailUpdatedMessageVisible: false,
    isLoadingMe: false,

    initialize: () => {
      set((draft) => {
        draft.isLoginValidated = false;
        draft.isLoadingMe = true;
      });
      getMe()
        .then((me) => {
          set((draft) => {
            draft.emailAddress = me.email || '';
            draft.isFollowMagicLinkMessageVisible = false;
            draft.isVerifyEmailMessageVisible = false;
            draft.isEmailUpdatedMessageVisible = false;
          });
        })
        .catch((err: unknown) => {
          console.warn('Error fetching me', err);
        })
        .finally(() => {
          set((draft) => {
            draft.isLoadingMe = false;
          });
        });
    },

    onEmailAddressChange: (emailAddress: string) => {
      set((draft) => {
        draft.emailAddress = emailAddress;
        draft.isFollowMagicLinkMessageVisible = false;
        draft.isEmailUpdatedMessageVisible = false;
        draft.isLoginValidated = false;
      });
    },

    onSubmitLogin: async ({ requireVerifiedEmail }) => {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('noWelcome', 'true');
      const returnToPath =
        window.location.pathname +
        '?' +
        searchParams.toString() +
        window.location.hash;
      const outcome = await processLoginRequest(
        get().emailAddress,
        returnToPath,
        requireVerifiedEmail
      );
      if (
        outcome === LoginOutcome.AlreadyAuthenticated ||
        outcome === LoginOutcome.UpdatedEmailOnAuthenticatedAccount
      ) {
        set((draft) => {
          // We stay logged into the current account and can proceed
          draft.isLoginValidated = true;
          draft.isFollowMagicLinkMessageVisible = false;
          draft.isVerifyEmailMessageVisible = false;
        });
        if (outcome === LoginOutcome.UpdatedEmailOnAuthenticatedAccount) {
          set((draft) => {
            // The user must follow the link to log into another account
            draft.isEmailUpdatedMessageVisible = true;
          });
        }
      } else if (outcome === LoginOutcome.SentLinkToExistingAccount) {
        set((draft) => {
          // The user must follow the link to log into another account, or verify their email
          draft.isFollowMagicLinkMessageVisible = true;
        });
      } else if (outcome === LoginOutcome.SentLinkToVerifyEmail) {
        set((draft) => {
          // The user must follow the link to verify their email
          draft.isVerifyEmailMessageVisible = true;
        });
      }
    },
  }))
);

export default useLoginStore;
