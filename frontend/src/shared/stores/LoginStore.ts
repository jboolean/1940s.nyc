import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  getMe,
  LoginOutcome,
  logout,
  processLoginRequest,
} from '../utils/AuthenticationApi';

interface State {
  emailAddress: string;
  isLoginValidated: boolean;
  isLoggedInToNonAnonymousAccount: boolean;
  isFollowMagicLinkMessageVisible: boolean;
  isVerifyEmailMessageVisible: boolean;
  isEmailUpdatedMessageVisible: boolean;
  isAccountDoesNotExistMessageVisible: boolean;
  isNewAccountCreatedMessageVisible: boolean;
  isLoadingMe: boolean;
}

interface Actions {
  initialize: () => void;
  onEmailAddressChange: (emailAddress: string) => void;
  onSubmitLogin: ({
    requireVerifiedEmail,
    newEmailBehavior,
  }: {
    requireVerifiedEmail: boolean;
    newEmailBehavior?: 'update' | 'reject' | 'create';
  }) => void;
  logout: () => void;
}

const useLoginStore = create(
  immer<State & Actions>((set, get) => ({
    emailAddress: '',
    isLoginValidated: false,
    isLoggedInToNonAnonymousAccount: false,
    isFollowMagicLinkMessageVisible: false,
    isVerifyEmailMessageVisible: false,
    isEmailUpdatedMessageVisible: false,
    isAccountDoesNotExistMessageVisible: false,
    isNewAccountCreatedMessageVisible: false,
    isLoadingMe: false,

    initialize: () => {
      set((draft) => {
        draft.isLoginValidated = false;
        draft.isLoggedInToNonAnonymousAccount = false;
        draft.isLoadingMe = true;
      });
      getMe()
        .then((me) => {
          set((draft) => {
            draft.emailAddress = me.email || '';
            // If getMe returns an email, the user is logged in to a non-anonymous account
            draft.isLoggedInToNonAnonymousAccount = !!me.email;
            draft.isFollowMagicLinkMessageVisible = false;
            draft.isVerifyEmailMessageVisible = false;
            draft.isEmailUpdatedMessageVisible = false;
            draft.isNewAccountCreatedMessageVisible = false;
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
        // Don't reset isLoggedInToNonAnonymousAccount here as it's based on the server state
      });
    },

    onSubmitLogin: async ({ requireVerifiedEmail, newEmailBehavior }) => {
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
        newEmailBehavior,
        requireVerifiedEmail
      );
      if (
        outcome === LoginOutcome.AlreadyAuthenticated ||
        outcome === LoginOutcome.UpdatedEmailOnAuthenticatedAccount ||
        outcome === LoginOutcome.CreatedNewAccount
      ) {
        set((draft) => {
          // We stay logged into the current account and can proceed
          draft.isLoginValidated = true;
          draft.isLoggedInToNonAnonymousAccount = true;
          draft.isFollowMagicLinkMessageVisible = false;
          draft.isVerifyEmailMessageVisible = false;
        });
        if (outcome === LoginOutcome.UpdatedEmailOnAuthenticatedAccount) {
          set((draft) => {
            draft.isEmailUpdatedMessageVisible = true;
          });
        }
        if (outcome === LoginOutcome.CreatedNewAccount) {
          set((draft) => {
            draft.isNewAccountCreatedMessageVisible = true;
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
      } else if (outcome === LoginOutcome.AccountDoesNotExist) {
        set((draft) => {
          // No such account, authentication failed
          draft.isAccountDoesNotExistMessageVisible = true;
        });
      }
    },
    logout: async () => {
      await logout();
      get().initialize();
    },
  }))
);

export default useLoginStore;
